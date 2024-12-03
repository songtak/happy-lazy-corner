import { useEffect, useRef } from "react";
import { RouterProvider, HashRouter } from "react-router-dom";
import ReactGA from "react-ga4";
import CoupangAd from "@components/CoupangAd";

import useDynamicRoutes from "@libs/hooks/useDynamicRoutes";
import ScrollToTop from "@libs/ScrollToTop";

// import "../assets/web.css";
// import "../assets/mobile.css";
import "../assets/styles/common.css";
import "../assets/styles/code.css";

/** 기본 라우터 */
const MainRouter = () => {
  const router = useDynamicRoutes();
  // const PUBLIC_GA_ID = `${import.meta.env.VITE_PUBLIC_GA_ID}`;
  useEffect(() => {
    // ReactGA.initialize(`${PUBLIC_GA_ID}`);
  }, []);

  return (
    <>
      <CoupangAd
        id={823795}
        trackingCode="AF3245048"
        width="120"
        height="600"
      />
      <div className="wrapper">
        <RouterProvider router={router}>
          <ScrollToTop />
        </RouterProvider>
      </div>
      <CoupangAd
        id={823796}
        trackingCode="AF3245048"
        width="120"
        height="600"
      />
    </>
  );
};

export default MainRouter;
