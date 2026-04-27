import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";

import useDynamicRoutes from "@libs/hooks/useDynamicRoutes";
import CoupangAd from "@components/CoupangAd";
import { isMobile } from "@libs/helpers";

// import "../assets/web.css";
// import "../assets/mobile.css";
import "../assets/styles/common.css";
import "../assets/styles/code.css";
import "../assets/styles/web.css";
import "../assets/styles/mobile.css";

const GA_MEASUREMENT_ID = "G-VN1W6B09RJ";
const GA_ALLOWED_HOSTNAMES = [
  "www.happy-lazy-corner.co.kr",
  "happy-lazy-corner.co.kr",
  "192.168.0.81",
] as const;
const GA_ALLOWED_PATH_PREFIXES = ["/gpx", "/motion-drawing"] as const;
const GA_SCRIPT_ID = "happy-lazy-corner-ga";

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    happyLazyGaInitialized?: boolean;
  }
}

const shouldEnableGa = () =>
  GA_ALLOWED_HOSTNAMES.includes(window.location.hostname as (typeof GA_ALLOWED_HOSTNAMES)[number]) &&
  GA_ALLOWED_PATH_PREFIXES.some((prefix) =>
    window.location.pathname.startsWith(prefix),
  );

const sendGaPageView = (pathname: string) => {
  window.gtag?.("event", "page_view", {
    send_to: GA_MEASUREMENT_ID,
    page_path: pathname,
    page_location: window.location.href,
    page_title: document.title,
    debug_mode: true,
  });
};

const initializeGa = () => {
  if (!shouldEnableGa() || window.happyLazyGaInitialized) {
    return;
  }

  window.happyLazyGaInitialized = true;
  window.dataLayer = window.dataLayer || [];

  if (!window.gtag) {
    window.gtag = (...args: any[]) => {
      window.dataLayer?.push(args);
    };
  }

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const gaScript = document.createElement("script");
    gaScript.id = GA_SCRIPT_ID;
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);
  }

  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    page_location: window.location.href,
    page_title: document.title,
    send_page_view: false,
    debug_mode: true,
  });
  sendGaPageView(window.location.pathname);
};

const getGaClickLabel = (element: HTMLElement) => {
  const customLabel = element.dataset.gaLabel?.trim();
  const ariaLabel = element.getAttribute("aria-label")?.trim();
  const title = element.getAttribute("title")?.trim();
  const text = element.textContent?.replace(/\s+/g, " ").trim();

  if (customLabel) {
    return customLabel;
  }

  if (ariaLabel) {
    return ariaLabel;
  }

  if (title) {
    return title;
  }

  if (text) {
    return text;
  }

  if (element instanceof HTMLAnchorElement) {
    return element.href;
  }

  return "unknown";
};

const getGaClickPayload = (clickableElement: HTMLElement) => {
  const clickLabel = getGaClickLabel(clickableElement);
  const buttonCategory = clickableElement.dataset.gaCategory || "global";
  const linkUrl =
    clickableElement instanceof HTMLAnchorElement
      ? clickableElement.href
      : undefined;

  return {
    send_to: GA_MEASUREMENT_ID,
    event_category: buttonCategory,
    event_label: clickLabel,
    button_label: clickLabel,
    button_category: buttonCategory,
    button_tag: clickableElement.tagName.toLowerCase(),
    page_path: window.location.pathname,
    page_location: window.location.href,
    link_url: linkUrl,
    transport_type: "beacon",
    debug_mode: true,
  };
};

/** 기본 라우터 */
const MainRouter = () => {
  const router = useDynamicRoutes();
  const [pathname, setPathname] = useState(router.state.location.pathname);
  const shouldHideCoupangAds =
    pathname.startsWith("/oracle") ||
    pathname.startsWith("/seasonal-food") ||
    pathname.startsWith("/gpx") ||
    pathname.startsWith("/motion-drawing") ||
    pathname.startsWith("/jeju-trail-2026");
  useEffect(() => {
    initializeGa();
  }, []);

  useEffect(() => {
    const trackedElements = new WeakSet<HTMLElement>();

    const handleDocumentInteraction = (event: MouseEvent | PointerEvent) => {
      if (!shouldEnableGa()) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const clickableElement = target.closest<HTMLElement>(
        "button, a, [role='button']",
      );

      if (!clickableElement || !document.body.contains(clickableElement)) {
        return;
      }

      if (trackedElements.has(clickableElement)) {
        return;
      }

      trackedElements.add(clickableElement);
      window.setTimeout(() => {
        trackedElements.delete(clickableElement);
      }, 500);

      const payload = getGaClickPayload(clickableElement);
      window.gtag?.("event", "button_click", payload);
    };

    document.addEventListener("click", handleDocumentInteraction, true);

    return () => {
      document.removeEventListener("click", handleDocumentInteraction, true);
    };
  }, []);

  useEffect(() => {
    const forceScrollTop = () => {
      window.scrollTo({ top: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const appScrollContainer = document.querySelector<HTMLElement>(
        "#app-scroll, #app-scroll-container",
      );
      appScrollContainer?.scrollTo({ top: 0, behavior: "auto" });
      document
        .querySelectorAll<HTMLElement>(".wrapper, .main")
        .forEach((el) => {
          el.scrollTop = 0;
          el.scrollTo({ top: 0, behavior: "auto" });
        });
    };

    forceScrollTop();
    const unsubscribe = router.subscribe(() => {
      setPathname(router.state.location.pathname);
      initializeGa();

      if (shouldEnableGa()) {
        window.gtag?.("config", GA_MEASUREMENT_ID, {
          page_path: router.state.location.pathname,
          page_location: window.location.href,
          page_title: document.title,
          send_page_view: false,
          debug_mode: true,
        });
        sendGaPageView(router.state.location.pathname);
      }

      forceScrollTop();
      window.setTimeout(forceScrollTop, 0);
      window.setTimeout(forceScrollTop, 80);
      window.setTimeout(forceScrollTop, 180);
      requestAnimationFrame(forceScrollTop);
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  return (
    <>
      {!isMobile() && !shouldHideCoupangAds && (
        <CoupangAd
          id={823795}
          trackingCode="AF3245048"
          width="120"
          height="600"
        />
      )}
      <div
        id="app-scroll"
        className={`${!isMobile() && "wrapper"} `}
        style={{
          overflowY: isMobile() ? "auto" : "scroll",
          scrollbarGutter: "stable",
          WebkitOverflowScrolling: "touch",
          // height: "100%",
        }}
      >
        <div
          className={`${isMobile() && "wrapper"}`}
          style={
            isMobile()
              ? { overflow: "visible", height: "auto", minHeight: "100vh" }
              : undefined
          }
        >
          {/* @ts-ignore */}
          <RouterProvider router={router} />
        </div>
        {isMobile() && (
          <div
            style={{
              position: "fixed",
              bottom: shouldHideCoupangAds ? 0 : "60px",
              left: 0,
              right: 0,
              zIndex: 1000,
              textAlign: "center",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              padding: "4px 8px",
              // borderTop: "1px solid #efefef",
            }}
          >
            <div style={{ fontSize: "8px", color: "#b8b8b8", lineHeight: 1 }}>
              이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의
              수수료를 제공받습니다.
            </div>
            <a
              href="https://www.instagram.com/sn9tk"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: "8px",
                color: "#9a9a9a",
                textDecoration: "none",
                display: "inline-block",
                marginBottom: "2px",
              }}
            >
              © 2026 Songtak. All rights reserved.
            </a>
          </div>
        )}
        {isMobile() && !shouldHideCoupangAds && (
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
      {!isMobile() && !shouldHideCoupangAds && (
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
