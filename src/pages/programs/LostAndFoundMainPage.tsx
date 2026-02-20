import React, { useState, useEffect, useRef } from "react";
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
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import DefaultLayout from "@/components/common/DefaultLayout";
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
  전철: "metro",
  기차: "train",
};

//  http://apis.data.go.kr/1320000/LostGoodsInfoInqireService
const LostAndFoundMainPage = () => {
  const navigate = useNavigate();
  const BASE_URL = "http://apis.data.go.kr/1320000/LosPtfundInfoInqireService/";

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
  const [showTransportButtons, setShowTransportButtons] =
    useState<boolean>(false);
  const transportSectionRef = useRef<HTMLDivElement | null>(null);

  console.log("findLocation", findLocation);

  /** 분류별, 지역별, 기간별 습득물 정보 조회 */
  const fetchLocationData = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.get(
        BASE_URL + "getPtLosfundInfoAccToClAreaPd",
        {
          params: {
            serviceKey: VITE_DATA_API_DE_KEY,
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

  const scrollToTransportSection = () => {
    transportSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleClickGoFind = () => {
    if (!showTransportButtons) {
      setShowTransportButtons(true);
      return;
    }
    scrollToTransportSection();
  };

  useEffect(() => {
    if (!showTransportButtons) return;
    const timer = window.setTimeout(() => {
      scrollToTransportSection();
    }, 50);

    return () => window.clearTimeout(timer);
  }, [showTransportButtons]);

  return (
    <DefaultLayout>
      <div
        style={{
          minHeight: "100vh",
        }}
      >
        <div className="mb24  gmedium" style={{ fontSize: 28 }}>
          대중교통 분실물 센터
        </div>
        <div className="mb16 fs18 glight">
          대중교통에서 두고 내린 물건
          <br />
          지금 바로 찾아보세요!
        </div>
        <div className="animation-container">
          <motion.div
            className="moving-icons"
            animate={{ x: "-100%" }}
            initial={{ x: 0 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋
            🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌
            🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕
            🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅
            🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋 🚅 🚕 🚌 🚋
          </motion.div>
        </div>
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            endIcon={<ArrowRight size={18} />}
            onClick={handleClickGoFind}
            sx={{
              borderRadius: "24px",
              background: "linear-gradient(135deg, #22c1c3 0%, #3a86ff 100%)",
              color: "white",
              fontFamily: "GLight",
              fontSize: "14px",
              fontWeight: 600,
              padding: "12px 24px",
              boxShadow: "0 8px 20px rgba(58, 134, 255, 0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #1db1b3 0%, #2f74ea 100%)",
                boxShadow: "0 10px 24px rgba(58, 134, 255, 0.42)",
              },
            }}
          >
            찾으러 가기
          </Button>
        </div>
      </div>

      {showTransportButtons && (
        <div
          ref={transportSectionRef}
          style={{
            marginTop: "24px",
            width: "100%",
            minHeight: "100vh",
            paddingTop: "4rem",
          }}
        >
          <div
            className="gmedium"
            style={{
              // textAlign: "left",
              // paddingLeft: "3rem",
              fontSize: "24px",
              marginBottom: "3rem",
            }}
          >
            어디서 잃어버렸나요?
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "22px",
              flexWrap: "wrap",
            }}
          >
            {["버스", "택시", "전철"].map((label) => (
              <Button
                key={label}
                variant="outlined"
                onClick={() =>
                  navigate(
                    `/lost-and-found/transport/${transportTypeMap[label]}`,
                  )
                }
                sx={{
                  fontWeight: 700,
                  borderRadius: "30px",
                  width: "220px",
                  height: "50px",
                  fontSize: "16px",
                  borderWidth: "2px",
                  borderColor: "#3a86ff",
                  color: "#2f74ea",
                  fontFamily: "GLight",
                  boxShadow: "0 6px 14px rgba(58, 134, 255, 0.2)",
                  "&:hover": {
                    borderColor: "#2f74ea",
                    backgroundColor: "rgba(58, 134, 255, 0.08)",
                    boxShadow: "0 8px 18px rgba(58, 134, 255, 0.28)",
                  },
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </DefaultLayout>
  );
};

export default LostAndFoundMainPage;
