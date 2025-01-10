import React, { useState, useEffect } from "react";
import ECharts from "echarts-for-react";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import _ from "lodash";
/** 일년이 얼마 지났고 남았는지 알 수 있는 페이지 */

const YearlyProgressPage = () => {
  const [selectedDate, setSelectedDate] = useState<any>(new Date());
  const [yearDetails, setYearDetails] = useState<any>(new Date());

  const today = dayjs();

  const getYearDetails = (date: Date): any => {
    const now = new Date(date);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

    const totalMillis = endOfYear.getTime() - startOfYear.getTime();
    const elapsedMillis = now.getTime() - startOfYear.getTime();

    const progressPercentage = ((elapsedMillis / totalMillis) * 100).toFixed(2);
    const remainingPercentage = (100 - parseFloat(progressPercentage)).toFixed(
      2
    );

    const oneDayMillis = 24 * 60 * 60 * 1000;
    const elapsedDays = Math.floor(elapsedMillis / oneDayMillis) + 1;
    const remainingDays =
      Math.ceil((endOfYear.getTime() - now.getTime()) / oneDayMillis) - 1;

    return {
      progressPercentage: progressPercentage,
      remainingPercentage: remainingPercentage,
      elapsedDays,
      remainingDays,
    };
  };

  const getTodayDate = (): string => {
    const today = selectedDate;
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    setYearDetails(getYearDetails(selectedDate));
  }, [selectedDate]);

  return (
    <div>
      {/* <div>{getTodayDate()}</div> */}
      <div className="fs28">{dayjs(today).format("YYYY")}년</div>
      <div className="mb24 fs28">얼마 남았는지 알아보자 👀</div>
      <div className="mb24 fs28" style={{ justifyItems: "center" }}>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="ko"

          // adapterLocale={koLocale}
        >
          <DemoContainer components={["DatePicker"]}>
            <DatePicker
              label="날짜"
              defaultValue={today.subtract(31, "year")}
              value={dayjs(selectedDate)}
              onChange={(newValue: any) => {
                setSelectedDate(newValue);
              }}
              openTo="month"
              views={["month", "day"]}
              slotProps={{
                textField: {
                  //   onChange: () => {},
                  //     value: selectedDate === null ? null : dayjs(selectedDate),
                  placeholder: "날짜",
                  label: "",
                  style: { width: "240px" },
                  size: "small",
                },
              }}
            />
          </DemoContainer>
        </LocalizationProvider>
      </div>
      <div>
        <ECharts
          option={{
            tooltip: {
              trigger: "item",
            },
            legend: {
              top: "5%",
              left: "center",
            },
            series: [
              {
                // name: `${selectedDate}`,
                type: "pie",
                radius: ["40%", "70%"],
                avoidLabelOverlap: false,
                label: {
                  show: false,
                  position: "center",
                },
                emphasis: {
                  label: {
                    show: true,
                    fontSize: 40,
                    fontWeight: "bold",
                  },
                },
                labelLine: {
                  show: false,
                },
                data: [
                  {
                    value: yearDetails?.elapsedDays,
                    // value: yearDetails?.progressPercentage,
                    name: `지난 날`,
                  },
                  {
                    value: yearDetails?.remainingDays,
                    // value: yearDetails?.remainingPercentage,
                    name: `남은 날`,
                  },
                ],
              },
            ],
          }}
          opts={{ renderer: "svg", width: "auto", height: "auto" }}
        />
      </div>
      <div
        style={{ textAlign: "center", color: "rgb(84, 112, 198)" }}
        className="mb16"
      >
        {yearDetails?.progressPercentage}%
      </div>
      <div
        style={{ textAlign: "center", color: "rgb(145, 204, 117" }}
        className="pb36"
      >
        {yearDetails?.remainingPercentage}%
      </div>
    </div>
  );
};

export default YearlyProgressPage;
