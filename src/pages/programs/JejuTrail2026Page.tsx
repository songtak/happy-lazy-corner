import React, {
  MouseEvent,
  TouchEvent as ReactTouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactECharts from "echarts-for-react";
import jejuTrailGpxText from "@/assets/gpx/제주트레일_가시리_36K.gpx?raw";

type GpxPoint = {
  lat: number;
  lon: number;
  ele: number | null;
  distance: number;
};

type GpxTrack = {
  fileName: string;
  points: GpxPoint[];
  totalDistanceKm: number;
  elevationGain: number;
  elevationLoss: number;
  minElevation: number | null;
  maxElevation: number | null;
};

type ColoredSegment = {
  points: [GpxPoint, GpxPoint];
  color: string;
};

type PaceOption = {
  label: string;
  secondsPerKm: number;
};

const NAVER_MAP_CLIENT_ID = "uqms5x0d6b";
const NAVER_MAP_SCRIPT_ID = "naver-map-sdk";

declare global {
  interface Window {
    naver?: any;
  }
}

const formatDistance = (distanceKm: number) => `${distanceKm.toFixed(2)} km`;

const formatElevation = (elevation: number | null) =>
  elevation === null ? "-" : `${Math.round(elevation)} m`;

const formatPace = (secondsPerKm: number) => {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
};

const formatDuration = (totalSeconds: number) => {
  const roundedSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.round((roundedSeconds % 3600) / 60);

  if (minutes === 60) {
    return `${hours + 1}시간 00분`;
  }

  if (hours > 0) {
    return `${hours}시간 ${minutes.toString().padStart(2, "0")}분`;
  }

  return `${minutes}분`;
};

const PACE_OPTIONS: PaceOption[] = Array.from(
  { length: 41 },
  (_, index) => 300 + index * 15,
).map((secondsPerKm) => ({
  secondsPerKm,
  label: formatPace(secondsPerKm),
}));

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

const findNearestPointIndex = (
  points: GpxPoint[],
  targetLat: number,
  targetLon: number,
) => {
  if (!points.length) {
    return -1;
  }

  return points.reduce((closestIndex, point, index) => {
    const currentDistance = calculateDistanceInMeters(
      point.lat,
      point.lon,
      targetLat,
      targetLon,
    );

    if (closestIndex === -1) {
      return index;
    }

    const closestPoint = points[closestIndex];
    const closestDistance = calculateDistanceInMeters(
      closestPoint.lat,
      closestPoint.lon,
      targetLat,
      targetLon,
    );

    return currentDistance < closestDistance ? index : closestIndex;
  }, -1);
};

const findNearestPointIndexByDistance = (
  points: GpxPoint[],
  targetDistance: number,
) => {
  if (!points.length) {
    return -1;
  }

  return points.reduce((closestIndex, point, index) => {
    if (closestIndex === -1) {
      return index;
    }

    const currentGap = Math.abs(point.distance - targetDistance);
    const closestGap = Math.abs(points[closestIndex].distance - targetDistance);
    return currentGap < closestGap ? index : closestIndex;
  }, -1);
};

const parseNumber = (rawValue: string | null) => {
  if (rawValue === null) {
    return null;
  }

  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const parseGpxText = (xmlText: string, fileName: string): GpxTrack => {
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

  let totalDistance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;
  let previousPoint: GpxPoint | null = null;

  const points = pointElements.reduce<GpxPoint[]>(
    (accumulator, pointElement) => {
      const lat = parseNumber(pointElement.getAttribute("lat"));
      const lon = parseNumber(pointElement.getAttribute("lon"));
      const ele = parseNumber(
        pointElement.querySelector("ele")?.textContent ?? null,
      );

      if (lat === null || lon === null) {
        return accumulator;
      }

      if (previousPoint) {
        totalDistance += calculateDistanceInMeters(
          previousPoint.lat,
          previousPoint.lon,
          lat,
          lon,
        );

        if (previousPoint.ele !== null && ele !== null) {
          const elevationDelta = ele - previousPoint.ele;
          if (elevationDelta > 0) {
            elevationGain += elevationDelta;
          } else {
            elevationLoss += Math.abs(elevationDelta);
          }
        }
      }

      const currentPoint: GpxPoint = {
        lat,
        lon,
        ele,
        distance: totalDistance / 1000,
      };

      previousPoint = currentPoint;
      accumulator.push(currentPoint);
      return accumulator;
    },
    [],
  );

  if (points.length < 2) {
    throw new Error("유효한 위도/경도 좌표를 2개 이상 찾지 못했어요.");
  }

  const elevations = points
    .map((point) => point.ele)
    .filter((value): value is number => value !== null);

  return {
    fileName,
    points,
    totalDistanceKm: totalDistance / 1000,
    elevationGain,
    elevationLoss,
    minElevation: elevations.length ? Math.min(...elevations) : null,
    maxElevation: elevations.length ? Math.max(...elevations) : null,
  };
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

const interpolateHexColor = (
  startHexColor: string,
  endHexColor: string,
  ratio: number,
) => {
  const normalizedRatio = Math.max(0, Math.min(1, ratio));
  const startColor = startHexColor.replace("#", "");
  const endColor = endHexColor.replace("#", "");

  const startRed = Number.parseInt(startColor.slice(0, 2), 16);
  const startGreen = Number.parseInt(startColor.slice(2, 4), 16);
  const startBlue = Number.parseInt(startColor.slice(4, 6), 16);

  const endRed = Number.parseInt(endColor.slice(0, 2), 16);
  const endGreen = Number.parseInt(endColor.slice(2, 4), 16);
  const endBlue = Number.parseInt(endColor.slice(4, 6), 16);

  const toHex = (value: number) =>
    Math.round(value).toString(16).padStart(2, "0");

  const red = startRed + (endRed - startRed) * normalizedRatio;
  const green = startGreen + (endGreen - startGreen) * normalizedRatio;
  const blue = startBlue + (endBlue - startBlue) * normalizedRatio;

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
};

const buildColoredSegments = (points: GpxPoint[]): ColoredSegment[] => {
  if (points.length < 2) {
    return [];
  }

  const elevations = points
    .map((point) => point.ele)
    .filter((value): value is number => value !== null);

  if (!elevations.length) {
    return points.slice(1).map((point, index) => ({
      points: [points[index], point],
      color: "#14b8a6",
    }));
  }

  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationRange = maxElevation - minElevation || 1;

  return points.slice(1).map((point, index) => {
    const previousPoint = points[index];
    const currentElevation = point.ele ?? previousPoint.ele ?? minElevation;
    const previousElevation =
      previousPoint.ele ?? point.ele ?? currentElevation;
    const averageElevation = (currentElevation + previousElevation) / 2;
    const colorRatio = (averageElevation - minElevation) / elevationRange;

    return {
      points: [previousPoint, point],
      color: interpolateHexColor("#38bdf8", "#f97316", colorRatio),
    };
  });
};

const createMarkerHtml = (label: string, backgroundColor: string) => {
  return `
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      width:20px;
      height:20px;
      border-radius:999px;
      background:${backgroundColor};
      color:#fff;
      font-size:9px;
      font-weight:700;
      box-shadow:0 4px 10px rgba(15, 23, 42, 0.18);
      border:1.5px solid rgba(255,255,255,0.88);
    ">
      ${label}
    </div>
  `;
};

const createFocusMarkerHtml = () => {
  return `
    <div style="
      width:20px;
      height:20px;
      border-radius:999px;
      background:#facc15;
      border:4px solid rgba(255,255,255,0.98);
      box-shadow:0 0 0 10px rgba(250,204,21,0.22), 0 8px 18px rgba(15,23,42,0.24);
    "></div>
  `;
};

const JEJU_TRAIL_FILE_NAME = "제주트레일 가시리 36K";

const JejuTrail2026Page = () => {
  const [track, setTrack] = useState<GpxTrack | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedPaceIndex, setSelectedPaceIndex] = useState(16);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null,
  );
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReactECharts | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const polylineRefs = useRef<any[]>([]);
  const polylineClickListenerRefs = useRef<any[]>([]);
  const markerRefs = useRef<any[]>([]);
  const focusMarkerRef = useRef<any>(null);
  const selectedPointIndexRef = useRef<number | null>(null);
  const lastTouchInteractionAtRef = useRef(0);
  const isChartTouchActiveRef = useRef(false);

  const elevationProfilePoints = useMemo(
    () => track?.points.filter((point) => point.ele !== null) ?? [],
    [track],
  );
  const selectedPace = PACE_OPTIONS[selectedPaceIndex];
  const estimatedFinishTime = useMemo(() => {
    if (!track) {
      return null;
    }

    return formatDuration(track.totalDistanceKm * selectedPace.secondsPerKm);
  }, [selectedPace.secondsPerKm, track]);
  const updateSelectedPaceByStep = (step: number) => {
    setSelectedPaceIndex((currentIndex) =>
      Math.max(0, Math.min(PACE_OPTIONS.length - 1, currentIndex + step)),
    );
  };

  useEffect(() => {
    selectedPointIndexRef.current = selectedPointIndex;
  }, [selectedPointIndex]);

  useEffect(() => {
    try {
      const parsedTrack = parseGpxText(jejuTrailGpxText, JEJU_TRAIL_FILE_NAME);
      setTrack(parsedTrack);
      setSelectedPointIndex(null);
      setErrorMessage("");
    } catch (error) {
      setTrack(null);
      setSelectedPointIndex(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "제주 트레일 GPX 파일을 불러오는 중 문제가 발생했어요.",
      );
    }
  }, []);

  const hideFocusMarker = () => {
    if (focusMarkerRef.current) {
      focusMarkerRef.current.setMap(null);
      focusMarkerRef.current = null;
    }
  };

  const showFocusMarker = (point: GpxPoint) => {
    if (!mapRef.current || !window.naver?.maps) {
      return;
    }

    const position = new window.naver.maps.LatLng(point.lat, point.lon);

    if (!focusMarkerRef.current) {
      focusMarkerRef.current = new window.naver.maps.Marker({
        map: mapRef.current,
        position,
        zIndex: 1000,
        icon: {
          content: createFocusMarkerHtml(),
          anchor: new window.naver.maps.Point(13, 13),
        },
      });
      return;
    }

    focusMarkerRef.current.setMap(mapRef.current);
    focusMarkerRef.current.setPosition(position);
  };

  const panMapToPoint = (point: GpxPoint) => {
    if (!mapRef.current || !window.naver?.maps) {
      return;
    }

    mapRef.current.setCenter(
      new window.naver.maps.LatLng(point.lat, point.lon),
    );
  };

  const showChartTooltipAtPoint = (pointIndex: number) => {
    const chartInstance = chartRef.current?.getEchartsInstance();

    if (
      !chartInstance ||
      pointIndex < 0 ||
      !elevationProfilePoints[pointIndex]
    ) {
      return;
    }

    chartInstance.dispatchAction({
      type: "downplay",
      seriesIndex: 0,
    });
    chartInstance.dispatchAction({
      type: "highlight",
      seriesIndex: 0,
      dataIndex: pointIndex,
    });
    chartInstance.dispatchAction({
      type: "showTip",
      seriesIndex: 0,
      dataIndex: pointIndex,
    });
  };

  const hideChartTooltip = () => {
    const chartInstance = chartRef.current?.getEchartsInstance();

    if (!chartInstance) {
      return;
    }

    chartInstance.dispatchAction({
      type: "hideTip",
    });
    chartInstance.dispatchAction({
      type: "downplay",
      seriesIndex: 0,
    });
  };

  const syncSelectedElevationPoint = (pointIndex: number) => {
    if (pointIndex < 0 || !elevationProfilePoints[pointIndex]) {
      return;
    }

    const selectedPoint = elevationProfilePoints[pointIndex];
    selectedPointIndexRef.current = pointIndex;
    setSelectedPointIndex(pointIndex);
    showFocusMarker(selectedPoint);
    panMapToPoint(selectedPoint);
    showChartTooltipAtPoint(pointIndex);
  };

  const selectElevationPointFromChartCoordinates = (
    offsetX: number,
    _offsetY: number,
    options?: { persistSelection?: boolean },
  ) => {
    const chartContainer = chartContainerRef.current;
    const totalDistanceKm = track?.totalDistanceKm ?? 0;

    if (!chartContainer || totalDistanceKm <= 0) {
      return;
    }

    const gridLeft = 40;
    const gridRight = 18;
    const chartWidth = chartContainer.clientWidth;
    const plotWidth = chartWidth - gridLeft - gridRight;

    if (plotWidth <= 0) {
      return;
    }

    const clampedOffsetX = Math.max(
      gridLeft,
      Math.min(chartWidth - gridRight, offsetX),
    );
    const distanceValue =
      ((clampedOffsetX - gridLeft) / plotWidth) * totalDistanceKm;

    const nearestPointIndex = findNearestPointIndexByDistance(
      elevationProfilePoints,
      distanceValue,
    );

    if (options?.persistSelection === false) {
      if (nearestPointIndex < 0 || !elevationProfilePoints[nearestPointIndex]) {
        return;
      }

      const previewPoint = elevationProfilePoints[nearestPointIndex];
      showFocusMarker(previewPoint);
      showChartTooltipAtPoint(nearestPointIndex);
      return;
    }

    syncSelectedElevationPoint(nearestPointIndex);
  };

  const handleChartContainerClick = (event: MouseEvent<HTMLDivElement>) => {
    if (Date.now() - lastTouchInteractionAtRef.current < 700) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    selectElevationPointFromChartCoordinates(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
    );
  };

  const handleChartContainerMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (Date.now() - lastTouchInteractionAtRef.current < 700) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    selectElevationPointFromChartCoordinates(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
      { persistSelection: false },
    );
  };

  const handleChartContainerMouseLeave = () => {
    if (
      selectedPointIndexRef.current !== null &&
      elevationProfilePoints[selectedPointIndexRef.current]
    ) {
      const selectedPoint =
        elevationProfilePoints[selectedPointIndexRef.current];
      showFocusMarker(selectedPoint);
      showChartTooltipAtPoint(selectedPointIndexRef.current);
      return;
    }

    hideChartTooltip();
    hideFocusMarker();
  };

  const handleChartContainerTouchEnd = (
    event: ReactTouchEvent<HTMLDivElement>,
  ) => {
    lastTouchInteractionAtRef.current = Date.now();
    isChartTouchActiveRef.current = false;
    hideChartTooltip();
    hideFocusMarker();
  };

  const handleChartContainerTouchStart = (
    event: ReactTouchEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    lastTouchInteractionAtRef.current = Date.now();
    isChartTouchActiveRef.current = true;
    const touch = event.touches?.[0] ?? event.changedTouches?.[0];

    if (!touch) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    selectElevationPointFromChartCoordinates(
      touch.clientX - bounds.left,
      touch.clientY - bounds.top,
      { persistSelection: false },
    );
  };

  const handleChartContainerTouchMove = (
    event: ReactTouchEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();
    lastTouchInteractionAtRef.current = Date.now();
    isChartTouchActiveRef.current = true;
    handleChartContainerTouchStart(event);
  };

  useEffect(() => {
    let isMounted = true;

    loadNaverMapScript()
      .then(() => {
        if (!isMounted) {
          return;
        }

        setIsMapReady(true);
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "네이버 지도를 준비하는 중 문제가 발생했어요.",
        );
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

    polylineClickListenerRefs.current.forEach((listener) => {
      window.naver.maps.Event.removeListener(listener);
    });
    polylineClickListenerRefs.current = [];
    polylineRefs.current.forEach((polyline) => polyline.setMap(null));
    polylineRefs.current = [];

    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = [];
    if (selectedPointIndex === null) {
      hideFocusMarker();
    }

    if (!track?.points.length) {
      return;
    }

    const path = track.points.map(
      (point) => new window.naver.maps.LatLng(point.lat, point.lon),
    );
    const coloredSegments = buildColoredSegments(track.points);

    polylineRefs.current = coloredSegments.map((segment) => {
      return new window.naver.maps.Polyline({
        map,
        path: segment.points.map(
          (point) => new window.naver.maps.LatLng(point.lat, point.lon),
        ),
        strokeColor: segment.color,
        strokeWeight: 2,
        strokeOpacity: 0.94,
        strokeLineCap: "round",
        strokeLineJoin: "round",
      });
    });

    polylineClickListenerRefs.current = polylineRefs.current.map((polyline) =>
      window.naver.maps.Event.addListener(polyline, "click", (event: any) => {
        const clickedCoordinate = event?.coord ?? event?.overlayEvent?.coord;

        if (!clickedCoordinate || !elevationProfilePoints.length) {
          return;
        }

        const clickedLat =
          typeof clickedCoordinate.lat === "function"
            ? clickedCoordinate.lat()
            : clickedCoordinate.y;
        const clickedLon =
          typeof clickedCoordinate.lng === "function"
            ? clickedCoordinate.lng()
            : clickedCoordinate.x;

        if (typeof clickedLat !== "number" || typeof clickedLon !== "number") {
          return;
        }

        const nearestPointIndex = findNearestPointIndex(
          elevationProfilePoints,
          clickedLat,
          clickedLon,
        );

        if (nearestPointIndex < 0) {
          return;
        }

        syncSelectedElevationPoint(nearestPointIndex);
      }),
    );

    const startPoint = track.points[0];
    const endPoint = track.points[track.points.length - 1];

    markerRefs.current = [
      new window.naver.maps.Marker({
        map,
        position: new window.naver.maps.LatLng(startPoint.lat, startPoint.lon),
        icon: {
          content: createMarkerHtml("S", "#22c55e"),
          anchor: new window.naver.maps.Point(10, 10),
        },
      }),
      new window.naver.maps.Marker({
        map,
        position: new window.naver.maps.LatLng(endPoint.lat, endPoint.lon),
        icon: {
          content: createMarkerHtml("E", "#f97316"),
          anchor: new window.naver.maps.Point(10, 10),
        },
      }),
    ];

    const bounds = path.reduce(
      (accumulator, latLng) => accumulator.extend(latLng),
      new window.naver.maps.LatLngBounds(path[0], path[0]),
    );

    map.fitBounds(bounds, {
      top: 48,
      right: 48,
      bottom: 48,
      left: 48,
    });
  }, [elevationProfilePoints, isMapReady, track]);

  useEffect(() => {
    if (
      selectedPointIndex === null ||
      !elevationProfilePoints[selectedPointIndex]
    ) {
      return;
    }

    const selectedPoint = elevationProfilePoints[selectedPointIndex];
    showFocusMarker(selectedPoint);
    panMapToPoint(selectedPoint);
  }, [elevationProfilePoints, selectedPointIndex]);

  useEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();

    if (!chartInstance) {
      return;
    }

    const resolvePointIndexFromChartEvent = (event: any) => {
      const directDataIndex = event?.dataIndex ?? event?.batch?.[0]?.dataIndex;

      if (
        typeof directDataIndex === "number" &&
        elevationProfilePoints[directDataIndex]
      ) {
        return directDataIndex;
      }

      const offsetX = event?.offsetX ?? event?.zrX;
      const offsetY = event?.offsetY ?? event?.zrY;

      if (typeof offsetX !== "number" || typeof offsetY !== "number") {
        return -1;
      }

      const converted = chartInstance.convertFromPixel({ xAxisIndex: 0 }, [
        offsetX,
        offsetY,
      ]) as [number, number] | number;

      const distanceValue = Array.isArray(converted) ? converted[0] : converted;

      if (typeof distanceValue !== "number") {
        return -1;
      }

      return findNearestPointIndexByDistance(
        elevationProfilePoints,
        distanceValue,
      );
    };

    const handleAxisPointerUpdate = (event: any) => {
      if (
        isChartTouchActiveRef.current ||
        Date.now() - lastTouchInteractionAtRef.current < 700
      ) {
        return;
      }

      const dataIndex =
        event?.dataByCoordSys?.[0]?.dataByAxis?.[0]?.seriesDataIndices?.[0]
          ?.dataIndex;

      if (typeof dataIndex === "number" && elevationProfilePoints[dataIndex]) {
        showFocusMarker(elevationProfilePoints[dataIndex]);
        return;
      }

      const axisValue = event?.axesInfo?.[0]?.value;

      if (typeof axisValue !== "number") {
        return;
      }

      const nearestPoint = elevationProfilePoints.reduce<GpxPoint | null>(
        (closestPoint, currentPoint) => {
          if (!closestPoint) {
            return currentPoint;
          }

          const currentGap = Math.abs(currentPoint.distance - axisValue);
          const closestGap = Math.abs(closestPoint.distance - axisValue);
          return currentGap < closestGap ? currentPoint : closestPoint;
        },
        null,
      );

      if (nearestPoint) {
        showFocusMarker(nearestPoint);
      }
    };

    const handlePointerLeave = () => {
      hideChartTooltip();
      hideFocusMarker();
    };

    chartInstance.on("updateAxisPointer", handleAxisPointerUpdate);
    chartInstance.on("globalout", handlePointerLeave);

    return () => {
      chartInstance.off("updateAxisPointer", handleAxisPointerUpdate);
      chartInstance.off("globalout", handlePointerLeave);
    };
  }, [elevationProfilePoints, selectedPointIndex]);

  const elevationChartOption = useMemo(() => {
    const chartData = elevationProfilePoints.map((point) => ({
      value: [Number(point.distance.toFixed(3)), point.ele as number],
    }));
    const totalDistanceKm = Number((track?.totalDistanceKm ?? 0).toFixed(3));
    const maxElevation = track?.maxElevation ?? 0;
    const yAxisMin = 0;
    const yAxisMax = maxElevation > yAxisMin ? maxElevation : yAxisMin + 1;
    const middleElevation = Number(((yAxisMin + yAxisMax) / 2).toFixed(1));
    const hasElevationRange = yAxisMax > yAxisMin;

    return {
      animationDuration: 500,
      backgroundColor: "transparent",
      grid: {
        left: 40,
        right: 18,
        top: 24,
        bottom: 28,
      },
      tooltip: {
        trigger: "axis",
        triggerOn: "mousemove|click",
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        borderWidth: 0,
        padding: [10, 12],
        textStyle: {
          color: "#f8fafc",
          fontFamily: "GMedium",
        },
        formatter: (params: any) => {
          const point = params?.[0];

          if (!point) {
            return "";
          }

          return `${point.value[0].toFixed(2)} km<br/>${Math.round(point.value[1])} m`;
        },
      },
      axisPointer: {
        lineStyle: {
          color: "rgba(245, 158, 11, 0.82)",
          width: 2,
          type: "solid",
        },
      },
      xAxis: {
        type: "value",
        min: 0,
        max: totalDistanceKm,
        boundaryGap: false,
        splitNumber: 4,
        axisLabel: {
          color: "#94a3b8",
          margin: 10,
          formatter: (value: number) => `${value.toFixed(1)}km`,
        },
        axisLine: {
          lineStyle: {
            color: "rgba(148, 163, 184, 0.3)",
          },
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        min: yAxisMin,
        max: yAxisMax,
        interval: hasElevationRange ? (yAxisMax - yAxisMin) / 2 : 1,
        axisLabel: {
          color: "#94a3b8",
          margin: 12,
          formatter: (value: number) => {
            const roundedValue = Number(value.toFixed(1));

            if (roundedValue === Number(yAxisMin.toFixed(1))) {
              return "";
            }

            if (roundedValue === Number(middleElevation.toFixed(1))) {
              return `${Math.round(middleElevation)}m`;
            }

            if (roundedValue === Number(yAxisMax.toFixed(1))) {
              return `${Math.round(yAxisMax)}m`;
            }

            return "";
          },
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: "rgba(148, 163, 184, 0.12)",
          },
        },
      },
      series: [
        {
          type: "line",
          smooth: 0.6,
          showSymbol: false,
          symbol: "circle",
          symbolSize: 7,
          lineStyle: {
            width: 2.5,
            color: "#fb923c",
            cap: "round",
            join: "round",
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(251, 146, 60, 0.34)" },
                { offset: 1, color: "rgba(251, 146, 60, 0.04)" },
              ],
            },
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              color: "#f59e0b",
              borderColor: "#ffffff",
              borderWidth: 2,
            },
          },
          data: chartData,
        },
      ],
    };
  }, [
    elevationProfilePoints,
    track?.maxElevation,
    track?.minElevation,
    track?.totalDistanceKm,
  ]);

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
          제주 트레일 2026
        </div>
        <div
          style={{
            color: "#6b7280",
            lineHeight: 1.7,
            marginBottom: "20px",
            wordBreak: "keep-all",
          }}
        >
          가시리 36K GPX 코스를 지도, 고도 그래프, 예상 완주 시간을 한 화면에서
          확인할 수 있어요.
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

        {!track ? (
          <div
            style={{
              marginTop: "24px",
              borderRadius: "28px",
              padding: "28px",
              background:
                "linear-gradient(135deg, rgba(236, 253, 245, 1) 0%, rgba(239, 246, 255, 1) 100%)",
              border: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            <div style={{ fontSize: "18px", marginBottom: "8px" }}>
              코스를 불러오는 중이에요
            </div>
            <div style={{ color: "#475569", lineHeight: 1.7 }}>
              제주트레일 가시리 36K GPX 파일을 읽어서 경로와 고도 프로필을
              준비하고 있어요.
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                marginTop: "24px",
                marginBottom: "20px",
                padding: "20px",
                borderRadius: "28px",
                backgroundColor: "#f8fafc",
                border: "1px solid rgba(148, 163, 184, 0.16)",
              }}
            >
              <div style={{ fontSize: "18px", marginBottom: "6px" }}>
                {track.fileName}
              </div>
              <div style={{ color: "#64748b" }}>
                좌표 {track.points.length.toLocaleString()}개를 읽었어요.
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                {[
                  {
                    label: "총 거리",
                    value: formatDistance(track.totalDistanceKm),
                    color: "#0f766e",
                  },
                  {
                    label: "누적 상승",
                    value: `${Math.round(track.elevationGain)} m`,
                    color: "#ea580c",
                  },
                  {
                    label: "최고 고도",
                    value: formatElevation(track.maxElevation),
                    color: "#7c3aed",
                  },
                  {
                    label: "최저 고도",
                    value: formatElevation(track.minElevation),
                    color: "#2563eb",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "20px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "13px",
                        marginBottom: "6px",
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ color: item.color, fontSize: "20px" }}>
                      {item.value}
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "20px",
                    backgroundColor: "#ffffff",
                    gridColumn: "span 2",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "13px",
                      }}
                    >
                      페이스
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9a3412",
                        textAlign: "right",
                      }}
                    >
                      예상 완주 시간
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "stretch",
                      justifyContent: "space-between",
                      gap: "12px",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            borderRadius: "12px",
                            backgroundColor: "#f97316",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff7ed",
                            fontSize: "14px",
                            height: "32px",
                            minWidth: "92px",
                            padding: "0 12px",
                            boxShadow: "0 4px 10px rgba(249, 115, 22, 0.14)",
                          }}
                        >
                          {selectedPace.label}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => updateSelectedPaceByStep(1)}
                            disabled={
                              selectedPaceIndex === PACE_OPTIONS.length - 1
                            }
                            style={{
                              width: "18px",
                              height: "18px",
                              border: "1px solid rgba(148, 163, 184, 0.24)",
                              borderRadius: "999px",
                              backgroundColor: "rgba(255,255,255,0.92)",
                              color: "#334155",
                              fontSize: "8px",
                              lineHeight: 1,
                              cursor:
                                selectedPaceIndex === PACE_OPTIONS.length - 1
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                selectedPaceIndex === PACE_OPTIONS.length - 1
                                  ? 0.4
                                  : 1,
                            }}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSelectedPaceByStep(-1)}
                            disabled={selectedPaceIndex === 0}
                            style={{
                              width: "18px",
                              height: "18px",
                              border: "1px solid rgba(148, 163, 184, 0.24)",
                              borderRadius: "999px",
                              backgroundColor: "rgba(255,255,255,0.92)",
                              color: "#334155",
                              fontSize: "8px",
                              lineHeight: 1,
                              cursor:
                                selectedPaceIndex === 0
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: selectedPaceIndex === 0 ? 0.4 : 1,
                            }}
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "flex-end",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "22px",
                          lineHeight: 1.15,
                          color: "#7c2d12",
                          wordBreak: "keep-all",
                          textAlign: "right",
                          minHeight: "32px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {estimatedFinishTime}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              <section
                style={{
                  borderRadius: "28px",
                  padding: "20px",
                  backgroundColor: "#0f172a",
                  color: "#f8fafc",
                  overflow: "hidden",
                }}
              >
                <div style={{ fontSize: "18px", marginBottom: "8px" }}>
                  경로
                </div>
                {/* <div
                  style={{
                    color: "rgba(248, 250, 252, 0.72)",
                    marginBottom: "16px",
                  }}
                >
                  GPX 좌표를 네이버 지도 위에 경로로 표시하고 시작점과 종료점을
                  함께 보여줘요.
                </div> */}
                <div
                  ref={mapElementRef}
                  style={{
                    width: "100%",
                    minHeight: "440px",
                    borderRadius: "22px",
                    overflow: "hidden",
                    background:
                      "radial-gradient(circle at top, rgba(56, 189, 248, 0.16), transparent 52%), #020617",
                  }}
                />
              </section>

              <section
                style={{
                  borderRadius: "28px",
                  padding: "20px",
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(148, 163, 184, 0.16)",
                }}
              >
                <div style={{ fontSize: "18px", marginBottom: "8px" }}>
                  고도 그래프
                </div>
                {/* <div style={{ color: "#64748b", marginBottom: "16px" }}>
                  이동 거리 대비 고도 변화를 확인할 수 있어요.
                </div> */}
                <div
                  ref={chartContainerRef}
                  onMouseMove={handleChartContainerMouseMove}
                  onMouseLeave={handleChartContainerMouseLeave}
                  onClick={handleChartContainerClick}
                  onTouchStart={handleChartContainerTouchStart}
                  onTouchMove={handleChartContainerTouchMove}
                  onTouchEnd={handleChartContainerTouchEnd}
                  onTouchCancel={handleChartContainerTouchEnd}
                  style={{
                    width: "100%",
                    aspectRatio: "3.5 / 1",
                    minHeight: "160px",
                    touchAction: "none",
                  }}
                >
                  <ReactECharts
                    ref={chartRef}
                    option={elevationChartOption}
                    style={{ width: "100%", height: "100%" }}
                    notMerge
                  />
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default JejuTrail2026Page;
