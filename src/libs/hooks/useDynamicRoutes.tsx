// import { createBrowserRouter } from "react-router-dom";

// import { defaultRoutes, authRoutes, adminRoutes } from "@routes/mainRoute";
// import RouteChangeTracker from "../../routes/RouteChangeTracker";

// /* 사용자 상태에 따라 라우트 변경 */
// const useDynamicRoutes = () => {
//   const isAuthenticated = true;
//   const isAdmin = false;

//   /** 기본적으로 defaultRoutes 적용 */
//   let routes = [...defaultRoutes];

//   /** 인증된 사용자의 경우 authRoutes 추가 */
//   if (isAuthenticated) {
//     routes = [...routes, ...authRoutes];
//   }

//   /**  관리자의 경우 adminRoutes 추가 */
//   if (isAdmin) {
//     routes = [...routes, ...adminRoutes];
//   }

//   return createBrowserRouter(routes);
// };

// export default useDynamicRoutes;

import { createBrowserRouter } from "react-router-dom";

import { defaultRoutes, programRoutes } from "@routes/mainRoute";

/* 사용자 상태에 따라 라우트 변경 */
const useDynamicRoutes = () => {
  /** 기본적으로 defaultRoutes 적용 */
  let routes = [...defaultRoutes, ...programRoutes];

  return createBrowserRouter(routes);
};

export default useDynamicRoutes;
