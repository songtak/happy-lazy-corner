import React, { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TextField, Button } from "@mui/material";
import "dayjs/locale/ko";
import axios from "axios";
import dayjs from "dayjs";

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
  { key: "depPlace", header: "보관" },
];

//  http://apis.data.go.kr/1320000/LostGoodsInfoInqireService
const LostAndFoundPageJW = () => {
  const BASE_URL = "http://apis.data.go.kr/1320000/LosPtfundInfoInqireService/";

  const today = dayjs().format("YYYYMMDD");
  const startDay = dayjs("2025-01-08");

  const [totalData, setTotalData] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);
  const [nameData, setNameData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  const [selectedName, setSelectedName] = useState<string>("");

  /** 물품명 */
  // const [name, setName] = useState<string>(""); // PRDT_NM
  /** 습득일자 */
  const [findDayStart, setFindDayStart] = useState<string>("20250108"); // START_YMD
  const [findDayEnd, setFindDayEnd] = useState<string>(today); // END_YMD
  /** 습득 위치 */
  const [findLocation, setFindLocation] = useState<string>(""); // N_FD_LCT_CD

  /** 분류별, 지역별, 기간별 습득물 정보 조회 */
  const fetchLocationData = async (name: string) => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.get(
        BASE_URL + "getPtLosfundInfoAccToClAreaPd",
        {
          params: {
            serviceKey: VITE_DATA_API_DE_KEY,
            numOfRows: 1000,
            pageNo: 1,
            START_YMD: findDayStart,
            END_YMD: findDayEnd,
          },
          responseType: "text",
        }
      );

      const parsed = JSON.parse(response.data);

      const filteredByAge = parsed.response.body.items.item.filter(
        (item: any) => item.fdPrdtNm.includes(name)
      );

      console.log("filteredByAge", filteredByAge);

      setLocationData(filteredByAge);
    } catch (e) {
      setError(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    setTotalData(locationData);
  }, [locationData]);

  /** 검색 버튼 클릭 */
  const handleClickSearch = async (name: string) => {
    await setTotalData([]);
    setLocationData([]);
    setSelectedName(name);
    fetchLocationData(name);
  };

  /** 초기화 */
  const init = () => {
    setSelectedName("");
    setLocationData([]);
    setTotalData([]);
  };

  return (
    <DefaultLayout>
      <div style={{ fontSize: "24px" }}>👮 분실물 센터 for 째웅 🚨</div>
      <div style={{ paddingTop: "16px" }}>
        2025.01.08 ~ {dayjs(today).format("YYYY.MM.DD")}
      </div>
      <div>
        <div style={{ paddingTop: "16px" }}>
          <div>
            <button
              className="cute-button"
              style={{ fontWeight: 300 }}
              onClick={() => {
                handleClickSearch("노트북");
              }}
            >
              노트북
            </button>
          </div>
          <div style={{ paddingTop: "16px" }}>
            <button
              className="cute-button"
              style={{ fontWeight: 300 }}
              onClick={() => {
                handleClickSearch("삼성");
              }}
            >
              삼성
            </button>
          </div>
          <div style={{ paddingTop: "16px" }}>
            <button
              className="cute-button"
              onClick={() => {
                handleClickSearch("아이패드");
              }}
            >
              아이패드
            </button>
          </div>
        </div>
      </div>
      <div>
        {loading && (
          <div style={{ paddingTop: "24px" }}>리스트 불러오는 중 💨💨</div>
        )}
        {totalData.length > 0 && (
          <div style={{ paddingTop: "24px" }}>
            [ {selectedName} ]
            <div className="table-container">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th key={column.key}>{column.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {totalData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {columns.map((column) => (
                          <td key={column.key}>{row[column.key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
};

export default LostAndFoundPageJW;
