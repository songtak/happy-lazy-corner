import React, { useMemo, useState } from "react";
import { Autocomplete, Button, TextField } from "@mui/material";

import seoulBus from "@/assets/seoul_bus_id.json";
import seoulBusRouteInfo from "@/assets/seoul_bus_route_info.json";

type BusOption = {
  rte_nm: string;
  rte_id: string;
};

type CorpItem = {
  corpNm?: string;
};

type RouteInfoItem = {
  itemList?: CorpItem[];
};

const extractPhone = (text: string) => {
  const match = text.match(/0\d{1,2}[- ]?\d{3,4}[- ]?\d{4}/);
  return match ? match[0] : "";
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #e6ecff",
  borderRadius: "18px",
  padding: "16px",
  backgroundColor: "#ffffff",
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
};

const BusComponent = () => {
  const [busNumber, setBusNumber] = useState("");
  const [selectedBus, setSelectedBus] = useState<BusOption | null>(null);
  const [corpList, setCorpList] = useState<CorpItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const busOptions = useMemo(() => (seoulBus.DATA as BusOption[]) ?? [], []);
  const routeInfoMap = useMemo(
    () =>
      ((seoulBusRouteInfo as { data?: Record<string, RouteInfoItem> }).data ??
        {}) as Record<string, RouteInfoItem>,
    [],
  );

  const handleClickSubmit = () => {
    if (!selectedBus) return;
    setHasSearched(true);
    const routeInfo = routeInfoMap[selectedBus.rte_id];
    const itemList = Array.isArray(routeInfo?.itemList)
      ? routeInfo.itemList
      : [];
    setCorpList(itemList);
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
      <div className="glight" style={{ fontSize: 12 }}>
        버스 분실물은 운수사에서 보관되는 경우가 많아
        <div>서울시 통합 분실물 센터에 등록되지 않을 수 있습니다.</div>
        <div
          className="gbold"
          style={{
            marginTop: "12px",
            fontSize: 14,
            color: "#0082FF",
            fontWeight: 800,
          }}
        >
          운수사에 전화 문의하는 것이 가장 빠른 방법입니다.
        </div>
      </div>
      <div style={{ width: "100%", display: "grid", gap: "16px" }}>
        <div style={cardStyle}>
          <div style={{ fontSize: "18px", marginBottom: "16px" }}>
            버스 번호 검색
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <Autocomplete
              size="small"
              sx={{
                width: "240px",
                fontFamily: "SeoulNamsan, sans-serif",
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
                const keyword = state.inputValue.trim().toLowerCase();
                if (!keyword) return options;
                return options.filter(
                  (option) =>
                    option.rte_nm.toLowerCase().startsWith(keyword) ||
                    option.rte_nm.toLowerCase().endsWith(keyword),
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
                setHasSearched(false);
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
              disabled={!selectedBus}
              sx={{
                fontFamily: "SeoulNamsan, sans-serif",
                borderRadius: "18px",
                padding: "8px 18px",
                color: "#ffffff",
                background: "linear-gradient(135deg, #22c1c3 0%, #3a86ff 100%)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #1db1b3 0%, #2f74ea 100%)",
                },
                "&.Mui-disabled": {
                  color: "#9ca3af",
                  background: "#e5e7eb",
                },
              }}
            >
              검색
            </Button>
          </div>
          <div
            style={{
              minHeight: "180px",
              marginTop: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "100%" }}>
              {!hasSearched ? (
                <div
                  style={{
                    minHeight: "180px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    gap: "10px",
                  }}
                >
                  <img
                    src="/bus_search_icon.png"
                    alt="버스 검색 안내"
                    style={{
                      width: "66px",
                      height: "66px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      display: "grid",
                      gap: "4px",
                      color: "#475569",
                      fontFamily: "SeoulNamsan, sans-serif",
                    }}
                  >
                    <div style={{ fontSize: "14px", fontWeight: 700 }}>
                      버스번호를 입력하고 검색해 주세요.
                    </div>
                    <div style={{ fontSize: "12px" }}>
                      검색 결과가 여기에 표시됩니다.
                    </div>
                  </div>
                </div>
              ) : hasSearched && corpList.length === 0 ? (
                <div className="glight" style={{ textAlign: "center" }}>
                  검색 결과가 없습니다.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {corpList.map((corp: CorpItem, index: number) => {
                    const corpText = `${corp?.corpNm ?? ""}`;
                    const phone = extractPhone(corpText);
                    const tel = phone.replace(/[^0-9]/g, "");
                    return (
                      <div
                        key={index}
                        style={{
                          border: "1px solid #eef2ff",
                          borderRadius: "14px",
                          padding: "12px 14px",
                          backgroundColor: "#fbfcff",
                        }}
                      >
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
                                  fontFamily: "SeoulNamsan, sans-serif",
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
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="glight" style={{ fontSize: 12 }}>
        <div>일정 기간 주인을 찾지 못한 물품은 경찰서로 인계되며</div>
        <div>이후 경찰민원24에서 조회할 수 있습니다.</div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Button
          sx={{
            marginTop: "12px",
            width: "280px",
            fontFamily: "SeoulNamsan, sans-serif",
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
            fontFamily: "SeoulNamsan, sans-serif",
            borderRadius: "18px",
          }}
          variant="outlined"
          onClick={() =>
            window.open(
              "https://minwon24.police.go.kr/cvlcpt/cvlcptAply.do?cvlcptId=MW-201&keyword=",
              "_blank",
            )
          }
        >
          경찰민원24 분실물 조회하기
        </Button>
      </div>
    </div>
  );
};

export default BusComponent;
