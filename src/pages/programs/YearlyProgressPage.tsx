import React, { useEffect, useLayoutEffect, useState } from "react";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import "dayjs/locale/ko";

const COUPANG_URL = "https://link.coupang.com/a/dSMJFK";
type ProgressSegment = "elapsed" | "remaining" | null;

const YearlyProgressPage = () => {
  const [selectedDate, setSelectedDate] = useState<any>(new Date());
  const [yearDetails, setYearDetails] = useState<any>(new Date());
  const [activeSegment, setActiveSegment] = useState<ProgressSegment>(null);

  const selectedYear = dayjs(selectedDate).format("YYYY");

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

  useLayoutEffect(() => {
    const wrapperElements = document.querySelectorAll<HTMLElement>(
      ".wrapper, .main",
    );
    const previousStyles = Array.from(wrapperElements).map((element) => ({
      element,
      style: element.getAttribute("style"),
    }));

    wrapperElements.forEach((element) => {
      element.style.padding = "0";
      element.style.backgroundColor = "transparent";
      element.style.boxShadow = "none";
      element.style.borderRadius = "0";
      element.style.maxWidth = "none";
      element.style.height = "auto";
    });

    return () => {
      previousStyles.forEach(({ element, style }) => {
        if (style === null) {
          element.removeAttribute("style");
          return;
        }

        element.setAttribute("style", style);
      });
    };
  }, []);

  const getSegmentStyle = (segment: Exclude<ProgressSegment, null>) => {
    const isActive = activeSegment === segment;

    return {
      transform: isActive ? "scaleY(1.15)" : "scaleY(1)",
      boxShadow: isActive ? "0 8px 18px rgba(15, 23, 42, 0.18)" : "none",
      zIndex: isActive ? 1 : 0,
      position: "relative" as const,
      transition:
        "width 0.3s ease, transform 0.18s ease, box-shadow 0.18s ease",
    };
  };

  return (
    <div
      style={{
        fontFamily: "GMedium",
        width: "100%",
        minHeight: "100vh",
        padding: 0,
        background:
          "radial-gradient(circle at top left, rgba(159, 197, 248, 0.2), transparent 32%), radial-gradient(circle at top right, rgba(244, 163, 163, 0.16), transparent 28%), linear-gradient(180deg, #f8fafc 0%, #ffffff 48%, #f8fafc 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "920px",
          margin: "0 auto",
          padding: "24px 16px 40px",
        }}
      >
        <div
          style={{
            marginBottom: "20px",
            padding: "28px 24px",
            borderRadius: "28px",
            background: "rgba(255, 255, 255, 0.84)",
            border: "1px solid rgba(148, 163, 184, 0.16)",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              marginTop: "0",
              color: "#0f172a",
              fontSize: "clamp(30px, 5vw, 48px)",
              lineHeight: 1.08,
              fontWeight: 700,
            }}
          >
            올해 남은 날
          </div>
          <div
            style={{
              marginTop: "10px",
              maxWidth: "620px",
              color: "#64748b",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            날짜를 고르면 지난 날, 남은 날, 그리고 남은 주말과 주 수를 한눈에
            볼 수 있어요.
          </div>
          <div
            style={{
              marginTop: "18px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#f8fafc",
                color: "#475569",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                fontSize: "13px",
              }}
            >
              {selectedYear}년
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid rgba(244, 163, 163, 0.28)",
                fontSize: "13px",
              }}
            >
              남은 주말 {yearDetails?.remainingWeekendCount}번
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
            <DemoContainer components={["DatePicker"]}>
              <DatePicker
                label="날짜 선택"
                format="M월 D일"
                value={dayjs(selectedDate)}
                onChange={(newValue: any) => {
                  setSelectedDate(newValue ?? new Date());
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
                    placeholder: "날짜 선택",
                    label: "",
                    style: { width: "100%", maxWidth: "280px" },
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

        <div
          style={{
            marginTop: "22px",
            padding: "22px",
            borderRadius: "28px",
            background: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(148, 163, 184, 0.16)",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div
            className="gmedium"
            style={{
              textAlign: "center",
              color: "#64748b",
              fontSize: "14px",
              marginBottom: "18px",
            }}
          >
            올해 남은 주말은 {yearDetails?.remainingWeekendCount}번이에요.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                padding: "18px",
                borderRadius: "20px",
                background: "linear-gradient(180deg, #fff7f7 0%, #fff 100%)",
                border: "1px solid rgba(244, 163, 163, 0.24)",
                textAlign: "center",
              }}
            >
              <div style={{ color: "#ef4444", fontSize: "13px" }}>지난 날</div>
              <div style={{ fontSize: "28px", color: "#0f172a", margin: "6px 0" }}>
                {yearDetails?.elapsedDays}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                올해의 {yearDetails?.progressPercentage}%
              </div>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "20px",
                background: "linear-gradient(180deg, #f7fbff 0%, #fff 100%)",
                border: "1px solid rgba(159, 197, 248, 0.26)",
                textAlign: "center",
              }}
            >
              <div style={{ color: "#3b82f6", fontSize: "13px" }}>남은 날</div>
              <div style={{ fontSize: "28px", color: "#0f172a", margin: "6px 0" }}>
                {yearDetails?.remainingDays}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                {yearDetails?.remainingPercentage}% 남음
              </div>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "20px",
                background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                textAlign: "center",
              }}
            >
              <div style={{ color: "#64748b", fontSize: "13px" }}>
                남은 주 대략
              </div>
              <div style={{ fontSize: "28px", color: "#0f172a", margin: "6px 0" }}>
                {yearDetails?.remainingWeeks}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "100%", maxWidth: "720px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  fontSize: "12px",
                  color: "#94a3b8",
                }}
              >
                <span>지난</span>
                <span>남은</span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "18px",
                  backgroundColor: "#e2e8f0",
                  borderRadius: "999px",
                  overflow: "hidden",
                  display: "flex",
                  boxShadow: "inset 0 1px 2px rgba(15, 23, 42, 0.08)",
                }}
              >
                <div
                  style={{
                    width: `${yearDetails?.progressPercentage ?? 0}%`,
                    background:
                      "linear-gradient(90deg, #fca5a5 0%, #fb7185 100%)",
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
                    background:
                      "linear-gradient(90deg, #93c5fd 0%, #60a5fa 100%)",
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
    </div>
  );
};

export default YearlyProgressPage;
