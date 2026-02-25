import React, { useMemo, useState } from "react";
import { Autocomplete, Button, TextField } from "@mui/material";
import axios, { AxiosError } from "axios";

import seoulBus from "@/assets/seoul_bus_id.json";

type BusOption = {
  rte_nm: string;
  rte_id: string;
};

type CorpItem = {
  corpNm?: string;
};

type BulkRouteInfoItem = {
  rte_id: string;
  rte_nm: string;
  headerCd?: string;
  headerMsg?: string;
  itemList: CorpItem[];
  fromCache?: boolean;
};

const extractPhone = (text: string) => {
  const match = text.match(/0\d{1,2}[- ]?\d{3,4}[- ]?\d{4}/);
  return match ? match[0] : "";
};

const ROUTE_INFO_CACHE_KEY = "busRouteInfoCacheV1";
const ROUTE_INFO_BULK_KEY = "busRouteInfoBulkV1";

const readRouteCache = (): Record<string, CorpItem[]> => {
  try {
    const raw = localStorage.getItem(ROUTE_INFO_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CorpItem[]>;
  } catch {
    return {};
  }
};

const writeRouteCache = (cache: Record<string, CorpItem[]>) => {
  localStorage.setItem(ROUTE_INFO_CACHE_KEY, JSON.stringify(cache));
};

const downloadJsonFile = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const sleep = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const BusComponent = () => {
  const serviceKey = decodeURIComponent(
    `${import.meta.env.VITE_DATA_API_EN_KEY || ""}`.trim(),
  );
  const BUS_ROUTE_INFO_URL = "/api/bus/busRouteInfo/getRouteInfo";
  // const BUS_ROUTE_INFO_URL =
  //   "http://ws.bus.go.kr/api/rest/busRouteInfo/getRouteInfo";

  const [busNumber, setBusNumber] = useState("");
  const [selectedBus, setSelectedBus] = useState<BusOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDoneCount, setBulkDoneCount] = useState(0);
  const [bulkSuccessCount, setBulkSuccessCount] = useState(0);
  const [bulkFailCount, setBulkFailCount] = useState(0);
  const [corpList, setCorpList] = useState<CorpItem[]>([]);
  const busOptions = useMemo(() => (seoulBus.DATA as BusOption[]) ?? [], []);

  const handleClickSubmit = async () => {
    if (!selectedBus) return;

    try {
      setLoading(true);
      const routeId = selectedBus.rte_id;
      const cache = readRouteCache();
      const cachedList = cache[routeId];
      if (cachedList?.length) {
        setCorpList(cachedList);
        return;
      }

      const response = await axios.get(BUS_ROUTE_INFO_URL, {
        params: {
          resultType: "json",
          ServiceKey: serviceKey,
          busRouteId: routeId,
        },
        timeout: 10000,
      });
      const itemList = (response.data?.msgBody?.itemList ?? []) as CorpItem[];
      console.log("getRouteInfo response", itemList);
      console.log("getRouteInfo header", response.data?.msgHeader);
      if (itemList.length > 0) {
        writeRouteCache({
          ...cache,
          [routeId]: itemList,
        });
      }
      setCorpList(itemList);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.code === "ECONNABORTED") {
        console.error("getRouteInfo timeout", axiosError.message);
      }
      if (axiosError.code === "ERR_NETWORK") {
        console.error("getRouteInfo network/cors error");
      }
      console.error("getRouteInfo error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickDownloadAll = async () => {
    if (bulkLoading) return;
    setBulkLoading(true);
    setBulkDoneCount(0);
    setBulkSuccessCount(0);
    setBulkFailCount(0);

    const cache = readRouteCache();
    const result: {
      generatedAt: string;
      total: number;
      successCount: number;
      failCount: number;
      data: Record<string, BulkRouteInfoItem>;
      failures: Array<{ rte_id: string; rte_nm: string; error: string }>;
    } = {
      generatedAt: new Date().toISOString(),
      total: busOptions.length,
      successCount: 0,
      failCount: 0,
      data: {},
      failures: [],
    };

    try {
      for (let i = 0; i < busOptions.length; i += 1) {
        const bus = busOptions[i];
        const routeId = bus.rte_id;
        const cachedList = cache[routeId];

        if (cachedList?.length) {
          result.successCount += 1;
          result.data[routeId] = {
            rte_id: routeId,
            rte_nm: bus.rte_nm,
            itemList: cachedList,
            fromCache: true,
          };
          setBulkSuccessCount(result.successCount);
          setBulkDoneCount(i + 1);
          continue;
        }

        try {
          const response = await axios.get(BUS_ROUTE_INFO_URL, {
            params: {
              resultType: "json",
              ServiceKey: serviceKey,
              busRouteId: routeId,
            },
            timeout: 10000,
          });
          const itemList = (response.data?.msgBody?.itemList ??
            []) as CorpItem[];
          const headerCd = response.data?.msgHeader?.headerCd as
            | string
            | undefined;
          const headerMsg = response.data?.msgHeader?.headerMsg as
            | string
            | undefined;

          cache[routeId] = itemList;
          result.successCount += 1;
          result.data[routeId] = {
            rte_id: routeId,
            rte_nm: bus.rte_nm,
            headerCd,
            headerMsg,
            itemList,
          };
          setBulkSuccessCount(result.successCount);
        } catch (error) {
          result.failCount += 1;
          result.failures.push({
            rte_id: routeId,
            rte_nm: bus.rte_nm,
            error: error instanceof Error ? error.message : String(error),
          });
          setBulkFailCount(result.failCount);
        } finally {
          setBulkDoneCount(i + 1);
          await sleep(120);
        }
      }

      result.generatedAt = new Date().toISOString();
      writeRouteCache(cache);
      localStorage.setItem(ROUTE_INFO_BULK_KEY, JSON.stringify(result));
      downloadJsonFile(`seoul_bus_route_info_${Date.now()}.json`, result);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <Autocomplete
          size="small"
          sx={{
            width: "240px",
            fontFamily: "GLight",
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#9bbcff",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#3a86ff",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#3a86ff",
                borderWidth: "2px",
              },
            },
          }}
          slotProps={{
            paper: {
              sx: {
                borderRadius: "16px",
                mt: 0.5,
                boxShadow: "0 10px 24px rgba(0, 0, 0, 0.12)",
              },
            },
          }}
          options={busOptions}
          value={selectedBus}
          inputValue={busNumber}
          freeSolo
          openOnFocus
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.rte_nm
          }
          isOptionEqualToValue={(option, value) =>
            typeof value !== "string" && option.rte_id === value.rte_id
          }
          filterOptions={(options, state) => {
            const keyword = state.inputValue.trim();
            if (!keyword) return options;
            return options.filter(
              (option) =>
                option.rte_nm.startsWith(keyword) ||
                option.rte_nm.endsWith(keyword),
            );
          }}
          onChange={(_, value) => {
            if (typeof value === "string") {
              setBusNumber(value.slice(0, 7));
              setSelectedBus(null);
              return;
            }
            setSelectedBus(value);
            setBusNumber(value?.rte_nm ?? "");
          }}
          onInputChange={(_, value) => {
            setBusNumber(value.slice(0, 7));
            setSelectedBus(null);
          }}
          ListboxProps={{
            sx: {
              maxHeight: "288px",
              overflowY: "auto",
              padding: "6px",
              "& .MuiAutocomplete-option": {
                borderRadius: "10px",
                minHeight: "34px",
              },
            },
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.rte_id}>
              {option.rte_nm}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="버스번호"
              inputProps={{ ...params.inputProps, maxLength: 7 }}
            />
          )}
        />
        <Button
          variant="contained"
          onClick={handleClickSubmit}
          disabled={loading || !selectedBus}
          sx={{
            fontFamily: "GMedium",
            borderRadius: "18px",
            padding: "8px 18px",
            color: "#ffffff",
            background: "linear-gradient(135deg, #22c1c3 0%, #3a86ff 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #1db1b3 0%, #2f74ea 100%)",
            },
          }}
        >
          검색
        </Button>
        {/* <Button
          variant="outlined"
          onClick={handleClickDownloadAll}
          disabled={bulkLoading}
          sx={{
            fontFamily: "GMedium",
            borderRadius: "18px",
            padding: "8px 18px",
          }}
        >
          {bulkLoading ? "전체 다운로드 중..." : "노선정보 다운로드"}
        </Button> */}
      </div>
      {bulkLoading && (
        <div className="glight" style={{ fontSize: 12 }}>
          진행률: {bulkDoneCount}/{busOptions.length} (성공 {bulkSuccessCount},
          실패 {bulkFailCount})
        </div>
      )}
      {corpList.length > 0 && (
        <>
          {/* <iframe
            src="https://news.seoul.go.kr/traffic/find#list/1"
            style={{ width: "100%", height: "600px", border: "none" }}
          /> */}

          {/* <div className="glight" style={{ fontWeight: 600 }}>
            운수사
          </div> */}
          <div style={{ marginBottom: "24px", marginTop: "16px" }}>
            {corpList.map((corp: any, index: number) => {
              const corpText = `${corp?.corpNm ?? ""}`;
              const phone = extractPhone(corpText);
              const tel = phone.replace(/[^0-9]/g, "");
              return (
                <div key={index}>
                  <div className="glight" style={{ paddingTop: "" }}>
                    <div>
                      {corpText}
                      {phone && (
                        <Button
                          component="a"
                          href={`tel:${tel}`}
                          size="small"
                          variant="contained"
                          sx={{
                            marginLeft: "8px",
                            minWidth: "72px",
                            padding: "2px 8px",
                            fontFamily: "GMedium",
                            fontSize: "12px",
                            backgroundColor: "#1f9900",
                            color: "#ffffff",
                            "&:hover": {
                              backgroundColor: "#1f6b25",
                            },
                          }}
                        >
                          문의하기
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <>
            <Button
              sx={{
                marginTop: "12px",
                width: "280px",
                fontFamily: "GMedium",
                borderRadius: "18px",
              }}
              variant="outlined"
              onClick={() =>
                window.open(
                  "https://news.seoul.go.kr/traffic/find#list/1",
                  "_blank",
                )
              }
            >
              서울시 대중교통 분실물센터 조회하기
            </Button>
            <Button
              sx={{
                width: "280px",
                fontFamily: "GMedium",
                borderRadius: "18px",
              }}
              variant="outlined"
              onClick={() =>
                window.open(
                  "https://www.lost112.go.kr/find/findList.do",
                  "_blank",
                )
              }
            >
              경찰청 분실물 조회하기
            </Button>
          </>
        </>
      )}
      <div className="glight" style={{ fontSize: 12, marginTop: "52px" }}>
        버스 분실물은 운수사에서 보관되는 경우가 많아
        <div>서울시 통합 분실물 센터에 등록되지 않을 수 있습니다.</div>
        <div className="gbold" style={{ marginTop: "12px" }}>
          운수사에 전화 문의하는 것이 가장 빠른 방법입니다.
        </div>
        <div style={{ marginTop: "12px" }}>
          일정 기간 주인을 찾지 못한 물품은 경찰서로 인계되며
        </div>
        <div>이후 LOST112에서 조회할 수 있습니다.</div>
      </div>
    </div>
  );
};

export default BusComponent;
