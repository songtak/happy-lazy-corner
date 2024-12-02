// import { DOMRouterOpts } from "react-router-dom";
import { RouteObject } from "react-router";
import ErrorPage from "@pages/common/ErrorPage";

import MainPage from "@/pages/MainPage";

/** 기본 라우터 */
const defaultRoutes: RouteObject[] = [
  {
    path: "/",
    element: <MainPage />,
    errorElement: <ErrorPage />,
  },
];

export { defaultRoutes };
