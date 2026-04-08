import React, { useEffect, useMemo, useRef, useState } from "react";

type RoutePoint = {
  lat: number;
  lon: number;
  ele: number | null;
};

type CurrentLocation = {
  lat: number;
  lon: number;
};

type MakerView = "menu" | "create";

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

const formatDistance = (distanceKm: number) =>
  distanceKm === 0 ? "0km" : `${distanceKm.toFixed(2)} km`;

const getSourcePointIndex = (
  displayIndex: number,
  manualPointCount: number,
) => {
  if (displayIndex < manualPointCount) {
    return displayIndex;
  }

  const mirroredIndex = displayIndex - manualPointCount;
  return manualPointCount - 2 - mirroredIndex;
};

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
  options?: {
    isDragging?: boolean;
  },
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
    box-shadow:${
      options?.isDragging
        ? "0 0 0 8px rgba(59, 130, 246, 0.18), 0 12px 24px rgba(15, 23, 42, 0.28)"
        : "0 6px 16px rgba(15, 23, 42, 0.18)"
    };
    border:${options?.isDragging ? 3 : 2}px solid rgba(255,255,255,0.92);
    opacity:${options?.isDragging ? 0.92 : 1};
    transition:box-shadow 120ms ease, opacity 120ms ease, border-width 120ms ease;
    user-select:none;
    -webkit-user-select:none;
    -webkit-user-drag:none;
  ">
    ${label}
  </div>
`;

const createCurrentLocationMarkerHtml = () => `
  <div style="
    position:relative;
    width:18px;
    height:18px;
    border-radius:999px;
    background:#2563eb;
    border:3px solid rgba(255,255,255,0.96);
    box-shadow:0 0 0 10px rgba(37, 99, 235, 0.18), 0 8px 18px rgba(15, 23, 42, 0.18);
  ">
    <div style="
      position:absolute;
      inset:3px;
      border-radius:999px;
      background:#93c5fd;
      opacity:0.9;
    "></div>
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

const downloadViaWorker = async (
  fileName: string,
  content: string,
  onSuccess?: () => void,
  onError?: () => void,
) => {
  try {
    const res = await fetch(`${ELEVATION_PROXY_URL}download-gpx`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName, content }),
    });

    if (!res.ok) throw new Error("download failed");

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();

    window.URL.revokeObjectURL(url);

    onSuccess?.();
  } catch (e) {
    onError?.();
  }
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
  const [view, setView] = useState<MakerView>("menu");
  const [routeName, setRouteName] = useState("");
  const [manualPoints, setManualPoints] = useState<RoutePoint[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFetchingElevation, setIsFetchingElevation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);
  const [isReturnRouteEnabled, setIsReturnRouteEnabled] = useState(false);
  const [returnTrimCount, setReturnTrimCount] = useState(0);

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const routeNameInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<any>(null);
  const clickListenerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const markerListenerRefs = useRef<any[]>([]);
  const isDraggingMarkerRef = useRef(false);
  const lastDragEndedAtRef = useRef(0);
  const points = useMemo(() => {
    if (!isReturnRouteEnabled || manualPoints.length < 2) {
      return manualPoints;
    }

    const returnPoints = manualPoints.slice(0, -1).reverse();
    const visibleReturnPoints = returnPoints.slice(
      0,
      Math.max(0, returnPoints.length - returnTrimCount),
    );

    return [
      ...manualPoints,
      ...visibleReturnPoints.map((point) => ({ ...point })),
    ];
  }, [isReturnRouteEnabled, manualPoints, returnTrimCount]);
  const displayPointSourceIndices = useMemo(() => {
    if (!isReturnRouteEnabled || manualPoints.length < 2) {
      return manualPoints.map((_, index) => index);
    }

    const returnSourceIndices = Array.from(
      { length: Math.max(0, manualPoints.length - 1) },
      (_, index) => manualPoints.length - 2 - index,
    ).slice(0, Math.max(0, manualPoints.length - 1 - returnTrimCount));

    return [...manualPoints.map((_, index) => index), ...returnSourceIndices];
  }, [isReturnRouteEnabled, manualPoints, returnTrimCount]);

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

  const dismissMobileKeyboard = (target: EventTarget | null) => {
    const inputElement = routeNameInputRef.current;

    if (!inputElement || document.activeElement !== inputElement) {
      return;
    }

    if (target instanceof HTMLElement && target.closest("input, textarea")) {
      return;
    }

    inputElement.blur();
  };

  const addPointWithElevation = async (lat: number, lon: number) => {
    setIsFetchingElevation(true);
    setErrorMessage("");

    try {
      const elevation = await fetchElevation(lat, lon);
      setManualPoints((currentPoints) => [
        ...currentPoints,
        { lat, lon, ele: elevation },
      ]);
    } catch (error) {
      setManualPoints((currentPoints) => [
        ...currentPoints,
        { lat, lon, ele: null },
      ]);
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
    const sourceIndex = displayPointSourceIndices[index] ?? -1;

    if (sourceIndex < 0) {
      return;
    }

    setIsFetchingElevation(true);
    setErrorMessage("");

    try {
      const elevation = await fetchElevation(lat, lon);
      setManualPoints((currentPoints) =>
        currentPoints.map((currentPoint, currentIndex) =>
          currentIndex === sourceIndex
            ? { lat, lon, ele: elevation }
            : currentPoint,
        ),
      );
    } catch (error) {
      setManualPoints((currentPoints) =>
        currentPoints.map((currentPoint, currentIndex) =>
          currentIndex === sourceIndex ? { lat, lon, ele: null } : currentPoint,
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
    setReturnTrimCount((currentTrimCount) =>
      Math.min(currentTrimCount, Math.max(0, manualPoints.length - 1)),
    );
  }, [manualPoints.length]);

  useEffect(() => {
    if (!isReturnRouteEnabled) {
      return;
    }

    if (returnTrimCount >= Math.max(0, manualPoints.length - 1)) {
      setIsReturnRouteEnabled(false);
      setReturnTrimCount(0);
    }
  }, [isReturnRouteEnabled, manualPoints.length, returnTrimCount]);

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
    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        // Ignore location permission errors and keep the page usable.
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 10000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (
      view !== "create" ||
      !isMapReady ||
      !mapElementRef.current ||
      !window.naver?.maps
    ) {
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
        if (isDraggingMarkerRef.current) {
          return;
        }

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
  }, [isMapReady, view]);

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

      const updateMarkerAppearance = (options?: { isDragging?: boolean }) => {
        marker.setIcon({
          content: createMarkerHtml(
            label,
            backgroundColor,
            size,
            fontSize,
            options,
          ),
          anchor: new window.naver.maps.Point(size / 2, size / 2),
        });
      };

      const marker = new window.naver.maps.Marker({
        map,
        position: new window.naver.maps.LatLng(point.lat, point.lon),
        draggable: true,
        icon: {
          content: createMarkerHtml(label, backgroundColor, size, fontSize),
          anchor: new window.naver.maps.Point(size / 2, size / 2),
        },
      });

      markerListenerRefs.current.push(
        window.naver.maps.Event.addListener(marker, "dragstart", () => {
          isDraggingMarkerRef.current = true;
          updateMarkerAppearance({ isDragging: true });
        }),
      );

      markerListenerRefs.current.push(
        window.naver.maps.Event.addListener(marker, "dragend", () => {
          const position = marker.getPosition();
          const lat =
            typeof position?.lat === "function" ? position.lat() : position?.y;
          const lon =
            typeof position?.lng === "function" ? position.lng() : position?.x;

          isDraggingMarkerRef.current = false;
          updateMarkerAppearance();
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

  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps || !currentLocation) {
      return;
    }

    const position = new window.naver.maps.LatLng(
      currentLocation.lat,
      currentLocation.lon,
    );

    if (!currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current = new window.naver.maps.Marker({
        map: mapRef.current,
        position,
        zIndex: 900,
        icon: {
          content: createCurrentLocationMarkerHtml(),
          anchor: new window.naver.maps.Point(9, 9),
        },
      });
      return;
    }

    currentLocationMarkerRef.current.setMap(mapRef.current);
    currentLocationMarkerRef.current.setPosition(position);
  }, [currentLocation]);

  const handleUndo = () => {
    if (isReturnRouteEnabled) {
      setReturnTrimCount((currentTrimCount) =>
        Math.min(currentTrimCount + 1, Math.max(0, manualPoints.length - 1)),
      );
      return;
    }

    setManualPoints((currentPoints) => currentPoints.slice(0, -1));
  };

  const handleReset = () => {
    isDraggingMarkerRef.current = false;
    setIsReturnRouteEnabled(false);
    setReturnTrimCount(0);
    setManualPoints([]);
  };

  const handleToggleReturnRoute = () => {
    if (isReturnRouteEnabled) {
      setIsReturnRouteEnabled(false);
      setReturnTrimCount(0);
      return;
    }

    if (manualPoints.length < 2) {
      setErrorMessage(
        "왕복 경로를 만들려면 최소 2개 이상의 지점을 찍어주세요.",
      );
      return;
    }

    setErrorMessage("");
    setReturnTrimCount(0);
    setIsReturnRouteEnabled(true);
  };

  const handleDownload = () => {
    if (points.length < 2) {
      setErrorMessage("GPX 파일을 만들려면 최소 2개 이상의 지점을 찍어주세요.");
      return;
    }

    const trimmedRouteName = routeName.trim() || "내 경로";
    setErrorMessage("");

    try {
      downloadViaWorker(
        `${trimmedRouteName.replace(/\s+/g, "-")}.gpx`,
        buildGpxContent(points, trimmedRouteName),
        () => {
          //   alert("GPX 파일이 다운로드되었어요!");
          //   window.open("https://link.coupang.com/a/ei7Vvo", "_blank");
          // GA 이벤트 / 토스트 / 상태 변경 가능
        },
        () => {
          console.log("다운로드 실패");
        },
      );
    } catch (_error) {
      setErrorMessage("GPX 파일 다운로드에 실패했어요.");
    }
  };

  return (
    <div
      onTouchStartCapture={(event) => dismissMobileKeyboard(event.target)}
      onMouseDownCapture={(event) => dismissMobileKeyboard(event.target)}
      style={{
        width: "100%",
        padding: "24px 16px 48px",
        fontFamily: "GMedium",
        color: "#021227",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
        <div className="fs28" style={{ marginBottom: "8px" }}>
          나만의 지도 만들기 📍
        </div>

        {view === "menu" ? (
          <>
            <div
              className="fs14"
              style={{
                color: "#6b7280",
                lineHeight: 1.7,
                marginBottom: "20px",
              }}
            >
              지도를 직접 터치해 나만의 경로를 새로 만들거나,
              <br />
              기존 GPX 경로를 불러와 수정할 수 있어요.
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                maxWidth: "340px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("");
                  setView("create");
                }}
                style={{
                  minHeight: "56px",
                  padding: "0 20px",
                  borderRadius: "999px",
                  border: "1px solid rgba(148, 163, 184, 0.28)",
                  backgroundColor: "transparent",
                  color: "#0f172a",
                  fontSize: "15px",
                  fontFamily: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
                }}
              >
                새로 만들기
              </button>

              <button
                type="button"
                onClick={() =>
                  setErrorMessage("기존 경로 수정하기는 아직 준비 중이에요.")
                }
                style={{
                  minHeight: "56px",
                  padding: "0 20px",
                  borderRadius: "999px",
                  border: "1px solid rgba(148, 163, 184, 0.28)",
                  backgroundColor: "transparent",
                  color: "#0f172a",
                  fontSize: "15px",
                  fontFamily: "inherit",
                  textAlign: "left",
                  cursor: "pointer",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
                }}
              >
                기존 경로 수정하기
              </button>
            </div>

            <div
              style={{
                color: "#fdc494",
                lineHeight: 1.5,
                marginTop: "12px",
                fontSize: "11px",
                marginLeft: "1rem",
                marginRight: "1rem",
              }}
            >
              * 일부 앱 내 브라우저에서는 파일 다운로드가 제한될 수 있어,
              <br />
              사파리, 크롬 같은 기본 브라우저 사용을 권장해요.
            </div>

            {errorMessage ? (
              <div
                style={{
                  marginTop: "16px",
                  borderRadius: "18px",
                  backgroundColor: "#fef2f2",
                  color: "#b91c1c",
                  padding: "14px 16px",
                }}
              >
                {errorMessage}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div
              style={{
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  padding: "clamp(12px, 3vw, 16px) clamp(16px, 4.8vw, 22px)",
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

                <div
                  style={{ display: "flex", gap: "clamp(8px, 1.6vw, 16px)" }}
                >
                  <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
                    <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                      지점
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(17px, 3.8vw, 22px)",
                        color: "#0f172a",
                      }}
                    >
                      {points.length}
                    </div>
                  </div>

                  <div style={{ flex: 3, minWidth: 0, textAlign: "right" }}>
                    <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                      총 거리
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(17px, 3.8vw, 22px)",
                        color: "#ea580c",
                      }}
                    >
                      {formatDistance(totalDistanceKm)}
                    </div>
                  </div>

                  <div style={{ flex: 3, minWidth: 0, textAlign: "right" }}>
                    <div style={{ color: "#94a3b8", fontSize: "11px" }}>
                      상승 고도
                    </div>
                    <div
                      style={{
                        fontSize: "clamp(17px, 3.8vw, 22px)",
                        color: "#2563eb",
                      }}
                    >
                      {`${Math.round(elevationGain ?? 0)}m`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                flexWrap: "nowrap",
                marginBottom: "6px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  gap: "10px",
                  flexWrap: "nowrap",
                  minWidth: 0,
                }}
              >
                <button
                  type="button"
                  onClick={handleToggleReturnRoute}
                  disabled={!isReturnRouteEnabled && manualPoints.length < 2}
                  className="gmedium fs10"
                  style={{
                    height: "32px",
                    padding: "0 12px",

                    borderRadius: "999px",
                    border: "1.6px solid #2563eb",
                    backgroundColor: isReturnRouteEnabled
                      ? "#0f172a"
                      : "#ffffff",
                    color: isReturnRouteEnabled ? "#efefef" : "#2563eb",
                    cursor:
                      isReturnRouteEnabled || manualPoints.length >= 2
                        ? "pointer"
                        : "not-allowed",
                    opacity:
                      isReturnRouteEnabled || manualPoints.length >= 2
                        ? 1
                        : 0.45,
                    whiteSpace: "nowrap",
                    flexShrink: 1,
                    minWidth: 0,
                  }}
                >
                  {isReturnRouteEnabled ? "왕복 경로 해제" : "왕복 경로 설정"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!manualPoints.length}
                  className="gmedium fs10"
                  style={{
                    height: "32px",
                    padding: "0 12px",
                    borderRadius: "999px",
                    border: "1.6px solid #ea580c",
                    backgroundColor: "#ffffff",

                    cursor: manualPoints.length ? "pointer" : "not-allowed",
                    opacity: manualPoints.length ? 1 : 0.45,
                    whiteSpace: "nowrap",
                    flexShrink: 1,
                    minWidth: 0,
                    color: "#ea580c",
                  }}
                >
                  전체 초기화
                </button>
              </div>

              <button
                type="button"
                onClick={handleUndo}
                disabled={!manualPoints.length}
                className="gmedium fs10"
                style={{
                  height: "32px",
                  padding: "0 12px",
                  borderRadius: "999px",
                  border: "1.6px solid #383838",
                  backgroundColor: "#ffffff",
                  cursor: manualPoints.length ? "pointer" : "not-allowed",
                  opacity: manualPoints.length ? 1 : 0.45,

                  marginLeft: "auto",
                  whiteSpace: "nowrap",
                  flexShrink: 1,
                  minWidth: 0,
                  color: "#383838",
                }}
              >
                마지막 점 삭제
              </button>
            </div>

            {errorMessage ? (
              <div
                style={{
                  marginBottom: "10px",
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
                minHeight: "clamp(360px, 58vh, 560px)",
                borderRadius: "28px",
                overflow: "hidden",
                background:
                  "radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent 52%), #e2e8f0",
                border: "1px solid rgba(148, 163, 184, 0.16)",
              }}
            />

            <div
              style={{
                marginTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "nowrap",
              }}
            >
              <div
                style={{
                  flex: "1 1 auto",
                  minWidth: 0,
                }}
              >
                <input
                  ref={routeNameInputRef}
                  value={routeName}
                  onChange={(event) => setRouteName(event.target.value)}
                  placeholder="경로 이름을 입력해주세요"
                  className="glight"
                  style={{
                    width: "100%",
                    height: "42px",
                    borderRadius: "999px",
                    border: "1px solid rgba(148, 163, 184, 0.22)",
                    padding: "0 16px",
                    fontSize: "12px",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!canDownload}
                className="gmedium fs12"
                style={{
                  flexShrink: 0,
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
          </>
        )}
      </div>
    </div>
  );
};

export default GpxMakerPage;
