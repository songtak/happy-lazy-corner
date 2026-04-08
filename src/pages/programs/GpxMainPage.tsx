import React, { useEffect, useState } from "react";
import { ArrowBigUpDash } from "lucide-react";
import { Link } from "react-router-dom";
import { isMobile } from "@/libs/helpers";

const GpxMainPage = () => {
  const [isCompactTitleVisible, setIsCompactTitleVisible] = useState(false);
  const isMobileDevice = isMobile();

  useEffect(() => {
    const appScrollContainer =
      document.querySelector<HTMLElement>("#app-scroll");

    const handleScroll = () => {
      const scrollTop = Math.max(
        window.scrollY,
        document.documentElement.scrollTop,
        document.body.scrollTop,
        appScrollContainer?.scrollTop || 0,
      );

      setIsCompactTitleVisible(scrollTop > 120);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    appScrollContainer?.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      appScrollContainer?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "180vh",
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "18vh 24px 24px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "max(24px, calc((100vw - 700px) / 2 + 24px))",
          zIndex: 30,
          fontFamily: "Comico",
          fontSize: "clamp(20px, 2vw, 28px)",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "#111827",
          textTransform: "lowercase",
          opacity: isCompactTitleVisible ? 1 : 0,
          transform: isCompactTitleVisible
            ? "translateY(0)"
            : "translateY(-8px)",
          transition: "opacity 220ms ease, transform 220ms ease",
          pointerEvents: "none",
        }}
      >
        happy route corner
      </div>

      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          alignItems: "center",
          opacity: isCompactTitleVisible ? 1 : 0,
          transform: isCompactTitleVisible
            ? "translate(-50%, -50%)"
            : "translate(-50%, calc(-50% - 8px))",
          transition: "opacity 220ms ease, transform 220ms ease",
          pointerEvents: isCompactTitleVisible ? "auto" : "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              fontFamily: "Comico",
              fontSize: "10px",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textTransform: "lowercase",
              color: "#6b7280",
            }}
          >
            gpx file viewer
          </div>
          <Link
            to="/gpx-viewer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "56px",
              minWidth: "220px",
              padding: "0 28px",
              borderRadius: "38px 24px 42px 20px / 26px 40px 22px 44px",
              backgroundColor: "rgba(255, 255, 255, 0.92)",
              border: "3px solid #111827",
              color: "#111827",
              textDecoration: "none",
              fontFamily: "Pretendard",
              fontSize: "clamp(18px, 2.2vw, 24px)",
              fontWeight: 700,
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
              backdropFilter: "blur(8px)",
            }}
          >
            경로 불러오기
          </Link>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              fontFamily: "Comico",
              fontSize: "10px",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "#6b7280",
            }}
          >
            GPX FILE MAKER
          </div>
          <Link
            to="/gpx-maker"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "56px",
              minWidth: "220px",
              padding: "0 28px",
              borderRadius: "22px 40px 24px 46px / 42px 24px 38px 20px",
              backgroundColor: "#111827",
              border: "3px solid #111827",
              color: "#ffffff",
              textDecoration: "none",
              fontFamily: "Pretendard",
              fontSize: "clamp(18px, 2.2vw, 24px)",
              fontWeight: 700,
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
            }}
          >
            나만의 경로 만들기
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontFamily: "Comico",
          fontSize: isMobileDevice
            ? "clamp(74px, 17vw, 96px)"
            : "clamp(42px, 11vw, 120px)",
          lineHeight: 0.86,
          letterSpacing: "-0.04em",
          color: "#111827",
          textTransform: "lowercase",
          textAlign: "center",
          opacity: isCompactTitleVisible ? 0 : 1,
          transform: isCompactTitleVisible
            ? "translateY(-24px)"
            : "translateY(0)",
          transition: "opacity 260ms ease, transform 260ms ease",
        }}
      >
        <style>
          {`
            @keyframes gentleWobble {
              0% { transform: translate3d(0, 0, 0) rotate(0deg); }
              20% { transform: translate3d(-1px, 1px, 0) rotate(-0.8deg); }
              50% { transform: translate3d(1px, -1px, 0) rotate(0.9deg); }
              75% { transform: translate3d(-1px, 0, 0) rotate(-0.5deg); }
              100% { transform: translate3d(0, 0, 0) rotate(0deg); }
            }

            @keyframes arrowLift {
              0% { transform: translateY(10px); opacity: 0; }
              20% { transform: translateY(4px); opacity: 1; }
              65% { transform: translateY(-8px); opacity: 1; }
              100% { transform: translateY(-18px); opacity: 0; }
            }
          `}
        </style>
        <div
          style={{
            marginBottom: "20px",
            lineHeight: 1,
            animation: "arrowLift 1.9s ease-out infinite",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <ArrowBigUpDash size={38} strokeWidth={2.2} />
        </div>
        <div
          style={{
            display: "block",
            animation: "gentleWobble 2.8s ease-in-out infinite",
          }}
        >
          happy
        </div>
        <div
          style={{
            display: "block",
            animation: "gentleWobble 3.1s ease-in-out infinite",
            animationDelay: "0.14s",
          }}
        >
          route
        </div>
        <div
          style={{
            display: "block",
            animation: "gentleWobble 2.9s ease-in-out infinite",
            animationDelay: "0.28s",
          }}
        >
          corner
        </div>
        <div
          style={{
            marginTop: "24px",
            fontFamily: "Pretendard",
            fontSize: "clamp(13px, 2vw, 18px)",
            fontWeight: 500,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
          }}
        >
          : 나만의 경로를, 가장 쉽고 빠르게
        </div>
      </div>
    </div>
  );
};

export default GpxMainPage;
