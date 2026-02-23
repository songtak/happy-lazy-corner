import React from "react";
import { Button } from "@mui/material";

const metroLostCenterList = [
  { label: "1, 2호선 - 시청역 유실물센터", phones: ["02-6110-1122"] },
  { label: "3, 4호선 - 충무로역 유실물센터", phones: ["02-6110-3344"] },
  {
    label: "5, 8호선 - 왕십리역 유실물센터",
    phones: ["02-6311-6765", "02-6311-6768"],
  },
  {
    label: "6, 7호선 - 태릉입구역 유실물센터",
    phones: ["02-6311-6766", "02-6311-6767"],
  },
  { label: "9호선(개화산~신논현)", phones: ["02-2656-0009"] },
  { label: "9호선(언주~중앙보훈병원)", phones: ["02-2656-0930"] },
  { label: "공항철도", phones: ["032-745-7777"] },
  { label: "신분당선", phones: ["031-8018-7777"] },
  { label: "인천 1, 2호선(7호선 까치울~석남 포함)", phones: ["032-451-3650"] },
  { label: "김포도시철도", phones: ["031-8048-1799"] },
  {
    label: "코레일 운영 1, 3, 4호선/경춘선/수인분당선/경의중앙선",
    phones: ["1544-7788"],
  },
];

const MetroComponent = () => {
  return (
    <div
      className="glight"
      style={{
        marginTop: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: "16px",
        width: "100%",
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: "14px" }}>
        전철에서 분실한 물건은 노선별 유실물센터에서 보관·관리됩니다.
      </div>
      <div style={{ fontSize: "14px" }}>
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
        <div className="gmedium" style={{ marginTop: "8px", fontSize: "16px" }}>
          호선별 유실물센터 위치 및 전화번호
        </div>

        <div
          style={{
            marginTop: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {metroLostCenterList.map((item) => (
            <div key={item.label} style={{ marginTop: "8px" }}>
              <div className="gmedium">{item.label}</div>
              <div style={{ marginTop: "4px" }}>
                {item.phones.map((phone, index) => (
                  <React.Fragment key={phone}>
                    <a
                      href={`tel:${phone.replace(/-/g, "")}`}
                      style={{ color: "#2f74ea", paddingLeft: 12 }}
                    >
                      {phone}
                    </a>
                    {index < item.phones.length - 1 ? ", " : ""}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          width: "100%",
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
            window.open("https://www.lost112.go.kr/find/findList.do", "_blank")
          }
        >
          경찰청 분실물 조회하기
        </Button>
      </div>

      <div style={{ height: "45vh", minHeight: "260px", width: "100%" }} />
    </div>
  );
};

export default MetroComponent;
