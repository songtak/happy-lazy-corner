import React, { useEffect, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TextField, Button } from "@mui/material";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import "dayjs/locale/ko";
import axios from "axios";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DefaultLayout from "@/components/common/DefaultLayout";
import { isMobile } from "@/libs/helpers";
const VITE_DATA_API_EN_KEY = `${import.meta.env.VITE_DATA_API_EN_KEY}`;
const VITE_DATA_API_DE_KEY = `${import.meta.env.VITE_DATA_API_DE_KEY}`;

type TableColumn = {
  key: string;
  header: string;
};

type TableRow = {
  [key: string]: string | number;
};

type ListItem = {
  atcId: number;
  fdPrdtNm: string; // 물품명
  fdSbjt: string; // 설명
  fdYmd: string; // 날짜
  depPlace: string; // 발견 장소
};

const columns = [
  // { key: "id", header: "ID" },
  { key: "fdPrdtNm", header: "물품명" },
  // { key: "fdSbjt", header: "설명" },
  { key: "fdYmd", header: "날짜" },
  { key: "depPlace", header: "발견 장소" },
];

const locationCodeList: DROPDOWN[] = [
  { key: "LCA000", value: "서울특별시" },
  { key: "LCH000", value: "강원도" },
  { key: "LCI000", value: "경기도" },
  { key: "LCJ000", value: "경상남도" },
  { key: "LCK000", value: "경상북도" },
  { key: "LCQ000", value: "광주광역시" },
  { key: "LCR000", value: "대구광역시" },
  { key: "LCS000", value: "대전광역시" },
  { key: "LCT000", value: "부산광역시" },
  { key: "LCW000", value: "세종특별자치시" },
  { key: "LCU000", value: "울산광역시" },
  { key: "LCV000", value: "인천광역시" },
  { key: "LCL000", value: "전라남도" },
  { key: "LCM000", value: "전라북도" },
  { key: "LCP000", value: "제주특별자치도" },
  { key: "LCN000", value: "충청남도" },
  { key: "LCO000", value: "충청북도" },
  { key: "LCF000", value: "해외" },
  { key: "LCE000", value: "기타" },
];

const transportTypeMap: Record<string, string> = {
  버스: "bus",
  택시: "taxi",
  "지하철/전철": "metro",
  기차: "train",
};

const transportCards = [
  {
    label: "버스",
    description: "노선/차량번호 기준으로 안내",
    iconSrc: "/bus_icon.png",
  },
  {
    label: "택시",
    description: "결제수단에 따라 조회 방법 안내",
    iconSrc: "/taxi_icon.png",
  },
  {
    label: "지하철/전철",
    description: "노선별 유실물센터 안내",
    iconSrc: "/metro_icon.png",
  },
];

const buttonArrowStyles = `
  @keyframes transport-card-arrow-slide {
    0% { transform: translateX(-6px); opacity: 0.65; }
    50% { transform: translateX(6px); opacity: 1; }
    100% { transform: translateX(-6px); opacity: 0.65; }
  }

  .transport-card:hover .transport-card-arrow {
    animation: transport-card-arrow-slide 0.9s ease-in-out infinite;
  }
`;

//  http://apis.data.go.kr/1320000/LostGoodsInfoInqireService
const LostAndFoundMainPage = () => {
  const navigate = useNavigate();
  const BASE_URL = "http://apis.data.go.kr/1320000/LosPtfundInfoInqireService/";
  const mobile = isMobile();

  const today = dayjs().format("YYYYMMDD");
  const now = dayjs();

  const [totalData, setTotalData] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);
  const [nameData, setNameData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  /** 물품명 */
  const [name, setName] = useState<string>(""); // PRDT_NM
  /** 습득일자 */
  const [findDayStart, setFindDayStart] = useState<string>(today); // START_YMD
  const [findDayEnd, setFindDayEnd] = useState<string>(today); // END_YMD
  /** 습득 위치 */
  const [findLocation, setFindLocation] = useState<string>(""); // N_FD_LCT_CD
  /** 분류별, 지역별, 기간별 습득물 정보 조회 */
  const fetchLocationData = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.get(
        BASE_URL + "getPtLosfundInfoAccToClAreaPd",
        {
          params: {
            serviceKey: VITE_DATA_API_EN_KEY,
            numOfRows: 100,
            pageNo: 1,
            START_YMD: findDayStart,
            END_YMD: findDayEnd,
            N_FD_LCT_CD: findLocation,
          },
          responseType: "text",
        },
      );

      const parsed = JSON.parse(response.data);
      console.log("parsed", parsed);

      parsed.response.body.items.item.length > 0 &&
        setLocationData(parsed.response.body.items.item);
    } catch (e) {
      setError(e);
    }
    setLoading(false);
  };

  /** 분류별, 지역별, 기간별 습득물 정보 조회 */
  const fetchNameData = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.get(
        BASE_URL + "getPtLosfundInfoAccTpNmCstdyPlace",
        {
          params: {
            serviceKey: VITE_DATA_API_DE_KEY,
            numOfRows: 10,
            pageNo: 1,
            PRDT_NM: name,
          },
          responseType: "text",
        },
      );

      const parsed = JSON.parse(response.data);
      //   setNameData(parsed.response.body.items.item);
    } catch (e) {
      setError(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    setTotalData([...locationData, ...nameData]);
  }, [locationData, nameData]);

  /** 검색 버튼 클릭 */
  const handleClickSearch = () => {
    setTotalData([]);
    setLocationData([]);
    setNameData([]);
    fetchLocationData();
    // fetchNameData();
  };

  const onCheckEnter = (e: any) => {
    if (e.key === "Enter") {
      handleClickSearch();
    }
  };

  const handleChangeInput = (key: string, value: string) => {
    // input
    if (key === "name") {
      setName(value);
    }
    // if (key === "findLocation") {
    //   setFindLocation(value);
    // }
  };

  const forceScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const appScrollContainer = document.querySelector<HTMLElement>(
      "#app-scroll, #app-scroll-container",
    );
    appScrollContainer?.scrollTo({ top: 0, behavior: "auto" });
    document.querySelectorAll<HTMLElement>(".wrapper, .main").forEach((el) => {
      el.scrollTop = 0;
      el.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  return (
    <DefaultLayout>
      <style>{buttonArrowStyles}</style>
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          // padding: "24px 16px",
          // boxSizing: "border-box",
          fontFamily: "SeoulNamsan, sans-serif",
        }}
      >
        <div>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "22px",
            }}
          >
            <img
              src="/seoul-my-soul.png"
              alt="Seoul My Soul"
              style={{
                display: "block",
                width: "100%",
                maxWidth: "90px",
                height: "auto",
                objectFit: "cover",
              }}
            />
            <div
              // className="mb16"
              style={{
                fontSize: "2.7rem",
                fontFamily: "SeoulAlrimTTF, sans-serif",
                fontWeight: 700,
                lineHeight: 1.3,
                letterSpacing: "0.01em",
                color: "#182235",
                textAlign: "center",
              }}
            >
              서울 대중교통
              <br />
              분실물 가이드
            </div>
            <div
              style={{
                width: "58px",
                height: "4px",
                borderRadius: "999px",
                background: "rgba(47,116,234)",
                // boxShadow: "0 4px 10px rgba(47, 116, 234, 0.2)",
                marginBottom: "24px",
              }}
            />
            <div
              className="mb16 fs18 glight"
              style={{
                paddingBottom: "0.25rem",
                fontFamily: "SeoulNamsan, sans-serif",
                color: "#35507a",
                textAlign: "center",
                lineHeight: 1.55,
                maxWidth: "560px",
              }}
            >
              <div
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  color: "#1f5fcc",
                  marginBottom: "6px",
                }}
              >
                어디에서 물건을 잃어버렸나요?
              </div>
              <div style={{ fontSize: "0.86rem" }}>
                분실 장소를 선택하면 지금 확인해야 할 정보를
                <br />
                안내해드려요.
              </div>
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: "760px",
                display: "grid",
                gap: "8px",
                marginTop: "-20px",
                // marginTop: "8px",
              }}
            >
              {transportCards.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="transport-card"
                  onClick={() => {
                    navigate(
                      `/lost-and-found/transport/${transportTypeMap[item.label]}`,
                    );
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "20px",
                    border: "1px solid #dbe4f0",
                    borderRadius: "12px",
                    backgroundColor: "#ffffff",
                    padding: mobile ? "8px 14px" : "4px 18px",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
                    cursor: "pointer",
                    color: "inherit",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 14px 28px rgba(15, 23, 42, 0.12)";
                    e.currentTarget.style.borderColor = "#c9d6ef";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 24px rgba(15, 23, 42, 0.08)";
                    e.currentTarget.style.borderColor = "#dbe4f0";
                  }}
                >
                  <div
                    style={{
                      width: mobile ? "76px" : "92px",
                      height: mobile ? "76px" : "92px",
                      flexShrink: 0,

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",

                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={item.iconSrc}
                      alt={item.label}
                      style={{
                        width: "74%",
                        height: "74%",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        color: "#172033",
                        marginBottom: "10px",
                        lineHeight: 1.1,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "#4b5d7a",
                        lineHeight: 1.45,
                        textAlign: "left",
                      }}
                    >
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight
                    size={28}
                    strokeWidth={2.5}
                    color="#1f5fcc"
                    className="transport-card-arrow"
                    style={{ flexShrink: 0 }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default LostAndFoundMainPage;
