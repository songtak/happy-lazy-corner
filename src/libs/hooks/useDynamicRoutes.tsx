import { createBrowserRouter } from "react-router-dom";

import { defaultRoutes } from "@routes/mainRoute";

/* 사용자 상태에 따라 라우트 변경 */
const useDynamicRoutes = () => {
  /** 기본적으로 defaultRoutes 적용 */
  let routes = [...defaultRoutes];

  return createBrowserRouter(routes);
};

export default useDynamicRoutes;
