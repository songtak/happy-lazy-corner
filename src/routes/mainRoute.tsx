// import { DOMRouterOpts } from "react-router-dom";
import { RouteObject } from "react-router";
import ErrorPage from "@pages/common/ErrorPage";

import MainPage from "@/pages/MainPage";
import DefaultLayout from "@components/common/DefaultLayout";
import * as Program from "@/pages/programs";

/** 기본 라우터 */
const defaultRoutes: RouteObject[] = [
  {
    path: "/",
    element: <MainPage />,
    errorElement: <ErrorPage />,
  },
];

const programRoutes: RouteObject[] = [
  {
    path: "/yearly-progress",
    element: <Program.YearlyProgressPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/lost-and-found",
    element: <Program.LostAndFoundMainPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/lost-and-found/search",
    element: <Program.LostAndFoundSearchPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/lost-and-found/transport/:type",
    element: <Program.LostAndFoundPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/lost-and-found-for-jw",
    element: <Program.LostAndFoundPageJW />,
    errorElement: <ErrorPage />,
  },
];

// const programRoutes: RouteObject[] = [
//   {
//     path: "/",
//     element: <DefaultLayout />, // PaywatchLayout 내에서 <Outlet />을 통해 자식 라우트 렌더링
//     errorElement: <ErrorPage />,
//     children: [
//       { index: true, element: <MainPage /> },
//       // { index: true, element: <Program.YearlyProgressPage /> },

//       /** 남아있는 날들 */
//       { path: "/yearly-progress", element: <Program.YearlyProgressPage /> },
//     ],
//   },
// ];

const projectList = [
  { id: 1, path: "/yearly-progress", title: "올해 남아 있는 날들 💪" },
  { id: 2, path: "/lost-and-found", title: "경찰청 분실물 센터 👮" },
];

export { defaultRoutes, programRoutes, projectList };
