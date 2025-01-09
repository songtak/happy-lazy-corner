/* src/RouteChangeTracker.js */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

/**
 * uri 변경 추적 컴포넌트
 * uri가 변경될 때마다 pageview 이벤트 전송
 */
const RouteChangeTracker = () => {
  const location = useLocation();
  const PUBLIC_GA_ID = `${import.meta.env.VITE_PUBLIC_GA_ID}`;

  ReactGA.initialize(`${PUBLIC_GA_ID}`);

  // location 변경 감지시 pageview 이벤트 전송
  useEffect(() => {
    ReactGA.set({ page: location.pathname });
    ReactGA.send("pageview");
  }, [location]);
};

export default RouteChangeTracker;
