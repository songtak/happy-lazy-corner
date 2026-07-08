import React, { useState } from "react";
import { Button } from "@mui/material";

type MetroLostCenterItem = {
  center: string;
  line: string;
  numbers: string[];
  color: string;
};

type MetroLostCenterSource = {
  line: string;
  center: string;
  numbers: string[];
  color: string;
};

const metroLostCenterSources: MetroLostCenterSource[] = [
  {
    line: "1호선",
    center: "시청역 유실물센터",
    numbers: ["02-6110-1122"],
    color: "#0052A4",
  },
  {
    line: "2호선",
    center: "시청역 유실물센터",
    numbers: ["02-6110-1122"],
    color: "#00A84D",
  },
  {
    line: "3호선",
    center: "충무로역 유실물센터",
    numbers: ["02-6110-3344"],
    color: "#EF7C1C",
  },
  {
    line: "4호선",
    center: "충무로역 유실물센터",
    numbers: ["02-6110-3344"],
    color: "#00A5DE",
  },
  {
    line: "5호선",
    center: "왕십리역 유실물센터",
    numbers: ["02-6311-6765", "02-6311-6768"],
    color: "#996CAC",
  },
  {
    line: "6호선",
    center: "태릉입구역 유실물센터",
    numbers: ["02-6311-6766", "02-6311-6767"],
    color: "#CD7C2F",
  },
  {
    line: "7호선",
    center: "태릉입구역 유실물센터",
    numbers: ["02-6311-6766", "02-6311-6767"],
    color: "#747F00",
  },
  {
    line: "7호선 까치울~석남",
    center: "",
    numbers: ["032-451-3650"],
    color: "#747F00",
  },
  {
    line: "8호선",
    center: "왕십리역 유실물센터",
    numbers: ["02-6311-6765", "02-6311-6768"],
    color: "#E6186C",
  },
  {
    line: "9호선(개화산~신논현)",
    center: "",
    numbers: ["02-2656-0009"],
    color: "#BDB092",
  },
  {
    line: "9호선(언주~중앙보훈병원)",
    center: "",
    numbers: ["02-2656-0930"],
    color: "#BDB092",
  },
  {
    line: "우이신설선",
    center: "고객지원센터",
    numbers: ["02-3499-5561"],
    color: "#B7C452",
  },
  {
    line: "신림선",
    center: "고객지원센터",
    numbers: ["02-890-2227", "02-890-2228"],
    color: "#6789CA",
  },
  {
    line: "공항철도",
    center: "",
    numbers: ["032-745-7777"],
    color: "#0090D2",
  },
  {
    line: "신분당선",
    center: "",
    numbers: ["031-8018-7777"],
    color: "#D4003B",
  },
  {
    line: "인천 1호선",
    center: "",
    numbers: ["032-451-3650"],
    color: "#7CA8D5",
  },
  {
    line: "인천 2호선",
    center: "",
    numbers: ["032-451-3650"],
    color: "#ED8B00",
  },
  {
    line: "김포도시철도",
    center: "",
    numbers: ["031-8048-1799"],
    color: "#A17800",
  },
  {
    line: "경춘선",
    center: "코레일 운영",
    numbers: ["1544-7788"],
    color: "#0C8E72",
  },
  {
    line: "수인분당선",
    center: "코레일 운영",
    numbers: ["1544-7788"],
    color: "#FABE00",
  },
  {
    line: "경의중앙선",
    center: "코레일 운영",
    numbers: ["1544-7788"],
    color: "#77C4A3",
  },
  {
    line: "서해선",
    center: "코레일 운영",
    numbers: ["1544-7788"],
    color: "#8FC31F",
  },
  {
    line: "GTX-A(운정중앙~서울역)",
    center: "유실물센터",
    numbers: ["02-6048-7294"],
    color: "#9A6292",
  },
  {
    line: "GTX-A(수서~동탄역)",
    center: "유실물센터",
    numbers: ["02-6048-7293"],
    color: "#9A6292",
  },
  {
    line: "GTX-A",
    center: "통합 콜센터",
    numbers: ["1551-2979"],
    color: "#9A6292",
  },
];

const metroLineGroups = [
  {
    title: "서울 지하철 주요 노선",
    lines: [
      "1호선",
      "2호선",
      "3호선",
      "4호선",
      "5호선",
      "6호선",
      "7호선",
      "7호선 까치울~석남",
      "8호선",
    ],
  },
  {
    title: "9호선",
    lines: ["9호선(개화산~신논현)", "9호선(언주~중앙보훈병원)"],
  },
  {
    title: "서울 경전철/도시철도",
    lines: ["우이신설선", "신림선"],
  },
  {
    title: "수도권 연결 노선",
    lines: [
      "공항철도",
      "신분당선",
      "인천 1호선",
      "인천 2호선",
      "김포도시철도",
      "경춘선",
      "수인분당선",
      "경의중앙선",
      "서해선",
    ],
  },
  {
    title: "GTX-A",
    lines: ["GTX-A(운정중앙~서울역)", "GTX-A(수서~동탄역)", "GTX-A"],
  },
];

const metroLostCenterList: MetroLostCenterItem[] =
  metroLostCenterSources.flatMap((source) => ({
    center: source.center,
    line: source.line,
    numbers: source.numbers,
    color: source.color,
  }));

const metroLostCenterMap = metroLostCenterList.reduce<
  Record<string, MetroLostCenterItem>
>((accumulator, item) => {
  accumulator[item.line] = item;
  return accumulator;
}, {});

const MetroComponent = () => {
  const [openLine, setOpenLine] = useState<string | null>(null);

  return (
    <div
      className="glight"
      style={{
        marginTop: "4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: "4px",
        width: "100%",
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: "12px" }}>
        지하철/전철에서 분실한 물건은 노선별 유실물센터에서 관리됩니다.
      </div>
      <div
        className="gmedium"
        style={{
          fontSize: "12px",
          marginBottom: "12px",
          fontWeight: 800,
          color: "#0082FF",
        }}
      >
        통합 조회 시스템이 없어, 빠른 확인을 위해 해당 센터로 전화 문의해보세요.
      </div>
      <div
        style={{
          width: "100%",
          border: "1px solid #e6ecff",
          borderRadius: "18px",
          padding: "16px",
          backgroundColor: "#ffffff",
          boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
          textAlign: "left",
          fontSize: "14px",
        }}
      >
        <div className="gmedium" style={{ marginTop: "4px", fontSize: "16px" }}>
          호선 선택
        </div>

        <div style={{ marginTop: "16px", display: "grid", gap: "14px" }}>
          {metroLineGroups.map((group) => {
            const groupItems = group.lines
              .map((line) => metroLostCenterMap[line])
              .filter(Boolean);

            return (
              <div
                key={group.title}
                style={{
                  border: "1px solid #eef2ff",
                  borderRadius: "16px",
                  padding: "12px",
                  backgroundColor: "#fbfcff",
                  display: "grid",
                  gap: "10px",
                }}
              >
                <div className="gmedium" style={{ fontSize: "15px" }}>
                  {group.title}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  {groupItems.map((item) => {
                    const isActive = openLine === item.line;

                    return (
                      <button
                        key={item.line}
                        type="button"
                        onClick={() =>
                          setOpenLine((current) =>
                            current === item.line ? null : item.line,
                          )
                        }
                        style={{
                          border: `1px solid ${item.color}`,
                          background: isActive ? item.color : "#ffffff",
                          color: isActive ? "#ffffff" : item.color,
                          borderRadius: "999px",
                          padding: "10px 14px",
                          fontFamily: "SeoulNamsan, sans-serif",
                          cursor: "pointer",
                          boxShadow: `0 4px 10px ${item.color}22`,
                        }}
                        onMouseEnter={(e) => {
                          const target = e.currentTarget;
                          if (openLine === item.line) return;
                          target.style.background = item.color;
                          target.style.color = "#ffffff";
                          target.style.boxShadow = `0 8px 18px ${item.color}33`;
                        }}
                        onMouseLeave={(e) => {
                          const target = e.currentTarget;
                          if (openLine === item.line) return;
                          target.style.background = "#ffffff";
                          target.style.color = item.color;
                          target.style.boxShadow = `0 4px 10px ${item.color}22`;
                        }}
                      >
                        {item.line}
                      </button>
                    );
                  })}
                </div>

                {groupItems.some((item) => item.line === openLine) ? (
                  <div
                    style={{
                      borderRadius: "14px",
                      border: "1px solid #dce8ff",
                      backgroundColor: "#ffffff",
                      padding: "14px",
                      display: "grid",
                      gap: "8px",
                    }}
                  >
                    {groupItems
                      .filter((item) => item.line === openLine)
                      .map((item) => (
                        <div
                          key={item.line}
                          style={{ display: "grid", gap: "6px" }}
                        >
                          <div className="gmedium">{item.line}</div>
                          <div style={{ color: "#334155" }}>
                            {item.center ? item.center : "유실물센터"}
                          </div>
                          <div>
                            {item.numbers.map((phone, index) => (
                              <React.Fragment key={phone}>
                                <a
                                  href={`tel:${phone.replace(/-/g, "")}`}
                                  style={{ color: item.color }}
                                >
                                  {phone}
                                </a>
                                {index < item.numbers.length - 1 ? ", " : ""}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          marginTop: "16px",
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

      <div style={{ height: "45vh", minHeight: "260px", width: "100%" }} />
    </div>
  );
};

export default MetroComponent;
