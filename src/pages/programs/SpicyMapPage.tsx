import React, { useEffect, useMemo, useRef, useState } from "react";
import { isMobile } from "@libs/helpers";

const NAVER_MAP_CLIENT_ID = "uqms5x0d6b";
const NAVER_MAP_SCRIPT_ID = "spicy-map-naver-script";
const LAST_QUERY_KEY = "spicyMapLastQueryV1";

type GeocodedLocation = {
  lat: number;
  lon: number;
  address: string;
};

const loadNaverMaps = () =>
  new Promise<void>((resolve, reject) => {
    if (window.naver?.maps?.Service) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(
      NAVER_MAP_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    const expectedScriptSrc = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      NAVER_MAP_CLIENT_ID,
    )}&submodules=geocoder`;

    if (existingScript) {
      if (existingScript.src === expectedScriptSrc) {
        existingScript.addEventListener("load", () => resolve(), {
          once: true,
        });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("네이버 지도 스크립트를 불러오지 못했어요.")),
          { once: true },
        );
        return;
      }

      existingScript.remove();
      window.naver = undefined;
    }

    const script = document.createElement("script");
    script.id = NAVER_MAP_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = expectedScriptSrc;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("네이버 지도 스크립트를 불러오지 못했어요."));
    document.head.appendChild(script);
  });

const geocodeAddress = (query: string) =>
  new Promise<GeocodedLocation>((resolve, reject) => {
    if (!window.naver?.maps?.Service) {
      reject(new Error("주소 검색 기능을 불러오지 못했어요."));
      return;
    }

    window.naver.maps.Service.geocode(
      { query },
      (status: string, response: any) => {
        if (status !== window.naver.maps.Service.Status.OK) {
          reject(new Error("검색 결과를 찾지 못했어요."));
          return;
        }

        const item = response?.v2?.addresses?.[0];
        if (!item?.x || !item?.y) {
          reject(new Error("검색 결과를 찾지 못했어요."));
          return;
        }

        resolve({
          lat: Number(item.y),
          lon: Number(item.x),
          address:
            item.roadAddress ||
            item.jibunAddress ||
            item.englishAddress ||
            query,
        });
      },
    );
  });

const SpicyMapPage = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [query, setQuery] = useState("");
  const [searchedLabel, setSearchedLabel] = useState("");
  const [statusText, setStatusText] = useState(
    "검색어를 입력하면 그 위치로 지도를 이동합니다.",
  );
  const mobile = isMobile();
  const pageWidth = mobile ? "calc(100vw - 32px)" : "100%";
  const pageMaxWidth = mobile ? "calc(100vw - 32px)" : "100%";

  const defaultCenter = useMemo(
    () => ({ lat: 36.5, lng: 127.8 }),
    [],
  );

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || !window.naver?.maps || mapInstanceRef.current) {
        return;
      }

      const lastQuery = localStorage.getItem(LAST_QUERY_KEY)?.trim() ?? "";
      const initialCenter = new window.naver.maps.LatLng(
        defaultCenter.lat,
        defaultCenter.lng,
      );
      const map = new window.naver.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 13,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
      });

      mapInstanceRef.current = map;

      if (lastQuery) {
        try {
          const location = await geocodeAddress(lastQuery);
          map.setCenter(new window.naver.maps.LatLng(location.lat, location.lon));
          map.setZoom(16);
          setSearchedLabel(location.address);
          setStatusText(`마지막 검색 위치: ${location.address}`);
        } catch {
          setSearchedLabel(lastQuery);
          setStatusText("마지막 검색 위치를 불러오지 못했어요.");
        }
      } else {
        setSearchedLabel("");
        setStatusText("검색어를 입력하면 그 위치로 지도를 이동합니다.");
      }
    };

    loadNaverMaps()
      .then(initializeMap)
      .catch((error) => {
        setStatusText(
          error instanceof Error
            ? error.message
            : "네이버 지도를 불러오지 못했어요.",
        );
      });

    return () => {
      mapInstanceRef.current = null;
    };
  }, [defaultCenter]);

  const handleSearch = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || !mapInstanceRef.current) {
      setStatusText("검색어를 먼저 입력해 주세요.");
      return;
    }

    try {
      setStatusText("검색 중...");
      const location = await geocodeAddress(trimmedQuery);
      mapInstanceRef.current.setCenter(
        new window.naver.maps.LatLng(location.lat, location.lon),
      );
      mapInstanceRef.current.setZoom(16);
      localStorage.setItem(LAST_QUERY_KEY, trimmedQuery);
      setSearchedLabel(location.address);
      setStatusText(`검색 완료: ${location.address}`);
    } catch (error) {
      setStatusText(
        error instanceof Error ? error.message : "검색에 실패했어요.",
      );
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "24px 16px",
        display: "grid",
        gap: 16,
        background:
          "linear-gradient(180deg, rgba(255,244,231,1) 0%, rgba(255,255,255,1) 42%, rgba(255,245,241,1) 100%)",
      }}
    >
      <div
        style={{
          width: pageWidth,
          maxWidth: pageMaxWidth,
          margin: "0 auto",
          display: "grid",
          gap: 8,
          boxSizing: "border-box",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 36, lineHeight: 1.1 }}>
          맵지도
        </h1>
        <p style={{ margin: 0, color: "#57534e" }}>
          맵다와 지도를 합친 검색 지도입니다.
        </p>
      </div>

      <div
        style={{
          width: pageWidth,
          maxWidth: pageMaxWidth,
          margin: "0 auto",
          display: "grid",
          gap: 10,
          gridTemplateColumns: mobile ? "1fr" : "minmax(0, 1fr) auto",
          alignItems: "end",
          boxSizing: "border-box",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#57534e" }}>검색어</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="예: 김치찌개, 광주역, 서울역"
          style={{
            width: "100%",
            padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(255,255,255,0.9)",
              fontSize: 15,
              boxSizing: "border-box",
            }}
          />
        </label>
        <button
          type="button"
          onClick={handleSearch}
          style={{
            padding: "12px 16px",
            borderRadius: 14,
            border: "none",
            background: "#111827",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            width: mobile ? "100%" : "auto",
            minWidth: mobile ? "100%" : 96,
            whiteSpace: "nowrap",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        >
          검색
        </button>
      </div>

      <div
        ref={mapRef}
        style={{
          width: pageWidth,
          height: "70vh",
          minHeight: 520,
          borderRadius: 24,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.12)",
          background: "#eee",
          maxWidth: pageMaxWidth,
          margin: "0 auto",
        }}
      />

      <div
        style={{
          width: pageWidth,
          maxWidth: pageMaxWidth,
          margin: "0 auto",
          display: "grid",
          gap: 10,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            padding: 16,
            borderRadius: 18,
            background: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(0,0,0,0.06)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ fontWeight: 700 }}>상태</div>
          <div style={{ color: "#57534e", marginTop: 6 }}>{statusText}</div>
          <div style={{ color: "#78716c", fontSize: 13, marginTop: 8 }}>
            {searchedLabel ? `마지막 검색: ${searchedLabel}` : "검색 기록 없음"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpicyMapPage;
