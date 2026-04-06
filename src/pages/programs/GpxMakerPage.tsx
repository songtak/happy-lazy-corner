import React, { useEffect, useMemo, useRef, useState } from "react";

type RoutePoint = {
  lat: number;
  lon: number;
  ele: number | null;
};

const NAVER_MAP_CLIENT_ID = "uqms5x0d6b";
const NAVER_MAP_SCRIPT_ID = "naver-map-sdk";
const ELEVATION_PROXY_URL =
  `${import.meta.env.VITE_ELEVATION_PROXY_URL || ""}`.trim();
const OPENTOPO_BASE_URL = import.meta.env.DEV
  ? "/api/opentopo/v1/aster30m,srtm90m"
  : ELEVATION_PROXY_URL || "https://api.opentopodata.org/v1/aster30m,srtm90m";

declare global {
  interface Window {
    naver?: any;
  }
}

const formatDistance = (distanceKm: number) => `${distanceKm.toFixed(2)} km`;

const calculateDistanceInMeters = (
  firstLat: number,
  firstLon: number,
  secondLat: number,
  secondLon: number,
) => {
  const earthRadius = 6371000;
  const toRadian = (value: number) => (value * Math.PI) / 180;

  const latDelta = toRadian(secondLat - firstLat);
  const lonDelta = toRadian(secondLon - firstLon);
  const firstLatInRadian = toRadian(firstLat);
  const secondLatInRadian = toRadian(secondLat);

  const haversineValue =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(firstLatInRadian) *
      Math.cos(secondLatInRadian) *
      Math.sin(lonDelta / 2) ** 2;

  return (
    2 *
    earthRadius *
    Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))
  );
};

const loadNaverMapScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.naver?.maps) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(
      NAVER_MAP_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("네이버 지도 스크립트를 불러오지 못했어요.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = NAVER_MAP_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID}`;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("네이버 지도 스크립트를 불러오지 못했어요."));
    document.head.appendChild(script);
  });

const createMarkerHtml = (
  label: string,
  backgroundColor: string,
  size = 24,
  fontSize = 10,
) => `
  <div style="
    display:flex;
    align-items:center;
    justify-content:center;
    width:${size}px;
    height:${size}px;
    border-radius:999px;
    background:${backgroundColor};
    color:#fff;
    font-size:${fontSize}px;
    font-weight:700;
    box-shadow:0 6px 16px rgba(15, 23, 42, 0.18);
    border:2px solid rgba(255,255,255,0.92);
  ">
    ${label}
  </div>
`;

const buildGpxContent = (points: RoutePoint[], fileName: string) => {
  const escapedName = fileName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const trackPoints = points
    .map((point) => {
      const elevationTag =
        point.ele === null ? "" : `<ele>${point.ele.toFixed(1)}</ele>`;

      return `      <trkpt lat="${point.lat.toFixed(7)}" lon="${point.lon.toFixed(
        7,
      )}">${elevationTag}</trkpt>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="happy-lazy-corner" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapedName}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
};

const downloadTextFile = (fileName: string, content: string) => {
  const blob = new Blob([content], {
    type: "application/gpx+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const fetchElevation = async (lat: number, lon: number) => {
  const response = await fetch(`${OPENTOPO_BASE_URL}?locations=${lat},${lon}`);

  if (!response.ok) {
    throw new Error("고도 정보를 불러오지 못했어요.");
  }

  const data = await response.json();
  const result = data?.results?.[0];

  if (data?.status !== "OK") {
    throw new Error("고도 정보를 불러오지 못했어요.");
  }

  return typeof result?.elevation === "number" ? result.elevation : null;
};

const GpxMakerPage = () => {
  const [routeName, setRouteName] = useState("");
  const [points, setPoints] = useState<RoutePoint[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFetchingElevation, setIsFetchingElevation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const clickListenerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const markerListenerRefs = useRef<any[]>([]);
  const longPressTimerRef = useRef<number | null>(null);
  const activeDragPointIndexRef = useRef<number | null>(null);
  const lastDragEndedAtRef = useRef(0);

  const totalDistanceKm = useMemo(() => {
    if (points.length < 2) {
      return 0;
    }

    return (
      points.slice(1).reduce((accumulator, point, index) => {
        const previousPoint = points[index];
        return (
          accumulator +
          calculateDistanceInMeters(
            previousPoint.lat,
            previousPoint.lon,
            point.lat,
            point.lon,
          )
        );
      }, 0) / 1000
    );
  }, [points]);

  const elevationGain = useMemo(() => {
    if (points.length < 2) {
      return null;
    }

    return points.slice(1).reduce((accumulator, point, index) => {
      const previousPoint = points[index];

      if (previousPoint.ele === null || point.ele === null) {
        return accumulator;
      }

      const delta = point.ele - previousPoint.ele;
      return delta > 0 ? accumulator + delta : accumulator;
    }, 0);
  }, [points]);
  const canDownload = routeName.trim().length > 0 && points.length >= 2;

  const addPointWithElevation = async (lat: number, lon: number) => {
    setIsFetchingElevation(true);
    setErrorMessage("");

    try {
      const elevation = await fetchElevation(lat, lon);
      setPoints((currentPoints) => [
        ...currentPoints,
        { lat, lon, ele: elevation },
      ]);
    } catch (error) {
      setPoints((currentPoints) => [...currentPoints, { lat, lon, ele: null }]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "고도 정보를 불러오는 중 문제가 발생했어요.",
      );
    } finally {
      setIsFetchingElevation(false);
    }
  };

  const updatePointWithElevation = async (
    index: number,
    lat: number,
    lon: number,
  ) => {
    setIsFetchingElevation(true);
    setErrorMessage("");

    try {
      const elevation = await fetchElevation(lat, lon);
      setPoints((currentPoints) =>
        currentPoints.map((currentPoint, currentIndex) =>
          currentIndex === index ? { lat, lon, ele: elevation } : currentPoint,
        ),
      );
    } catch (error) {
      setPoints((currentPoints) =>
        currentPoints.map((currentPoint, currentIndex) =>
          currentIndex === index ? { lat, lon, ele: null } : currentPoint,
        ),
      );
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "고도 정보를 불러오는 중 문제가 발생했어요.",
      );
    } finally {
      setIsFetchingElevation(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    loadNaverMapScript()
      .then(() => {
        if (isMounted) {
          setIsMapReady(true);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "네이버 지도를 준비하는 중 문제가 발생했어요.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !mapElementRef.current || !window.naver?.maps) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = new window.naver.maps.Map(mapElementRef.current, {
        center: new window.naver.maps.LatLng(37.5665, 126.978),
        zoom: 12,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.naver.maps.MapTypeControlStyle.BUTTON,
          position: window.naver.maps.Position.TOP_LEFT,
        },
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT,
        },
      });
    }

    const map = mapRef.current;

    if (clickListenerRef.current) {
      window.naver.maps.Event.removeListener(clickListenerRef.current);
    }

    clickListenerRef.current = window.naver.maps.Event.addListener(
      map,
      "click",
      (event: any) => {
        if (Date.now() - lastDragEndedAtRef.current < 300) {
          return;
        }

        const coordinate = event?.coord;

        if (!coordinate) {
          return;
        }

        const lat =
          typeof coordinate.lat === "function"
            ? coordinate.lat()
            : coordinate.y;
        const lon =
          typeof coordinate.lng === "function"
            ? coordinate.lng()
            : coordinate.x;

        if (typeof lat !== "number" || typeof lon !== "number") {
          return;
        }

        void addPointWithElevation(lat, lon);
      },
    );

    return () => {
      if (clickListenerRef.current) {
        window.naver.maps.Event.removeListener(clickListenerRef.current);
        clickListenerRef.current = null;
      }
    };
  }, [isMapReady]);

  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) {
      return;
    }

    const map = mapRef.current;

    polylineRef.current?.setMap(null);
    polylineRef.current = null;

    markerListenerRefs.current.forEach((listener) => {
      window.naver.maps.Event.removeListener(listener);
    });
    markerListenerRefs.current = [];
    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = [];

    if (!points.length) {
      return;
    }

    const path = points.map(
      (point) => new window.naver.maps.LatLng(point.lat, point.lon),
    );

    polylineRef.current = new window.naver.maps.Polyline({
      map,
      path,
      strokeColor: "#f97316",
      strokeWeight: 4,
      strokeOpacity: 0.9,
      strokeLineCap: "round",
      strokeLineJoin: "round",
    });

    markerRefs.current = points.map((point, index) => {
      const isStart = index === 0;
      const isEnd = index === points.length - 1;
      const label = isStart ? "S" : isEnd ? "E" : `${index + 1}`;
      const backgroundColor = isStart
        ? "#22c55e"
        : isEnd
          ? "#f97316"
          : "#0f172a";
      const size = isStart || isEnd ? 24 : 20;
      const fontSize = isStart || isEnd ? 10 : 9;

      const marker = new window.naver.maps.Marker({
        map,
        position: new window.naver.maps.LatLng(point.lat, point.lon),
        draggable: false,
        icon: {
          content: createMarkerHtml(label, backgroundColor, size, fontSize),
          anchor: new window.naver.maps.Point(size / 2, size / 2),
        },
      });

      const clearLongPressTimer = () => {
        if (longPressTimerRef.current !== null) {
          window.clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      };

      const enableDragMode = () => {
        clearLongPressTimer();
        activeDragPointIndexRef.current = index;
        marker.setDraggable(true);
      };

      markerListenerRefs.current.push(
        window.naver.maps.Event.addListener(marker, "mousedown", () => {
          clearLongPressTimer();
          longPressTimerRef.current = window.setTimeout(enableDragMode, 450);
        }),
      );
      markerListenerRefs.current.push(
        window.naver.maps.Event.addListener(marker, "mouseup", () => {
          clearLongPressTimer();
        }),
      );
      markerListenerRefs.current.push(
        window.naver.maps.Event.addListener(marker, "mouseout", () => {
          clearLongPressTimer();
        }),
      );
      markerListenerRefs.current.push(
        window.naver.maps.Event.addListener(marker, "dragend", () => {
          clearLongPressTimer();
          const position = marker.getPosition();
          const lat =
            typeof position?.lat === "function" ? position.lat() : position?.y;
          const lon =
            typeof position?.lng === "function" ? position.lng() : position?.x;

          marker.setDraggable(false);
          activeDragPointIndexRef.current = null;
          lastDragEndedAtRef.current = Date.now();

          if (typeof lat !== "number" || typeof lon !== "number") {
            return;
          }

          void updatePointWithElevation(index, lat, lon);
        }),
      );

      return marker;
    });

    if (points.length === 1) {
      map.setCenter(path[0]);
      map.setZoom(15);
    }
  }, [points]);

  const handleUndo = () => {
    setPoints((currentPoints) => currentPoints.slice(0, -1));
  };

  const handleReset = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setPoints([]);
  };

  const handleDownload = () => {
    if (points.length < 2) {
      setErrorMessage("GPX 파일을 만들려면 최소 2개 이상의 지점을 찍어주세요.");
      return;
    }

    const trimmedRouteName = routeName.trim() || "my-route";
    setErrorMessage("");

    downloadTextFile(
      `${trimmedRouteName.replace(/\s+/g, "-")}.gpx`,
      buildGpxContent(points, trimmedRouteName),
    );

    setTimeout(() => {
      window.location.href = "https://link.coupang.com/a/ei7Vvo";
    }, 500);
  };

  return (
    <div
      style={{
        width: "100%",
        padding: "24px 16px 48px",
        fontFamily: "GMedium",
        color: "#1f2937",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
        <div className="fs28" style={{ marginBottom: "8px" }}>
          내 지도 만들기 🗺️
        </div>
        <div
          style={{ color: "#6b7280", lineHeight: 1.7, marginBottom: "20px" }}
        >
          지도에서 원하는 경로를 직접 클릭해 포인트를 추가하고,
          <br />그 경로를 GPX 파일로 내려받을 수 있어요.
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              padding: "18px",
              borderRadius: "24px",
              backgroundColor: "#f8fafc",
              border: "1px solid rgba(148, 163, 184, 0.16)",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "13px",
                marginBottom: "8px",
              }}
            >
              파일 이름
            </div>
            <input
              value={routeName}
              onChange={(event) => setRouteName(event.target.value)}
              placeholder="my-route"
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "14px",
                border: "1px solid rgba(148, 163, 184, 0.22)",
                padding: "0 14px",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              padding: "18px",
              borderRadius: "24px",
              backgroundColor: "#f8fafc",
              border: "1px solid rgba(148, 163, 184, 0.16)",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "13px",
                marginBottom: "8px",
              }}
            >
              경로 정보
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <div style={{ color: "#94a3b8", fontSize: "12px" }}>포인트</div>
                <div style={{ fontSize: "22px", color: "#0f172a" }}>
                  {points.length}
                </div>
              </div>
              <div>
                <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                  총 거리
                </div>
                <div style={{ fontSize: "22px", color: "#ea580c" }}>
                  {formatDistance(totalDistanceKm)}
                </div>
              </div>
              <div>
                <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                  상승 고도
                </div>
                <div style={{ fontSize: "22px", color: "#2563eb" }}>
                  {elevationGain === null
                    ? "-"
                    : `${Math.round(elevationGain)} m`}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <button
            type="button"
            onClick={handleUndo}
            disabled={!points.length}
            style={{
              height: "42px",
              padding: "0 16px",
              borderRadius: "999px",
              border: "1px solid rgba(148, 163, 184, 0.22)",
              backgroundColor: "#ffffff",
              cursor: points.length ? "pointer" : "not-allowed",
              opacity: points.length ? 1 : 0.45,
            }}
          >
            마지막 점 삭제
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!points.length}
            style={{
              height: "42px",
              padding: "0 16px",
              borderRadius: "999px",
              border: "1px solid rgba(148, 163, 184, 0.22)",
              backgroundColor: "#ffffff",
              cursor: points.length ? "pointer" : "not-allowed",
              opacity: points.length ? 1 : 0.45,
            }}
          >
            전체 초기화
          </button>
        </div>

        {/* {isFetchingElevation ? (
          <div
            style={{
              marginBottom: "12px",
              color: "#475569",
              fontSize: "14px",
            }}
          >
            OpenTopoData에서 고도 정보를 불러오는 중이에요...
          </div>
        ) : null} */}

        {errorMessage ? (
          <div
            style={{
              marginBottom: "16px",
              borderRadius: "18px",
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              padding: "14px 16px",
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        <div
          ref={mapElementRef}
          style={{
            width: "100%",
            minHeight: "560px",
            borderRadius: "28px",
            overflow: "hidden",
            background:
              "radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent 52%), #e2e8f0",
            border: "1px solid rgba(148, 163, 184, 0.16)",
          }}
        />

        <div
          style={{
            marginTop: "16px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            onClick={handleDownload}
            disabled={!canDownload}
            style={{
              height: "42px",
              padding: "0 18px",
              borderRadius: "999px",
              border: "none",
              backgroundColor: "#111827",
              color: "#ffffff",
              cursor: canDownload ? "pointer" : "not-allowed",
              opacity: canDownload ? 1 : 0.45,
            }}
          >
            GPX 다운로드
          </button>
        </div>
      </div>
    </div>
  );
};

export default GpxMakerPage;
