import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocation } from "react-router-dom";

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

type GeocodedLocation = {
  lat: number;
  lon: number;
  address: string;
  title?: string;
};

type SearchField = "start" | "goal";

type MakerImportState = {
  routeName?: string;
  points?: RoutePoint[];
};

const NAVER_MAP_CLIENT_ID = "uqms5x0d6b";
const NAVER_MAP_SCRIPT_ID = "naver-map-sdk";
const MAX_MARKER_COUNT = 1000;
const ELEVATION_PROXY_URL =
  `${import.meta.env.VITE_ELEVATION_PROXY_URL || ""}`.trim();
const OPENTOPO_BASE_URL = import.meta.env.DEV
  ? "/api/opentopo/v1/aster30m,srtm90m"
  : ELEVATION_PROXY_URL || "https://api.opentopodata.org/v1/aster30m,srtm90m";
const ELEVATION_BATCH_SIZE = 100;
const ELEVATION_REQUEST_DELAY_MS = 1200;
const ELEVATION_RATE_LIMIT_MESSAGE =
  "고도 API 요청 제한에 걸렸어요. 잠시 후 다시 시도해주세요.";

declare global {
  interface Window {
    naver?: any;
  }
}

const formatDistance = (distanceKm: number) =>
  distanceKm === 0 ? "0km" : `${distanceKm.toFixed(2)} km`;

const stripHtmlTags = (value: string) => value.replace(/<[^>]*>/g, "").trim();
const limitRoutePoints = (points: RoutePoint[]) =>
  points.slice(0, MAX_MARKER_COUNT);

const parseNumber = (rawValue: string | null) => {
  if (rawValue === null) {
    return null;
  }

  const trimmedValue = rawValue.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const wait = (durationMs: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

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

const parseGpxText = (xmlText: string) => {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(xmlText, "application/xml");
  const parserError = xmlDocument.querySelector("parsererror");

  if (parserError) {
    throw new Error("GPX 파일을 읽는 중에 XML 파싱 오류가 발생했어요.");
  }

  const pointElements = Array.from(
    xmlDocument.querySelectorAll("trkpt, rtept"),
  );

  if (pointElements.length < 2) {
    throw new Error("경로를 그리려면 최소 2개 이상의 좌표가 필요해요.");
  }

  const points = pointElements.reduce<RoutePoint[]>(
    (accumulator, pointElement) => {
      const lat = parseNumber(pointElement.getAttribute("lat"));
      const lon = parseNumber(pointElement.getAttribute("lon"));
      const ele = parseNumber(
        pointElement.querySelector("ele")?.textContent ?? null,
      );

      if (lat === null || lon === null) {
        return accumulator;
      }

      accumulator.push({ lat, lon, ele });
      return accumulator;
    },
    [],
  );

  if (points.length < 2) {
    throw new Error("유효한 위도/경도 좌표를 2개 이상 찾지 못했어요.");
  }

  return points;
};

const loadNaverMapScript = () =>
  new Promise<void>((resolve, reject) => {
    if (window.naver?.maps?.Service) {
      resolve();
      return;
    }

    const expectedScriptSrc = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_CLIENT_ID}&submodules=geocoder`;

    const existingScript = document.getElementById(
      NAVER_MAP_SCRIPT_ID,
    ) as HTMLScriptElement | null;

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

        if (window.naver?.maps?.Service) {
          resolve();
        }

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

const createMarkerHtml = (
  label: string,
  backgroundColor: string,
  size = 24,
  fontSize = 10,
  options?: {
    isDragging?: boolean;
    isSelected?: boolean;
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
        : options?.isSelected
          ? "0 0 0 6px rgba(249, 115, 22, 0.18), 0 10px 22px rgba(15, 23, 42, 0.22)"
          : "0 6px 16px rgba(15, 23, 42, 0.18)"
    };
    border:${options?.isDragging || options?.isSelected ? 3 : 2}px solid rgba(255,255,255,0.92);
    opacity:${options?.isDragging ? 0.92 : 1};
    transition:box-shadow 120ms ease, opacity 120ms ease, border-width 120ms ease;
    user-select:none;
    -webkit-user-select:none;
    -webkit-user-drag:none;
    -webkit-touch-callout:none;
    touch-action:none;
    -ms-touch-action:none;
    pointer-events:auto;
  ">
    ${label}
  </div>
`;

const createMarkerActionOverlayHtml = (options: {
  canInsert: boolean;
  isMoveActive: boolean;
}) => `
  <div style="
    display:flex;
    align-items:center;
    gap:8px;
    pointer-events:auto;
  ">
    <button
      type="button"
      data-marker-action="insert"
      data-disabled="${options.canInsert ? "false" : "true"}"
      style="
        width:30px;
        height:30px;
        border-radius:999px;
        border:1px solid rgba(148, 163, 184, 0.24);
        background:#ffffff;
        color:#0f172a;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:16px;
        box-shadow:0 10px 24px rgba(15, 23, 42, 0.12);
        line-height:1;
        cursor:${options.canInsert ? "pointer" : "not-allowed"};
        opacity:${options.canInsert ? "1" : "0.4"};
        padding:0;
      "
    >+</button>
    <button
      type="button"
      data-marker-action="remove"
      data-disabled="false"
      style="
        width:30px;
        height:30px;
        border-radius:999px;
        border:1px solid rgba(148, 163, 184, 0.24);
        background:#ffffff;
        color:#0f172a;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:16px;
        box-shadow:0 10px 24px rgba(15, 23, 42, 0.12);
        line-height:1;
        cursor:pointer;
        padding:0;
      "
    >-</button>
    <button
      type="button"
      data-marker-action="move"
      data-disabled="false"
      style="
        width:30px;
        height:30px;
        border-radius:999px;
        border:1px solid rgba(148, 163, 184, 0.24);
        background:${options.isMoveActive ? "#0f172a" : "#ffffff"};
        color:${options.isMoveActive ? "#ffffff" : "#0f172a"};
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:16px;
        box-shadow:0 10px 24px rgba(15, 23, 42, 0.12);
        line-height:1;
        cursor:pointer;
        padding:0;
      "
    >↔</button>
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
    pointer-events:none;
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

    if (!res.ok) {
      throw new Error("download failed");
    }

    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();

    window.URL.revokeObjectURL(url);

    onSuccess?.();
  } catch (_error) {
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

const fetchElevations = async (
  locations: Array<{ lat: number; lon: number }>,
) => {
  if (!locations.length) {
    return [];
  }

  const locationQuery = locations
    .map(({ lat, lon }) => `${lat},${lon}`)
    .join("|");
  const requestUrl = `${OPENTOPO_BASE_URL}?locations=${encodeURIComponent(
    locationQuery,
  )}`;
  let response: Response | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(requestUrl);

    if (response.status !== 429) {
      break;
    }

    if (attempt < 2) {
      await wait(ELEVATION_REQUEST_DELAY_MS * (attempt + 1));
    }
  }

  if (!response || !response.ok) {
    throw new Error(
      response?.status === 429
        ? ELEVATION_RATE_LIMIT_MESSAGE
        : "고도 정보를 불러오지 못했어요.",
    );
  }

  const data = await response.json();

  if (data?.status !== "OK" || !Array.isArray(data?.results)) {
    throw new Error("고도 정보를 불러오지 못했어요.");
  }

  return data.results.map((result: any) =>
    typeof result?.elevation === "number" ? result.elevation : null,
  ) as Array<number | null>;
};

const fillMissingElevations = async (points: RoutePoint[]) => {
  const missingIndices = points.reduce<number[]>(
    (accumulator, point, index) => {
      if (point.ele === null) {
        accumulator.push(index);
      }

      return accumulator;
    },
    [],
  );

  if (!missingIndices.length) {
    return points;
  }

  const nextPoints = [...points];

  for (
    let startIndex = 0;
    startIndex < missingIndices.length;
    startIndex += ELEVATION_BATCH_SIZE
  ) {
    if (startIndex > 0) {
      await wait(ELEVATION_REQUEST_DELAY_MS);
    }

    const chunkIndices = missingIndices.slice(
      startIndex,
      startIndex + ELEVATION_BATCH_SIZE,
    );
    const elevations = await fetchElevations(
      chunkIndices.map((index) => ({
        lat: points[index].lat,
        lon: points[index].lon,
      })),
    );

    chunkIndices.forEach((pointIndex, chunkIndex) => {
      nextPoints[pointIndex] = {
        ...nextPoints[pointIndex],
        ele: elevations[chunkIndex] ?? null,
      };
    });
  }

  return nextPoints;
};

const geocodeAddress = (query: string) =>
  new Promise<GeocodedLocation>((resolve, reject) => {
    if (!window.naver?.maps?.Service) {
      reject(new Error("주소 검색 기능을 불러오지 못했어요."));
      return;
    }

    window.naver.maps.Service.geocode(
      {
        query,
      },
      (status: string, response: any) => {
        if (status !== window.naver.maps.Service.Status.OK) {
          reject(new Error("주소를 찾지 못했어요."));
          return;
        }

        const item = response?.v2?.addresses?.[0];

        if (!item?.x || !item?.y) {
          reject(new Error("주소를 찾지 못했어요."));
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

const searchLocalCandidates = async (query: string) => {
  const requestUrl = new URL(`${ELEVATION_PROXY_URL}search-local`);
  requestUrl.searchParams.set("query", query);
  requestUrl.searchParams.set("display", "5");
  requestUrl.searchParams.set("start", "1");
  requestUrl.searchParams.set("sort", "random");

  const response = await fetch(requestUrl.toString());

  if (!response.ok) {
    throw new Error("장소 검색 결과를 불러오지 못했어요.");
  }

  const data = await response.json();
  const items = Array.isArray(data?.items) ? data.items : [];

  return items
    .map((item: any) => {
      if (!item?.mapx || !item?.mapy) {
        return null;
      }

      const lon = Number(item.mapx) / 10000000;
      const lat = Number(item.mapy) / 10000000;

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return null;
      }

      return {
        lat,
        lon,
        title: stripHtmlTags(item.title || ""),
        address: item.roadAddress || item.address || "",
      } as GeocodedLocation;
    })
    .filter(
      (item: GeocodedLocation | null): item is GeocodedLocation =>
        item !== null,
    );
};

const fetchDirectionsRoute = async (
  start: GeocodedLocation,
  goal: GeocodedLocation,
) => {
  const requestUrl = new URL(`${ELEVATION_PROXY_URL}directions-15`);
  requestUrl.searchParams.set("start", `${start.lon},${start.lat}`);
  requestUrl.searchParams.set("goal", `${goal.lon},${goal.lat}`);
  requestUrl.searchParams.set("option", "traoptimal");

  const response = await fetch(requestUrl.toString());

  if (!response.ok) {
    throw new Error("경로를 불러오지 못했어요.");
  }

  const data = await response.json();
  const route = data?.route?.traoptimal?.[0];
  const path = route?.path;

  if (!Array.isArray(path) || path.length < 2) {
    throw new Error("검색된 경로가 없어요.");
  }

  return path
    .map((item: [number, number]) => {
      const [lon, lat] = item;

      if (typeof lat !== "number" || typeof lon !== "number") {
        return null;
      }

      return {
        lat,
        lon,
        ele: null,
      } as RoutePoint;
    })
    .filter((point: RoutePoint | null): point is RoutePoint => point !== null);
};

const GpxMakerPage = () => {
  const location = useLocation();
  const [view, setView] = useState<MakerView>("menu");
  const [routeName, setRouteName] = useState("");
  const [manualPoints, setManualPoints] = useState<RoutePoint[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isFetchingElevation, setIsFetchingElevation] = useState(false);
  const [isSearchingRoute, setIsSearchingRoute] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mapGuideMessage, setMapGuideMessage] = useState("");
  const [currentLocation, setCurrentLocation] =
    useState<CurrentLocation | null>(null);
  const [isReturnRouteEnabled, setIsReturnRouteEnabled] = useState(false);
  const [returnTrimCount, setReturnTrimCount] = useState(0);
  const [isRouteSearchOpen, setIsRouteSearchOpen] = useState(false);
  const [startQuery, setStartQuery] = useState("");
  const [goalQuery, setGoalQuery] = useState("");
  const [startSuggestions, setStartSuggestions] = useState<GeocodedLocation[]>(
    [],
  );
  const [goalSuggestions, setGoalSuggestions] = useState<GeocodedLocation[]>(
    [],
  );
  const [isSearchingStartSuggestions, setIsSearchingStartSuggestions] =
    useState(false);
  const [isSearchingGoalSuggestions, setIsSearchingGoalSuggestions] =
    useState(false);
  const [selectedStartLocation, setSelectedStartLocation] =
    useState<GeocodedLocation | null>(null);
  const [selectedGoalLocation, setSelectedGoalLocation] =
    useState<GeocodedLocation | null>(null);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(
    null,
  );
  const [moveTargetIndex, setMoveTargetIndex] = useState<number | null>(null);

  const gpxFileInputRef = useRef<HTMLInputElement | null>(null);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const routeNameInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<any>(null);
  const actionOverlayMarkerRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<any>(null);
  const clickListenerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markerRefs = useRef<any[]>([]);
  const markerListenerRefs = useRef<any[]>([]);
  const isDraggingMarkerRef = useRef(false);
  const lastDragEndedAtRef = useRef(0);
  const hasAdjustedViewportRef = useRef(false);
  const lastMarkerInteractedAtRef = useRef(0);

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
  const selectedSourceIndex =
    selectedMarkerIndex === null
      ? null
      : (displayPointSourceIndices[selectedMarkerIndex] ?? null);
  const canInsertNextPoint =
    selectedSourceIndex !== null &&
    selectedSourceIndex < manualPoints.length - 1;
  const visibleMapGuideMessage =
    mapGuideMessage ||
    (!manualPoints.length ? "지도 터치로 시작 지점을 설정해보세요." : "");

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
    if (manualPoints.length >= MAX_MARKER_COUNT) {
      setErrorMessage(
        `마커는 최대 ${MAX_MARKER_COUNT}개까지만 추가할 수 있어요.`,
      );
      return;
    }

    setIsFetchingElevation(true);
    setErrorMessage("");

    try {
      const elevation = await fetchElevation(lat, lon);
      setManualPoints((currentPoints) => {
        if (currentPoints.length >= MAX_MARKER_COUNT) {
          return currentPoints;
        }

        return [...currentPoints, { lat, lon, ele: elevation }];
      });
    } catch (error) {
      setManualPoints((currentPoints) => {
        if (currentPoints.length >= MAX_MARKER_COUNT) {
          return currentPoints;
        }

        return [...currentPoints, { lat, lon, ele: null }];
      });
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
    if (selectedMarkerIndex === null) {
      return;
    }

    if (selectedMarkerIndex >= points.length) {
      setSelectedMarkerIndex(null);
      setMoveTargetIndex(null);
    }
  }, [points.length, selectedMarkerIndex]);

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
    if (!isRouteSearchOpen) {
      return;
    }

    const trimmedQuery = startQuery.trim();

    if (trimmedQuery.length < 2) {
      setIsSearchingStartSuggestions(false);
      setStartSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSearchingStartSuggestions(true);
      void searchLocalCandidates(trimmedQuery)
        .then((items) => setStartSuggestions(items.slice(0, 5)))
        .catch(() => setStartSuggestions([]))
        .finally(() => setIsSearchingStartSuggestions(false));
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isRouteSearchOpen, startQuery]);

  useEffect(() => {
    if (!isRouteSearchOpen) {
      return;
    }

    const trimmedQuery = goalQuery.trim();

    if (trimmedQuery.length < 2) {
      setIsSearchingGoalSuggestions(false);
      setGoalSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSearchingGoalSuggestions(true);
      void searchLocalCandidates(trimmedQuery)
        .then((items) => setGoalSuggestions(items.slice(0, 5)))
        .catch(() => setGoalSuggestions([]))
        .finally(() => setIsSearchingGoalSuggestions(false));
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [goalQuery, isRouteSearchOpen]);

  useEffect(() => {
    if (view !== "create" || !mapElementRef.current) {
      return;
    }

    const mapElement = mapElementRef.current;

    const preventTouchScroll = (event: TouchEvent) => {
      event.preventDefault();
    };

    mapElement.addEventListener("touchstart", preventTouchScroll, {
      passive: false,
    });
    mapElement.addEventListener("touchmove", preventTouchScroll, {
      passive: false,
    });

    return () => {
      mapElement.removeEventListener("touchstart", preventTouchScroll);
      mapElement.removeEventListener("touchmove", preventTouchScroll);
    };
  }, [view]);

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

        if (Date.now() - lastMarkerInteractedAtRef.current < 250) {
          return;
        }

        if (Date.now() - lastDragEndedAtRef.current < 350) {
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

        if (moveTargetIndex !== null) {
          void updatePointWithElevation(moveTargetIndex, lat, lon);
          setMoveTargetIndex(null);
          setSelectedMarkerIndex(null);
          setMapGuideMessage("");
          return;
        }

        setSelectedMarkerIndex(null);
        void addPointWithElevation(lat, lon);
      },
    );

    return () => {
      if (clickListenerRef.current) {
        window.naver.maps.Event.removeListener(clickListenerRef.current);
        clickListenerRef.current = null;
      }
    };
  }, [isMapReady, moveTargetIndex, view]);

  useEffect(() => {
    if (
      view !== "create" ||
      !isMapReady ||
      !mapRef.current ||
      !window.naver?.maps
    ) {
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
      hasAdjustedViewportRef.current = false;
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
      const isSelected = selectedMarkerIndex === index;
      const label = isStart ? "S" : isEnd ? "E" : `${index + 1}`;
      const backgroundColor = isStart
        ? "#22c55e"
        : isEnd
          ? "#f97316"
          : "#0f172a";
      const size = isStart || isEnd ? 24 : 20;
      const fontSize = isStart || isEnd ? 10 : 9;

      let marker: any;

      const updateMarkerAppearance = (options?: { isDragging?: boolean }) => {
        marker.setIcon({
          content: createMarkerHtml(label, backgroundColor, size, fontSize, {
            ...options,
            isSelected,
          }),
          anchor: new window.naver.maps.Point(size / 2, size / 2),
        });
      };

      marker = new window.naver.maps.Marker({
        map,
        position: new window.naver.maps.LatLng(point.lat, point.lon),
        draggable: false,
        icon: {
          content: createMarkerHtml(label, backgroundColor, size, fontSize, {
            isSelected,
          }),
          anchor: new window.naver.maps.Point(size / 2, size / 2),
        },
      });

      markerListenerRefs.current.push(
        window.naver.maps.Event.addListener(marker, "click", () => {
          lastMarkerInteractedAtRef.current = Date.now();
          setMoveTargetIndex(null);
          setMapGuideMessage("");
          setSelectedMarkerIndex(index);
        }),
      );

      markerListenerRefs.current.push(
        window.naver.maps.Event.addListener(marker, "mousedown", () => {
          lastMarkerInteractedAtRef.current = Date.now();
          setMoveTargetIndex(null);
          setMapGuideMessage("");
          setSelectedMarkerIndex(index);
        }),
      );

      markerListenerRefs.current.push(
        window.naver.maps.Event.addListener(marker, "touchstart", () => {
          lastMarkerInteractedAtRef.current = Date.now();
          setMoveTargetIndex(null);
          setMapGuideMessage("");
          setSelectedMarkerIndex(index);
        }),
      );

      return marker;
    });

    if (hasAdjustedViewportRef.current) {
      return;
    }

    if (points.length === 1) {
      map.setCenter(path[0]);
      map.setZoom(15);
      hasAdjustedViewportRef.current = true;
      return;
    }

    const bounds = new window.naver.maps.LatLngBounds();

    path.forEach((latLng) => bounds.extend(latLng));
    map.fitBounds(bounds, {
      top: 40,
      right: 40,
      bottom: 40,
      left: 40,
    });
    hasAdjustedViewportRef.current = true;
  }, [
    displayPointSourceIndices,
    isMapReady,
    points,
    selectedMarkerIndex,
    view,
  ]);

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

  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) {
      return;
    }

    if (selectedMarkerIndex === null || !points[selectedMarkerIndex]) {
      actionOverlayMarkerRef.current?.setMap(null);
      return;
    }

    const point = points[selectedMarkerIndex];
    const position = new window.naver.maps.LatLng(point.lat, point.lon);
    const icon = {
      content: createMarkerActionOverlayHtml({
        canInsert: canInsertNextPoint,
        isMoveActive: moveTargetIndex === selectedMarkerIndex,
      }),
      anchor: new window.naver.maps.Point(53, 46),
    };

    if (!actionOverlayMarkerRef.current) {
      actionOverlayMarkerRef.current = new window.naver.maps.Marker({
        map: mapRef.current,
        position,
        zIndex: 1000,
        clickable: true,
        icon,
      });
      return;
    }

    actionOverlayMarkerRef.current.setMap(mapRef.current);
    actionOverlayMarkerRef.current.setPosition(position);
    actionOverlayMarkerRef.current.setIcon(icon);
  }, [canInsertNextPoint, moveTargetIndex, points, selectedMarkerIndex]);

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
    hasAdjustedViewportRef.current = false;
    setMapGuideMessage("");
    setSelectedMarkerIndex(null);
    setMoveTargetIndex(null);
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
          // alert("GPX 파일이 다운로드되었어요!");
        },
        () => {
          console.log("다운로드 실패");
        },
      );
    } catch (_error) {
      setErrorMessage("GPX 파일 다운로드에 실패했어요.");
    }
  };

  const handleSearchRoute = async () => {
    const trimmedStartQuery = startQuery.trim();
    const trimmedGoalQuery = goalQuery.trim();

    if (!trimmedStartQuery || !trimmedGoalQuery) {
      setErrorMessage("출발지와 도착지를 모두 입력해주세요.");
      return;
    }

    setIsSearchingRoute(true);
    setErrorMessage("");

    try {
      const isSelectedStartMatch =
        !!selectedStartLocation &&
        (selectedStartLocation.address === trimmedStartQuery ||
          selectedStartLocation.title === trimmedStartQuery);
      const isSelectedGoalMatch =
        !!selectedGoalLocation &&
        (selectedGoalLocation.address === trimmedGoalQuery ||
          selectedGoalLocation.title === trimmedGoalQuery);

      const [startLocation, goalLocation] = await Promise.all([
        isSelectedStartMatch
          ? Promise.resolve(selectedStartLocation as GeocodedLocation)
          : searchLocalCandidates(trimmedStartQuery)
              .then((items) => items[0] ?? null)
              .then((item) => item ?? geocodeAddress(trimmedStartQuery)),
        isSelectedGoalMatch
          ? Promise.resolve(selectedGoalLocation as GeocodedLocation)
          : searchLocalCandidates(trimmedGoalQuery)
              .then((items) => items[0] ?? null)
              .then((item) => item ?? geocodeAddress(trimmedGoalQuery)),
      ]);
      const routePoints = limitRoutePoints(
        await fetchDirectionsRoute(startLocation, goalLocation),
      );

      if (routePoints.length < 2) {
        throw new Error("검색된 경로가 없어요.");
      }

      hasAdjustedViewportRef.current = false;
      setIsReturnRouteEnabled(false);
      setReturnTrimCount(0);
      setSelectedMarkerIndex(null);
      setMoveTargetIndex(null);
      if (routePoints.length >= MAX_MARKER_COUNT) {
        setErrorMessage(
          `경로는 최대 ${MAX_MARKER_COUNT}개 지점까지만 반영했어요.`,
        );
      }
      setRouteName(
        routeName.trim() || `${trimmedStartQuery} - ${trimmedGoalQuery}`,
      );
      setManualPoints(routePoints);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "경로를 검색하지 못했어요.",
      );
    } finally {
      setIsSearchingRoute(false);
    }
  };

  const handleSelectSuggestion = (
    field: SearchField,
    suggestion: GeocodedLocation,
  ) => {
    const displayValue = suggestion.title || suggestion.address;

    if (field === "start") {
      setStartQuery(displayValue);
      setSelectedStartLocation(suggestion);
      setStartSuggestions([]);
      return;
    }

    setGoalQuery(displayValue);
    setSelectedGoalLocation(suggestion);
    setGoalSuggestions([]);
  };

  const handleOpenGpxFilePicker = () => {
    setErrorMessage("");
    gpxFileInputRef.current?.click();
  };

  const handleInsertPointAfterSelected = async () => {
    if (selectedSourceIndex === null || !canInsertNextPoint) {
      return;
    }

    if (manualPoints.length >= MAX_MARKER_COUNT) {
      setErrorMessage(
        `마커는 최대 ${MAX_MARKER_COUNT}개까지만 추가할 수 있어요.`,
      );
      return;
    }

    const currentPoint = manualPoints[selectedSourceIndex];
    const nextPoint = manualPoints[selectedSourceIndex + 1];
    const lat = (currentPoint.lat + nextPoint.lat) / 2;
    const lon = (currentPoint.lon + nextPoint.lon) / 2;

    setIsFetchingElevation(true);
    setErrorMessage("");

    try {
      const elevation = await fetchElevation(lat, lon);
      setManualPoints((currentPoints) => {
        const nextPoints = [...currentPoints];
        nextPoints.splice(selectedSourceIndex + 1, 0, {
          lat,
          lon,
          ele: elevation,
        });
        return nextPoints;
      });
      setSelectedMarkerIndex(null);
    } catch (error) {
      setManualPoints((currentPoints) => {
        const nextPoints = [...currentPoints];
        nextPoints.splice(selectedSourceIndex + 1, 0, { lat, lon, ele: null });
        return nextPoints;
      });
      setSelectedMarkerIndex(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "고도 정보를 불러오는 중 문제가 발생했어요.",
      );
    } finally {
      setIsFetchingElevation(false);
    }
  };

  const handleRemoveSelectedPoint = () => {
    if (selectedSourceIndex === null) {
      return;
    }

    setManualPoints((currentPoints) =>
      currentPoints.filter((_, index) => index !== selectedSourceIndex),
    );
    setSelectedMarkerIndex(null);
    setMoveTargetIndex(null);
  };

  const handleMoveSelectedPoint = () => {
    if (selectedMarkerIndex === null) {
      return;
    }

    setMoveTargetIndex(selectedMarkerIndex);
    setMapGuideMessage("지도에서 새 위치를 탭하면 선택한 지점이 이동해요.");
  };

  const showPreparingToast = () => {
    setToastMessage("준비중이에요.");
  };

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastMessage]);

  const loadImportedRoute = async (
    sourcePoints: RoutePoint[],
    nextRouteName: string,
    limitExceededMessage = "",
  ) => {
    hasAdjustedViewportRef.current = false;
    setIsReturnRouteEnabled(false);
    setReturnTrimCount(0);
    setSelectedMarkerIndex(null);
    setMoveTargetIndex(null);
    setErrorMessage(limitExceededMessage);
    setRouteName(nextRouteName || "불러온 경로");
    setManualPoints(sourcePoints);
    setView("create");

    if (sourcePoints.some((point) => point.ele === null)) {
      setIsFetchingElevation(true);

      try {
        const pointsWithElevation = await fillMissingElevations(sourcePoints);
        setManualPoints(pointsWithElevation);
      } catch (error) {
        setErrorMessage(
          error instanceof Error && error.message === ELEVATION_RATE_LIMIT_MESSAGE
            ? error.message
            : "일부 지점의 고도 값을 불러오지 못해 원본 GPX 값을 유지했어요.",
        );
      } finally {
        setIsFetchingElevation(false);
      }
    }
  };

  useEffect(() => {
    const handleActionClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const actionElement = target?.closest?.(
        "[data-marker-action]",
      ) as HTMLElement | null;

      if (!actionElement) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (actionElement.dataset.disabled === "true") {
        return;
      }

      const action = actionElement.dataset.markerAction;

      if (action === "insert") {
        void handleInsertPointAfterSelected();
        return;
      }

      if (action === "remove") {
        handleRemoveSelectedPoint();
        return;
      }

      if (action === "move") {
        handleMoveSelectedPoint();
      }
    };

    document.addEventListener("click", handleActionClick, true);
    document.addEventListener("touchend", handleActionClick, true);
    document.addEventListener("pointerup", handleActionClick, true);

    return () => {
      document.removeEventListener("click", handleActionClick, true);
      document.removeEventListener("touchend", handleActionClick, true);
      document.removeEventListener("pointerup", handleActionClick, true);
    };
  }, [
    handleInsertPointAfterSelected,
    handleMoveSelectedPoint,
    handleRemoveSelectedPoint,
  ]);

  const handleGpxFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const xmlText = await file.text();
      const parsedGpxPoints = parseGpxText(xmlText);
      const parsedPoints = limitRoutePoints(parsedGpxPoints);
      const nextRouteName = file.name.replace(/\.gpx$/i, "");
      await loadImportedRoute(
        parsedPoints,
        nextRouteName,
        parsedGpxPoints.length > MAX_MARKER_COUNT
          ? `GPX는 최대 ${MAX_MARKER_COUNT}개 지점까지만 불러왔어요.`
          : "",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "GPX 파일을 읽지 못했어요.",
      );
    } finally {
      event.target.value = "";
    }
  };

  useEffect(() => {
    const importState = location.state as MakerImportState | null;

    if (!importState?.points?.length || importState.points.length < 2) {
      return;
    }

    const limitedPoints = limitRoutePoints(importState.points);

    void loadImportedRoute(
      limitedPoints,
      (importState.routeName || "불러온 경로").replace(/\.gpx$/i, ""),
      importState.points.length > MAX_MARKER_COUNT
        ? `GPX는 최대 ${MAX_MARKER_COUNT}개 지점까지만 불러왔어요.`
        : "",
    );
  }, [location.key, location.state]);

  return (
    <div
      onTouchStartCapture={(event) => dismissMobileKeyboard(event.target)}
      onMouseDownCapture={(event) => dismissMobileKeyboard(event.target)}
      style={{
        width: "100%",
        padding: "24px 16px 48px",
        fontFamily: "Pretendard",
        color: "#021227",
        boxSizing: "border-box",
      }}
    >
      <input
        ref={gpxFileInputRef}
        type="file"
        accept=".gpx,application/gpx+xml,application/xml,text/xml"
        onChange={handleGpxFileChange}
        style={{ display: "none" }}
      />

      <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
        <div
          style={{
            fontFamily: "Comico",
            fontSize: "clamp(20px, 2vw, 28px)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: "#111827",
            textTransform: "lowercase",
            marginTop: "4px",
            marginBottom: "24px",
          }}
        >
          happy route corner
        </div>

        {view === "menu" ? (
          <>
            <div
              className="fs14"
              style={{
                color: "#6b7280",
                lineHeight: 1.7,
                marginBottom: "20px",
                marginTop: "24px",
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
                maxWidth: "360px",
                margin: "0 auto",
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("");
                  setView("create");
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "58px",
                  width: "100%",
                  padding: "0 24px",
                  borderRadius: "36px 24px 40px 22px / 26px 38px 24px 42px",
                  border: "3px solid #111827",
                  backgroundColor: "rgba(255, 255, 255, 0.94)",
                  color: "#111827",
                  fontSize: "18px",
                  fontWeight: 700,
                  fontFamily: "Pretendard",
                  textAlign: "center",
                  cursor: "pointer",
                  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
                  backdropFilter: "blur(8px)",
                }}
              >
                새로 만들기
              </button>

              <button
                type="button"
                onClick={handleOpenGpxFilePicker}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "58px",
                  width: "100%",
                  padding: "0 24px",
                  borderRadius: "22px 40px 24px 46px / 42px 24px 38px 20px",
                  border: "3px solid #111827",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  fontSize: "18px",
                  fontWeight: 700,
                  fontFamily: "Pretendard",
                  textAlign: "center",
                  cursor: "pointer",
                  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
                }}
              >
                기존 경로 수정하기
              </button>
            </div>

            <div
              style={{
                color: "#959595",
                lineHeight: 1.5,
                marginTop: "24px",
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
              <button
                type="button"
                onClick={showPreparingToast}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  height: "42px",
                  padding: "0 16px",
                  borderRadius: "999px",
                  border: "1px solid rgba(148, 163, 184, 0.22)",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  fontSize: "14px",
                  fontFamily: "Pretendard",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  경로 검색하기
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ChevronDown size={18} strokeWidth={2.2} />
                </span>
              </button>
            </div>

            <div
              style={{
                marginTop: "8px",
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
                    fontFamily: "Pretendard",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  {isReturnRouteEnabled ? "왕복 경로 해제" : "왕복 경로 설정"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!manualPoints.length}
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
                    fontFamily: "Pretendard",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  전체 초기화
                </button>
              </div>

              <button
                type="button"
                onClick={handleUndo}
                disabled={!manualPoints.length}
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
                  fontFamily: "Pretendard",
                  fontSize: "10px",
                  fontWeight: 600,
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
              ref={mapViewportRef}
              style={{
                position: "relative",
                width: "min(calc(100% + 160px), 100vw - 32px)",
                marginLeft: "max(-80px, calc((100% - (100vw - 32px)) / 2))",
                minHeight: "clamp(360px, 58vh, 560px)",
                borderRadius: "28px",
                overflow: "hidden",
                background:
                  "radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent 52%), #e2e8f0",
                border: "1px solid rgba(148, 163, 184, 0.16)",
              }}
            >
              {visibleMapGuideMessage ? (
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 20,
                    padding: "8px 14px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(17, 24, 39, 0.386)",
                    color: "#ffffff",
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.18)",
                  }}
                >
                  {visibleMapGuideMessage}
                </div>
              ) : null}

              <div
                ref={mapElementRef}
                style={{
                  width: "100%",
                  minHeight: "clamp(360px, 58vh, 560px)",
                  touchAction: "none",
                  overscrollBehavior: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                }}
              />
            </div>

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
                  style={{
                    width: "100%",
                    height: "42px",
                    borderRadius: "999px",
                    border: "1px solid rgba(148, 163, 184, 0.22)",
                    padding: "0 16px",
                    fontSize: "12px",
                    fontFamily: "Pretendard",
                    fontWeight: 400,
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!canDownload}
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
                  fontFamily: "Pretendard",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                GPX 다운로드
              </button>
            </div>
          </>
        )}
      </div>

      {toastMessage ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            top: "24px",
            transform: "translateX(-50%)",
            zIndex: 60,
            padding: "10px 16px",
            borderRadius: "999px",
            backgroundColor: "rgba(17, 24, 39, 0.568)",
            color: "#ffffff",
            fontFamily: "Pretendard",
            fontSize: "13px",
            fontWeight: 500,
            boxShadow: "0 12px 28px rgba(15, 23, 42, 0.18)",
            whiteSpace: "nowrap",
          }}
        >
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
};

export default GpxMakerPage;
