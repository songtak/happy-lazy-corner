import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import ReactGA from "react-ga4";

import useDynamicRoutes from "@libs/hooks/useDynamicRoutes";
import CoupangAd from "@components/CoupangAd";
import { isMobile } from "@libs/helpers";

// import "../assets/web.css";
// import "../assets/mobile.css";
import "../assets/styles/common.css";
import "../assets/styles/code.css";
import "../assets/styles/web.css";
import "../assets/styles/mobile.css";

/** 기본 라우터 */
const MainRouter = () => {
  const router = useDynamicRoutes();
  // const PUBLIC_GA_ID = `${import.meta.env.VITE_PUBLIC_GA_ID}`;
  useEffect(() => {
    // ReactGA.initialize(`${PUBLIC_GA_ID}`);
  }, []);

  useEffect(() => {
    const forceScrollTop = () => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const appScrollContainer = document.querySelector<HTMLElement>(
        "#app-scroll, #app-scroll-container",
      );
      appScrollContainer?.scrollTo({ top: 0, behavior: "auto" });
      document
        .querySelectorAll<HTMLElement>(".wrapper, .main")
        .forEach((el) => {
          el.scrollTop = 0;
          el.scrollTo({ top: 0, behavior: "auto" });
        });
    };

    forceScrollTop();
    const unsubscribe = router.subscribe(() => {
      forceScrollTop();
      window.setTimeout(forceScrollTop, 0);
      window.setTimeout(forceScrollTop, 80);
      window.setTimeout(forceScrollTop, 180);
      requestAnimationFrame(forceScrollTop);
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  return (
    <>
      {!isMobile() && (
        <CoupangAd
          id={823795}
          trackingCode="AF3245048"
          width="120"
          height="600"
        />
      )}
      <div
        id="app-scroll"
        className={`${!isMobile() && "wrapper"} `}
        style={{
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          height: "100%",
        }}
      >
        <div
          className={`${isMobile() && "wrapper"}`}
          style={
            isMobile() ? { overflow: "visible", height: "auto" } : undefined
          }
        >
          {/* @ts-ignore */}
          <RouterProvider router={router} />
        </div>
        {isMobile() && (
          <div
            style={{
              position: "fixed",
              bottom: "60px",
              left: 0,
              right: 0,
              zIndex: 1000,
              textAlign: "center",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              padding: "4px 8px",
              // borderTop: "1px solid #efefef",
            }}
          >
            <div style={{ fontSize: "8px", color: "#b8b8b8", lineHeight: 1 }}>
              이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의
              수수료를 제공받습니다.
            </div>
            <a
              href="https://www.instagram.com/sn9tk"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: "8px",
                color: "#9a9a9a",
                textDecoration: "none",
                display: "inline-block",
                marginBottom: "2px",
              }}
            >
              © 2026 Songtak. All rights reserved.
            </a>
          </div>
        )}
        {isMobile() && (
          <div
            className="ad_wrapper"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 999,
            }}
          >
            <CoupangAd
              id={824414}
              trackingCode="AF3245048"
              width={window.innerWidth}
              height="60"
            />
          </div>
        )}
      </div>
      {!isMobile() && (
        <CoupangAd
          id={823796}
          trackingCode="AF3245048"
          width="120"
          height="600"
        />
      )}
    </>
  );
};

export default MainRouter;
