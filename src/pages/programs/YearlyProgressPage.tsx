import React, { useState, useEffect } from "react";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import "dayjs/locale/ko";
/** 일년이 얼마 지났고 남았는지 알 수 있는 페이지 */

const COUPANG_URL = "https://link.coupang.com/a/dSMJFK";
type ProgressSegment = "elapsed" | "remaining" | null;

const YearlyProgressPage = () => {
  const [selectedDate, setSelectedDate] = useState<any>(new Date());
  const [yearDetails, setYearDetails] = useState<any>(new Date());
  const [activeSegment, setActiveSegment] = useState<ProgressSegment>(null);

  const today = dayjs();

  const getYearDetails = (date: Date): any => {
    const now = new Date(date);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

    const totalMillis = endOfYear.getTime() - startOfYear.getTime();
    const elapsedMillis = now.getTime() - startOfYear.getTime();

    const progressPercentage = ((elapsedMillis / totalMillis) * 100).toFixed(2);
    const remainingPercentage = (100 - parseFloat(progressPercentage)).toFixed(
      2,
    );

    const oneDayMillis = 24 * 60 * 60 * 1000;
    const elapsedDays = Math.floor(elapsedMillis / oneDayMillis) + 1;
    const remainingDays =
      Math.ceil((endOfYear.getTime() - now.getTime()) / oneDayMillis) - 1;
    const remainingWeeks = (remainingDays / 7).toFixed(1);

    const weekendSet = new Set<string>();
    const cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() + 1);
    while (cursor < endOfYear) {
      const day = cursor.getDay();
      if (day === 0 || day === 6) {
        const weekStart = new Date(cursor);
        weekStart.setDate(cursor.getDate() - day);
        weekStart.setHours(0, 0, 0, 0);
        weekendSet.add(weekStart.toISOString().slice(0, 10));
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    const remainingWeekendCount = weekendSet.size;

    return {
      progressPercentage: progressPercentage,
      remainingPercentage: remainingPercentage,
      elapsedDays,
      remainingDays,
      remainingWeeks,
      remainingWeekendCount,
    };
  };

  useEffect(() => {
    setYearDetails(getYearDetails(selectedDate));
  }, [selectedDate]);

  const getSegmentStyle = (segment: Exclude<ProgressSegment, null>) => {
    const isActive = activeSegment === segment;

    return {
      transform: isActive ? "scaleY(1.18)" : "scaleY(1)",
      boxShadow: isActive ? "0 6px 14px rgba(0, 0, 0, 0.16)" : "none",
      zIndex: isActive ? 1 : 0,
      position: "relative" as const,
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    };
  };

  return (
    <div
      style={{
        fontFamily: "GMedium",
        width: "100%",
        // marginLeft: "calc(50% - 50vw)",
      }}
    >
      {/* <div>{getTodayDate()}</div> */}
      <div className="fs28" style={{ color: "#4b5563", paddingLeft: "16px" }}>
        {dayjs(today).format("YYYY")}년
      </div>
      <div
        className="mb24 fs28"
        style={{ color: "#4b5563", paddingLeft: "16px" }}
      >
        얼마 남았는지 알아보자 👀
      </div>
      <div
        className="mb24 fs28"
        style={{ display: "flex", justifyContent: "center" }}
      >
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="ko"

          // adapterLocale={koLocale}
        >
          <DemoContainer components={["DatePicker"]}>
            <DatePicker
              label="날짜"
              format="M월 D일"
              defaultValue={today.subtract(31, "year")}
              value={dayjs(selectedDate)}
              onChange={(newValue: any) => {
                setSelectedDate(newValue);
              }}
              onAccept={() => {
                window.open(COUPANG_URL, "_blank");
              }}
              closeOnSelect={false}
              openTo="month"
              views={["month", "day"]}
              slotProps={{
                actionBar: {
                  actions: ["cancel", "accept"],
                },
                textField: {
                  //   onChange: () => {},
                  //     value: selectedDate === null ? null : dayjs(selectedDate),
                  placeholder: "날짜",
                  label: "",
                  style: { width: "240px" },
                  size: "small",
                  inputProps: {
                    style: { textAlign: "center" },
                  },
                },
              }}
            />
          </DemoContainer>
        </LocalizationProvider>
      </div>
      <div>
        <div
          className="gmedium pb24"
          style={{ textAlign: "center", color: "#6b7280", fontSize: "14px" }}
        >
          {yearDetails?.remainingWeekendCount}번의 주말이 남았어요!
        </div>
        <div
          className="pb24"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "40px",
            alignItems: "center",
          }}
        >
          <div
            style={{ color: "#f4a3a3", textAlign: "center", minWidth: "120px" }}
          >
            <div className="glight">지난 날</div>
            <div>{yearDetails?.elapsedDays}일</div>
            <div className="glight">{yearDetails?.progressPercentage}%</div>
          </div>
          <div
            style={{ color: "#9fc5f8", textAlign: "center", minWidth: "120px" }}
          >
            <div className="glight">남은 날</div>
            <div>{yearDetails?.remainingDays}일</div>
            <div className="glight">{yearDetails?.remainingPercentage}%</div>
          </div>
        </div>

        <div
          className="pb24"
          style={{
            padding: "0 16px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: "720px" }}>
            <div
              style={{
                width: "100%",
                height: "20px",
                backgroundColor: "#e5e7eb",
                borderRadius: "999px",
                overflow: "hidden",
                display: "flex",
              }}
            >
              <div
                style={{
                  width: `${yearDetails?.progressPercentage ?? 0}%`,
                  backgroundColor: "#f4a3a3",
                  transition: "width 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease",
                  ...getSegmentStyle("elapsed"),
                }}
                onMouseEnter={() => setActiveSegment("elapsed")}
                onMouseLeave={() => setActiveSegment(null)}
                onTouchStart={() => setActiveSegment("elapsed")}
                onTouchEnd={() => setActiveSegment(null)}
                onTouchCancel={() => setActiveSegment(null)}
                onClick={() => setActiveSegment("elapsed")}
              />
              <div
                style={{
                  width: `${yearDetails?.remainingPercentage ?? 0}%`,
                  backgroundColor: "#9fc5f8",
                  transition: "width 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease",
                  ...getSegmentStyle("remaining"),
                }}
                onMouseEnter={() => setActiveSegment("remaining")}
                onMouseLeave={() => setActiveSegment(null)}
                onTouchStart={() => setActiveSegment("remaining")}
                onTouchEnd={() => setActiveSegment(null)}
                onTouchCancel={() => setActiveSegment(null)}
                onClick={() => setActiveSegment("remaining")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearlyProgressPage;
