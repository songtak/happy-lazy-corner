// import { useLayoutEffect } from "react";
// import { useLocation } from "react-router-dom";

// const ScrollToTop = () => {
//   const { pathname } = useLocation();

//   useLayoutEffect(() => {
//     window.scrollTo(0, 0);
//   }, [pathname]);
//   return null;
// };

// export default ScrollToTop;

// ScrollToTop.tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // 브라우저의 자동 복원 끄기
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // iOS에서 타이밍 이슈가 있어 rAF로 한 번 늦춰줌
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      // iOS Safari fallback
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }, [pathname, search, hash]);

  return null;
}
