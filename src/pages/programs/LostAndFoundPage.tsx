import React, { useState, useEffect } from "react";
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
        }
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
        }
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

  return (
    <DefaultLayout>
      <div className="mb24 fs28">👮 분실물 센터 🚨</div>
      <div>
        <div>
          <div className="pb8">
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
          </div>
          <div className=" pb8">
            <Box sx={{ minWidth: 120 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="demo-simple-select-label">지역</InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  // value={findLocation.value}
                  label="Age"
                  onChange={(e) => {
                    setFindLocation(e.target.value as string);
                  }}
                >
                  {locationCodeList.map((item: DROPDOWN, i: number) => (
                    <MenuItem key={i} value={item.key}>
                      {item.value}
                    </MenuItem>
                  ))}
                  {/* <MenuItem value={20}>Twenty</MenuItem>
                  <MenuItem value={30}>Thirty</MenuItem> */}
                </Select>
              </FormControl>
            </Box>
            {/* <TextField
              className="simple-input pb16"
              type="text"
              onKeyUp={(e) => {
                onCheckEnter(e);
              }}
              placeholder="분실 지역"
              value={findLocation}
              onChange={(e) => {
                handleChangeInput("findLocation", e.target.value);
              }}
              size="small"
              //   maxLength={25}
            /> */}
          </div>
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
        {loading && <div>검색중 🔍</div>}
        {totalData.length > 0 && (
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
        )}
      </div>
    </DefaultLayout>
  );
};

export default LostAndFoundPage;
