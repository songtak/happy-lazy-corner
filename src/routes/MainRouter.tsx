import { useEffect, useRef } from "react";
import { RouterProvider, HashRouter } from "react-router-dom";
import ReactGA from "react-ga4";

import useDynamicRoutes from "@libs/hooks/useDynamicRoutes";
import ScrollToTop from "@libs/ScrollToTop";
import * as Common from "@components/common";

// import "../assets/web.css";
// import "../assets/mobile.css";
import "../assets/styles/common.css";

/** 기본 라우터 */
const MainRouter = () => {
  const router = useDynamicRoutes();
  const PUBLIC_GA_ID = `${import.meta.env.VITE_PUBLIC_GA_ID}`;
  useEffect(() => {
    ReactGA.initialize(`${PUBLIC_GA_ID}`);
  }, []);

  return (
    <div className="container">
      <Common.Header />
      <Common.Main>
        <RouterProvider router={router}>
          <ScrollToTop />
        </RouterProvider>
      </Common.Main>

      <Common.Footer />
    </div>
  );
};

export default MainRouter;
