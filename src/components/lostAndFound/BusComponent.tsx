import React, { useMemo, useState } from "react";
import { Autocomplete, Button, TextField } from "@mui/material";
import axios from "axios";

import seoulBus from "@/assets/seoul_bus.json";

type BusOption = {
  rte_nm: string;
  rte_id: string;
};

const extractPhone = (text: string) => {
  const match = text.match(/0\d{1,2}[- ]?\d{3,4}[- ]?\d{4}/);
  return match ? match[0] : "";
};

const BusComponent = () => {
  // const VITE_DATA_API_EN_KEY = `${import.meta.env.VITE_DATA_API_EN_KEY}`;
  const VITE_SEOUL_DATA_API_DE_KEY = `${import.meta.env.VITE_SEOUL_DATA_API_DE_KEY}`;
  const VITE_DATA_API_EN_KEY = decodeURIComponent(
    `${import.meta.env.VITE_DATA_API_EN_KEY || ""}`,
  );

  const [busNumber, setBusNumber] = useState("");
  const [selectedBus, setSelectedBus] = useState<BusOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [corpName, setCorpName] = useState("");
  const [corpList, setCorpList] = useState([]);
  const busOptions = useMemo(() => (seoulBus.DATA as BusOption[]) ?? [], []);

  const handleClickSubmit = async () => {
    if (!selectedBus) return;

    try {
      setLoading(true);
      const response = await axios.get(
        "http://ws.bus.go.kr/busRouteInfo/getRouteInfo",
        // "/api/bus/api/rest/busRouteInfo/getRouteInfo",
        {
          params: {
            resultType: "json",
            ServiceKey: VITE_DATA_API_EN_KEY,
            busRouteId: selectedBus.rte_id,
          },
          // responseType: "text",
        },
      );
      console.log("getRouteInfo response", response.data?.msgBody?.itemList);
      setCorpList(response.data?.msgBody?.itemList ?? []);
      setCorpName("서부운수 02-372-0221");

      if (VITE_SEOUL_DATA_API_DE_KEY) {
        const seoulResponse = await axios.get(
          `/api/seoul/${VITE_SEOUL_DATA_API_DE_KEY}/json/lostArticleInfo/1/5/`,
        );
        console.log("lostArticleInfo response", seoulResponse.data);
      }
    } catch (error) {
      console.error("getRouteInfo error", error);
      setCorpName("서부운수 02-372-0221");
    } finally {
      setLoading(false);
    }
  };

  // rte_id

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
      </div>
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
