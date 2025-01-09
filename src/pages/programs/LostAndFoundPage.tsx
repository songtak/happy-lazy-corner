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
  { key: "fdSbjt", header: "설명" },
  { key: "fdYmd", header: "날짜" },
  { key: "depPlace", header: "발견 장소" },
];

//  http://apis.data.go.kr/1320000/LostGoodsInfoInqireService
const LostAndFoundPage = () => {
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
          },
          responseType: "text",
        }
      );

      const parsed = JSON.parse(response.data);
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
        }
      );

      const parsed = JSON.parse(response.data);
      //   setNameData(parsed.response.body.items.item);
    } catch (e) {
      setError(e);
    }
    setLoading(false);
  };

  console.log("locationData", locationData);
  console.log("nameData", nameData);

  useEffect(() => {
    setTotalData([...locationData, ...nameData]);
  }, [locationData, nameData]);

  /** 검색 버튼 클릭 */
  const handleClickSearch = () => {
    fetchLocationData();
    fetchNameData();
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
  };

  return (
    <DefaultLayout>
      <div>👮 분실물 센터 🚨</div>
      <div>
        <div>
          <TextField
            className="simple-input pb16"
            type="text"
            onKeyUp={(e) => {
              onCheckEnter(e);
            }}
            placeholder="물품명"
            value={name}
            onChange={(e) => {
              handleChangeInput("name", e.target.value);
            }}
            size="small"
            //   maxLength={25}
          />
          <div style={{ display: "block ruby" }}>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="ko"

              // adapterLocale={koLocale}
            >
              <DemoContainer components={["DatePicker"]}>
                <DatePicker
                  label="생년월일"
                  //   defaultValue={now.subtract(32, "year")}
                  value={findDayStart === null ? null : dayjs(findDayStart)}
                  onChange={(newValue: any) => {
                    setFindDayStart(dayjs(newValue).format("YYYY-MM-DD"));
                  }}
                  openTo="day"
                  views={["year", "month", "day"]}
                  slotProps={{
                    textField: {
                      // onChange: () => {},
                      value: findDayStart === null ? null : dayjs(findDayStart),
                      placeholder: "생년월일",
                      label: "",
                      style: { width: "240px" },
                      size: "small",
                    },
                  }}
                />
              </DemoContainer>
            </LocalizationProvider>
          </div>
          ~
          <div style={{ display: "block ruby" }}>
            <LocalizationProvider
              dateAdapter={AdapterDayjs}
              adapterLocale="ko"

              // adapterLocale={koLocale}
            >
              <DemoContainer components={["DatePicker"]}>
                <DatePicker
                  label="생년월일"
                  //   defaultValue={now.subtract(32, "year")}
                  value={findDayEnd === null ? null : dayjs(findDayEnd)}
                  onChange={(newValue: any) => {
                    setFindDayEnd(dayjs(newValue).format("YYYY-MM-DD"));
                  }}
                  openTo="day"
                  views={["year", "month", "day"]}
                  slotProps={{
                    textField: {
                      // onChange: () => {},
                      value: findDayEnd === null ? null : dayjs(findDayEnd),
                      placeholder: "생년월일",
                      label: "",
                      style: { width: "240px" },
                      size: "small",
                    },
                  }}
                />
              </DemoContainer>
            </LocalizationProvider>
          </div>
        </div>
        <div style={{ paddingTop: "40px" }}>
          <button
            className="cute-button"
            onClick={() => {
              handleClickSearch();
            }}
          >
            찾아보기 👀
          </button>
        </div>
      </div>
      <div>
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
    </DefaultLayout>
  );
};

export default LostAndFoundPage;
