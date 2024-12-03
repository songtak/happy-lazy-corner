import { useEffect, useRef } from "react";
import { RouterProvider, HashRouter } from "react-router-dom";
import ReactGA from "react-ga4";

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
    <div className="container">
      <RouterProvider router={router}>
        <ScrollToTop />
      </RouterProvider>
    </div>
  );
};

export default MainRouter;
