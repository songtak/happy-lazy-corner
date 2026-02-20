import { useEffect, useRef } from "react";
import { RouterProvider, HashRouter } from "react-router-dom";
import ReactGA from "react-ga4";

import useDynamicRoutes from "@libs/hooks/useDynamicRoutes";
import CoupangAd from "@components/CoupangAd";
import ScrollToTop from "@libs/ScrollToTop";
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
        className={`${!isMobile() && "wrapper"} `}
        style={{
          overflow: isMobile() ? `auto` : "",
          height: "100%",
        }}
      >
        <div className={`${isMobile() && "wrapper"}`}>
          {/* @ts-ignore */}
          <RouterProvider router={router}>
            <ScrollToTop />
          </RouterProvider>
        </div>
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
