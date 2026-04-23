import React, {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@supabase/supabase-js";
import { Download, Eye, Minus, Plus, Search, Upload } from "lucide-react";

type GpxFileListItemBase = {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  gpxUrl: string;
  storagePath: string;
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  maxElevation: number;
  pointCount: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  dueDate?: string;
  regionSido?: string;
  regionCity?: string;
  checkpointCount: number;
  createdAt: string;
  updatedAt?: string;
};

type GpxFileListItem =
  | (GpxFileListItemBase & {
      url: string;
    })
  | (GpxFileListItemBase & {
      url?: undefined;
    });

type ParsedGpxMetadata = Pick<
  GpxFileListItemBase,
  | "distance"
  | "elevationGain"
  | "elevationLoss"
  | "maxElevation"
  | "pointCount"
  | "startLat"
  | "startLng"
  | "endLat"
  | "endLng"
>;

type GpxFileRow = {
  id: string | number;
  title: string;
  file_name: string;
  file_size: number;
  gpx_url: string;
  storage_path: string;
  distance: number;
  elevation_gain: number;
  elevation_loss: number;
  max_elevation: number;
  point_count: number;
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  due_date: string | null;
  region_sido: string | null;
  region_city: string | null;
  gpx_route_checkpoints?: Array<{ id: string | number }>;
  url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type GpxRoutePoint = {
  lat: number;
  lng: number;
  elevation: number | null;
};

type GpxRouteCheckpointCountRow = {
  route_id: string | number;
};

type GpxListSearchFilters = {
  regionSido: string;
  regionCity: string;
  minDistanceKm: string;
  maxDistanceKm: string;
  minElevationGain: string;
  maxElevationGain: string;
};

const SUPABASE_URL = `${import.meta.env.VITE_SUPABASE_URL || ""}`.trim();
const SUPABASE_PUBLISHABLE_KEY =
  `${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""}`.trim();
const SUPABASE_GPX_BUCKET = "route-gpx-files";
const SUPABASE_GPX_TABLE = "gpx_route_catalog";
const SUPABASE_GPX_CHECKPOINT_TABLE = "gpx_route_checkpoints";
const MAX_GPX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_CHECKPOINT_COUNT = 5;
const GPX_LIST_PAGE_SIZE = 10;
const DISTANCE_FILTER_MIN = 0;
const DISTANCE_FILTER_MAX = 150;
const ELEVATION_GAIN_FILTER_MIN = 0;
const ELEVATION_GAIN_FILTER_MAX = 10000;
const REGION_OPTIONS: Record<string, string[]> = {
  서울특별시: [
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구",
  ],
  부산광역시: [
    "강서구",
    "금정구",
    "기장군",
    "남구",
    "동구",
    "동래구",
    "부산진구",
    "북구",
    "사상구",
    "사하구",
    "서구",
    "수영구",
    "연제구",
    "영도구",
    "중구",
    "해운대구",
  ],
  대구광역시: ["군위군", "남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구"],
  인천광역시: ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
  광주광역시: ["광산구", "남구", "동구", "북구", "서구"],
  대전광역시: ["대덕구", "동구", "서구", "유성구", "중구"],
  울산광역시: ["남구", "동구", "북구", "울주군", "중구"],
  세종특별자치시: ["세종시"],
  경기도: [
    "가평군",
    "고양시",
    "과천시",
    "광명시",
    "광주시",
    "구리시",
    "군포시",
    "김포시",
    "남양주시",
    "동두천시",
    "부천시",
    "성남시",
    "수원시",
    "시흥시",
    "안산시",
    "안성시",
    "안양시",
    "양주시",
    "양평군",
    "여주시",
    "연천군",
    "오산시",
    "용인시",
    "의왕시",
    "의정부시",
    "이천시",
    "파주시",
    "평택시",
    "포천시",
    "하남시",
    "화성시",
  ],
  강원특별자치도: ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
  충청북도: ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시", "충주시"],
  충청남도: ["계룡시", "공주시", "금산군", "논산시", "당진시", "보령시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시", "청양군", "태안군", "홍성군"],
  전북특별자치도: ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시", "정읍시", "진안군"],
  전라남도: ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
  경상북도: ["경산시", "경주시", "고령군", "구미시", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시"],
  경상남도: ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시", "통영시", "하동군", "함안군", "함양군", "합천군"],
  제주특별자치도: ["서귀포시", "제주시"],
};

const supabase =
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

const formatNumber = (value: number, fractionDigits = 0) =>
  value.toLocaleString("ko-KR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const formatDistance = (meters: number) =>
  `${formatNumber(meters / 1000, 2)} km`;

const formatDistanceKm = (kilometers: number) =>
  `${formatNumber(kilometers, Number.isInteger(kilometers) ? 0 : 1)}km`;

const formatElevationMeter = (meters: number) =>
  `${formatNumber(Math.round(meters))} m`;

const formatDate = (dateValue: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateValue));

const formatDueDate = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}(${weekdays[date.getDay()]})`;
};

const getRaceDueDayDiff = (dateValue?: string) => {
  if (!dateValue) {
    return null;
  }

  const dueDate = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(dueDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.floor(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
};

const isRaceDueWithinWeek = (dateValue?: string) => {
  const dayDiff = getRaceDueDayDiff(dateValue);

  return dayDiff !== null && dayDiff >= 0 && dayDiff < 7;
};

const getRaceCardBorderColor = (dateValue?: string) => {
  return isRaceDueWithinWeek(dateValue)
    ? "#111827"
    : "rgba(148, 163, 184, 0.16)";
};

const getRaceCardBackgroundColor = (dateValue?: string) =>
  isRaceDueWithinWeek(dateValue) ? "#ffffff" : "#f8fafc";

const toInteger = (value: number) => Math.round(Number(value) || 0);

const parseNumber = (rawValue: string | null) => {
  if (rawValue === null) {
    return null;
  }

  const parsedValue = Number(rawValue.trim());
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const calculateDistanceInMeters = (
  firstLat: number,
  firstLng: number,
  secondLat: number,
  secondLng: number,
) => {
  const earthRadius = 6371000;
  const toRadian = (value: number) => (value * Math.PI) / 180;
  const latDelta = toRadian(secondLat - firstLat);
  const lngDelta = toRadian(secondLng - firstLng);
  const firstLatInRadian = toRadian(firstLat);
  const secondLatInRadian = toRadian(secondLat);
  const haversineValue =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(firstLatInRadian) *
      Math.cos(secondLatInRadian) *
      Math.sin(lngDelta / 2) ** 2;

  return (
    2 *
    earthRadius *
    Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))
  );
};

const parseGpxMetadata = (xmlText: string): ParsedGpxMetadata => {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(xmlText, "application/xml");
  const parserError = xmlDocument.querySelector("parsererror");

  if (parserError) {
    throw new Error("GPX 파일을 읽는 중에 XML 파싱 오류가 발생했어요.");
  }

  const pointElements = Array.from(
    xmlDocument.querySelectorAll("trkpt, rtept"),
  );
  const points = pointElements
    .map((pointElement): GpxRoutePoint | null => {
      const lat = parseNumber(pointElement.getAttribute("lat"));
      const lng = parseNumber(pointElement.getAttribute("lon"));
      const elevation = parseNumber(
        pointElement.querySelector("ele")?.textContent ?? null,
      );

      if (lat === null || lng === null) {
        return null;
      }

      return { lat, lng, elevation };
    })
    .filter((point): point is GpxRoutePoint => point !== null);

  if (points.length < 2) {
    throw new Error("GPX 경로 좌표가 부족해요.");
  }

  let distance = 0;
  let elevationGain = 0;
  let elevationLoss = 0;

  points.forEach((point, index) => {
    const previousPoint = points[index - 1];

    if (!previousPoint) {
      return;
    }

    distance += calculateDistanceInMeters(
      previousPoint.lat,
      previousPoint.lng,
      point.lat,
      point.lng,
    );

    if (previousPoint.elevation !== null && point.elevation !== null) {
      const elevationDelta = point.elevation - previousPoint.elevation;

      if (elevationDelta > 0) {
        elevationGain += elevationDelta;
      } else {
        elevationLoss += Math.abs(elevationDelta);
      }
    }
  });

  const elevations = points
    .map((point) => point.elevation)
    .filter((elevation): elevation is number => elevation !== null);
  const startPoint = points[0];
  const endPoint = points[points.length - 1];

  return {
    distance: toInteger(distance),
    elevationGain: toInteger(elevationGain),
    elevationLoss: toInteger(elevationLoss),
    maxElevation: elevations.length ? toInteger(Math.max(...elevations)) : 0,
    pointCount: points.length,
    startLat: startPoint.lat,
    startLng: startPoint.lng,
    endLat: endPoint.lat,
    endLng: endPoint.lng,
  };
};

const mapGpxFileRowToListItem = (row: GpxFileRow): GpxFileListItem => {
  const baseItem: GpxFileListItemBase = {
    id: String(row.id),
    title: row.title,
    fileName: row.file_name,
    fileSize: row.file_size,
    gpxUrl: row.gpx_url,
    storagePath: row.storage_path,
    distance: row.distance,
    elevationGain: row.elevation_gain,
    elevationLoss: row.elevation_loss,
    maxElevation: row.max_elevation,
    pointCount: row.point_count,
    startLat: row.start_lat ?? undefined,
    startLng: row.start_lng ?? undefined,
    endLat: row.end_lat ?? undefined,
    endLng: row.end_lng ?? undefined,
    dueDate: row.due_date ?? undefined,
    regionSido: row.region_sido ?? undefined,
    regionCity: row.region_city ?? undefined,
    checkpointCount: row.gpx_route_checkpoints?.length ?? 0,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? undefined,
  };

  return row.url ? { ...baseItem, url: row.url } : baseItem;
};

const sortGpxFileListByLatest = (items: GpxFileListItem[]) =>
  [...items].sort((firstItem, secondItem) => {
    const firstCreatedAt = Date.parse(firstItem.createdAt);
    const secondCreatedAt = Date.parse(secondItem.createdAt);
    const firstCreatedAtTime = Number.isFinite(firstCreatedAt)
      ? firstCreatedAt
      : 0;
    const secondCreatedAtTime = Number.isFinite(secondCreatedAt)
      ? secondCreatedAt
      : 0;
    const createdAtDiff = secondCreatedAtTime - firstCreatedAtTime;

    if (createdAtDiff !== 0) {
      return createdAtDiff;
    }

    return Number(secondItem.id) - Number(firstItem.id);
  });

const isGpxFile = (file: File) => file.name.toLowerCase().endsWith(".gpx");
const getGpxUploadContentType = (file: File) =>
  isGpxFile(file)
    ? "application/gpx+xml"
    : file.type || "application/octet-stream";

const createBrowserSafeId = () => {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const randomValues = crypto.getRandomValues(new Uint8Array(16));
  randomValues[6] = (randomValues[6] & 0x0f) | 0x40;
  randomValues[8] = (randomValues[8] & 0x3f) | 0x80;
  const hexValues = Array.from(randomValues, (value) =>
    value.toString(16).padStart(2, "0"),
  );

  return [
    hexValues.slice(0, 4).join(""),
    hexValues.slice(4, 6).join(""),
    hexValues.slice(6, 8).join(""),
    hexValues.slice(8, 10).join(""),
    hexValues.slice(10, 16).join(""),
  ].join("-");
};

const createStorageFilePath = (id: string) => `${id}/route.gpx`;

const createDefaultGpxListSearchFilters = (): GpxListSearchFilters => ({
  regionSido: "",
  regionCity: "",
  minDistanceKm: String(DISTANCE_FILTER_MIN),
  maxDistanceKm: String(DISTANCE_FILTER_MAX),
  minElevationGain: String(ELEVATION_GAIN_FILTER_MIN),
  maxElevationGain: String(ELEVATION_GAIN_FILTER_MAX),
});

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const GpxListPage = () => {
  const uploadDueDateInputRef = useRef<HTMLInputElement | null>(null);
  const listLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const [gpxFileList, setGpxFileList] = useState<GpxFileListItem[]>([]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMoreList, setIsLoadingMoreList] = useState(false);
  const [hasMoreGpxList, setHasMoreGpxList] = useState(true);
  const [gpxListPage, setGpxListPage] = useState(0);
  const [searchFilters, setSearchFilters] = useState<GpxListSearchFilters>(
    createDefaultGpxListSearchFilters,
  );
  const [appliedSearchFilters, setAppliedSearchFilters] =
    useState<GpxListSearchFilters>(createDefaultGpxListSearchFilters);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedGpxFile, setSelectedGpxFile] = useState<File | null>(null);
  const [uploadDueDate, setUploadDueDate] = useState("");
  const [uploadRegionSido, setUploadRegionSido] = useState("");
  const [uploadRegionCity, setUploadRegionCity] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadCheckpoints, setUploadCheckpoints] = useState<string[]>([]);
  const isUploadFormValid =
    !!uploadTitle.trim() && !!selectedGpxFile && !!uploadRegionSido;

  const loadGpxFileListPage = useCallback(
    async (page: number, mode: "replace" | "append") => {
      if (!supabase) {
        return;
      }

      if (mode === "replace") {
        setIsLoadingList(true);
        setGpxFileList([]);
        setHasMoreGpxList(true);
      } else {
        setIsLoadingMoreList(true);
      }

      const from = page * GPX_LIST_PAGE_SIZE;
      const to = from + GPX_LIST_PAGE_SIZE - 1;
      const minDistance = Number(appliedSearchFilters.minDistanceKm);
      const maxDistance = Number(appliedSearchFilters.maxDistanceKm);
      const minElevationGain = Number(appliedSearchFilters.minElevationGain);
      const maxElevationGain = Number(appliedSearchFilters.maxElevationGain);
      let query = supabase
        .from(SUPABASE_GPX_TABLE)
        .select("*");

      if (appliedSearchFilters.regionSido) {
        query = query.eq("region_sido", appliedSearchFilters.regionSido);
      }

      if (Number.isFinite(minDistance) && minDistance > 0) {
        query = query.gte("distance", Math.round(minDistance * 1000));
      }

      if (Number.isFinite(maxDistance) && maxDistance > 0) {
        query = query.lte("distance", Math.round(maxDistance * 1000));
      }

      if (Number.isFinite(minElevationGain) && minElevationGain > 0) {
        query = query.gte("elevation_gain", minElevationGain);
      }

      if (Number.isFinite(maxElevationGain) && maxElevationGain > 0) {
        query = query.lte("elevation_gain", maxElevationGain);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false, nullsFirst: false })
        .order("id", { ascending: false })
        .range(from, to);

      if (error) {
        setUploadErrorMessage(
          `${SUPABASE_GPX_TABLE} 테이블에서 GPX 리스트를 불러오지 못했어요: ${error.message}`,
        );
        setHasMoreGpxList(false);
      } else {
        const routeRows = (data ?? []) as GpxFileRow[];
        const routeIds = routeRows.map((row) => row.id);
        let checkpointCountMap = new Map<string, number>();

        if (routeIds.length) {
          const { data: checkpointData } = await supabase
            .from(SUPABASE_GPX_CHECKPOINT_TABLE)
            .select("route_id")
            .in("route_id", routeIds);

          checkpointCountMap = (
            (checkpointData ?? []) as GpxRouteCheckpointCountRow[]
          ).reduce<Map<string, number>>((countMap, checkpoint) => {
            const routeId = String(checkpoint.route_id);
            countMap.set(routeId, (countMap.get(routeId) ?? 0) + 1);
            return countMap;
          }, new Map());
        }

        const nextItems = routeRows.map((row) =>
          mapGpxFileRowToListItem({
            ...row,
            gpx_route_checkpoints: Array.from({
              length: checkpointCountMap.get(String(row.id)) ?? 0,
            }).map((_, index) => ({ id: index })),
          }),
        );

        setGpxFileList((prevList) => {
          const mergedList = mode === "replace" ? nextItems : [...prevList];
          const existingIds = new Set(mergedList.map((item) => item.id));

          if (mode === "append") {
            nextItems.forEach((item) => {
              if (!existingIds.has(item.id)) {
                mergedList.push(item);
              }
            });
          }

          return sortGpxFileListByLatest(mergedList);
        });
        setHasMoreGpxList(routeRows.length === GPX_LIST_PAGE_SIZE);
        setGpxListPage(page);
      }

      if (mode === "replace") {
        setIsLoadingList(false);
      } else {
        setIsLoadingMoreList(false);
      }
    },
    [
      appliedSearchFilters.maxDistanceKm,
      appliedSearchFilters.maxElevationGain,
      appliedSearchFilters.minDistanceKm,
      appliedSearchFilters.minElevationGain,
      appliedSearchFilters.regionSido,
    ],
  );

  useEffect(() => {
    loadGpxFileListPage(0, "replace");
  }, [loadGpxFileListPage]);

  useEffect(() => {
    const loadMoreElement = listLoadMoreRef.current;

    if (!loadMoreElement || !hasMoreGpxList || isLoadingList) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (
          entry.isIntersecting &&
          hasMoreGpxList &&
          !isLoadingList &&
          !isLoadingMoreList
        ) {
          loadGpxFileListPage(gpxListPage + 1, "append");
        }
      },
      { rootMargin: "220px 0px" },
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [
    gpxListPage,
    hasMoreGpxList,
    isLoadingList,
    isLoadingMoreList,
    loadGpxFileListPage,
  ]);

  const handleSearchFilterChange = (
    key: keyof GpxListSearchFilters,
    value: string,
  ) => {
    setSearchFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
      ...(key === "regionSido" ? { regionCity: "" } : {}),
    }));
  };

  const handleSearchRangeChange = (
    key:
      | "minDistanceKm"
      | "maxDistanceKm"
      | "minElevationGain"
      | "maxElevationGain",
    rawValue: string,
  ) => {
    const numericValue = Number(rawValue);

    if (!Number.isFinite(numericValue)) {
      return;
    }

    setSearchFilters((prevFilters) => {
      if (key === "minDistanceKm") {
        const maxDistance = Number(prevFilters.maxDistanceKm);
        return {
          ...prevFilters,
          minDistanceKm: String(Math.min(numericValue, maxDistance)),
        };
      }

      if (key === "maxDistanceKm") {
        const minDistance = Number(prevFilters.minDistanceKm);
        return {
          ...prevFilters,
          maxDistanceKm: String(Math.max(numericValue, minDistance)),
        };
      }

      if (key === "minElevationGain") {
        const maxElevationGain = Number(prevFilters.maxElevationGain);
        return {
          ...prevFilters,
          minElevationGain: String(Math.min(numericValue, maxElevationGain)),
        };
      }

      const minElevationGain = Number(prevFilters.minElevationGain);
      return {
        ...prevFilters,
        maxElevationGain: String(Math.max(numericValue, minElevationGain)),
      };
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedSearchFilters({
      regionSido: searchFilters.regionSido.trim(),
      regionCity: "",
      minDistanceKm: searchFilters.minDistanceKm.trim(),
      maxDistanceKm: searchFilters.maxDistanceKm.trim(),
      minElevationGain: searchFilters.minElevationGain.trim(),
      maxElevationGain: searchFilters.maxElevationGain.trim(),
    });
  };

  const handleSearchReset = () => {
    const defaultFilters = createDefaultGpxListSearchFilters();
    setSearchFilters(defaultFilters);
    setAppliedSearchFilters(defaultFilters);
  };

  useEffect(() => {
    if (!isUploadModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseUploadModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isUploadModalOpen, isUploading]);

  const handleUploadButtonClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadDueDatePickerOpen = () => {
    if (isUploading) {
      return;
    }

    uploadDueDateInputRef.current?.showPicker?.();
    uploadDueDateInputRef.current?.focus();
  };

  const resetUploadForm = () => {
    setUploadTitle("");
    setSelectedGpxFile(null);
    setUploadDueDate("");
    setUploadRegionSido("");
    setUploadRegionCity("");
    setUploadUrl("");
    setUploadCheckpoints([]);
  };

  const handleAddUploadCheckpoint = () => {
    setUploadCheckpoints((prevCheckpoints) =>
      prevCheckpoints.length >= MAX_CHECKPOINT_COUNT
        ? prevCheckpoints
        : [...prevCheckpoints, ""],
    );
  };

  const handleUploadCheckpointChange = (index: number, value: string) => {
    const numericValue = value
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*)\./g, "$1");

    setUploadCheckpoints((prevCheckpoints) =>
      prevCheckpoints.map((checkpoint, checkpointIndex) =>
        checkpointIndex === index ? numericValue : checkpoint,
      ),
    );
  };

  const handleRemoveUploadCheckpoint = (index: number) => {
    setUploadCheckpoints((prevCheckpoints) =>
      prevCheckpoints.filter((_, checkpointIndex) => checkpointIndex !== index),
    );
  };

  const handleCloseUploadModal = () => {
    if (isUploading) {
      return;
    }

    setIsUploadModalOpen(false);
    setUploadErrorMessage("");
    resetUploadForm();
  };

  const handleSelectedGpxFileChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setSelectedGpxFile(event.target.files?.[0] ?? null);
  };

  const handleGpxFileUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setUploadMessage("");
    setUploadErrorMessage("");

    const trimmedTitle = uploadTitle.trim();
    const trimmedUrl = uploadUrl.trim();
    const trimmedDueDate = uploadDueDate.trim();
    const trimmedRegionSido = uploadRegionSido.trim();
    const trimmedRegionCity = uploadRegionCity.trim();
    const checkpointDistances = uploadCheckpoints
      .slice(0, MAX_CHECKPOINT_COUNT)
      .map((checkpoint) => checkpoint.trim())
      .filter(Boolean)
      .map(Number)
      .filter(
        (checkpointDistance) =>
          Number.isFinite(checkpointDistance) && checkpointDistance > 0,
      );

    if (!trimmedTitle) {
      setUploadErrorMessage("제목을 입력해주세요.");
      return;
    }

    if (!selectedGpxFile) {
      setUploadErrorMessage("업로드할 GPX 파일을 선택해주세요.");
      return;
    }

    if (!isGpxFile(selectedGpxFile)) {
      setUploadErrorMessage("GPX 파일만 업로드할 수 있어요.");
      return;
    }

    if (selectedGpxFile.size > MAX_GPX_FILE_SIZE) {
      setUploadErrorMessage("5MB 이하의 GPX 파일만 업로드할 수 있어요.");
      return;
    }

    if (!trimmedRegionSido) {
      setUploadErrorMessage("시/도를 선택해주세요.");
      return;
    }

    if (!supabase) {
      setUploadErrorMessage("Supabase 환경변수를 확인해주세요.");
      return;
    }

    setIsUploading(true);

    try {
      const fileText = await selectedGpxFile.text();
      const parsedMetadata = parseGpxMetadata(fileText);
      const metadataForInsert = {
        ...parsedMetadata,
        distance: toInteger(parsedMetadata.distance),
        elevationGain: toInteger(parsedMetadata.elevationGain),
        elevationLoss: toInteger(parsedMetadata.elevationLoss),
        maxElevation: toInteger(parsedMetadata.maxElevation),
      };
      const storageId = createBrowserSafeId();
      const storagePath = createStorageFilePath(storageId);
      const { error } = await supabase.storage
        .from(SUPABASE_GPX_BUCKET)
        .upload(storagePath, selectedGpxFile, {
          contentType: getGpxUploadContentType(selectedGpxFile),
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_GPX_BUCKET)
        .getPublicUrl(storagePath);
      const gpxUrl = publicUrlData.publicUrl;
      const createdAt = new Date().toISOString();
      const insertPayload = {
        title: trimmedTitle,
        file_name: selectedGpxFile.name,
        file_size: selectedGpxFile.size,
        gpx_url: gpxUrl,
        storage_path: storagePath,
        distance: toInteger(metadataForInsert.distance),
        elevation_gain: toInteger(metadataForInsert.elevationGain),
        elevation_loss: toInteger(metadataForInsert.elevationLoss),
        max_elevation: toInteger(metadataForInsert.maxElevation),
        point_count: metadataForInsert.pointCount,
        start_lat: metadataForInsert.startLat,
        start_lng: metadataForInsert.startLng,
        end_lat: metadataForInsert.endLat,
        end_lng: metadataForInsert.endLng,
        created_at: createdAt,
        ...(trimmedDueDate ? { due_date: trimmedDueDate } : {}),
        region_sido: trimmedRegionSido,
        ...(trimmedRegionCity ? { region_city: trimmedRegionCity } : {}),
        ...(trimmedUrl
          ? {
              url: trimmedUrl,
            }
          : {}),
      };
      const { data: insertedRow, error: insertError } = await supabase
        .from(SUPABASE_GPX_TABLE)
        .insert(insertPayload)
        .select("*")
        .single();

      if (insertError) {
        await supabase.storage.from(SUPABASE_GPX_BUCKET).remove([storagePath]);
        throw insertError;
      }

      if (checkpointDistances.length) {
        const { error: checkpointInsertError } = await supabase
          .from(SUPABASE_GPX_CHECKPOINT_TABLE)
          .insert(
            checkpointDistances.map((checkpointDistance, index) => ({
              route_id: insertedRow.id,
              sequence: index + 1,
              distance_km: checkpointDistance,
            })),
          );

        if (checkpointInsertError) {
          throw checkpointInsertError;
        }
      }

      const nextItem = mapGpxFileRowToListItem({
        ...(insertedRow as GpxFileRow),
        gpx_route_checkpoints: checkpointDistances.map((_, index) => ({
          id: index,
        })),
      });
      setGpxFileList((prevList) =>
        sortGpxFileListByLatest([nextItem, ...prevList]),
      );
      setUploadMessage(`${selectedGpxFile.name} 업로드가 완료됐어요.`);
      setIsUploadModalOpen(false);
      resetUploadForm();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "GPX 파일을 업로드하지 못했어요.";
      const lowerErrorMessage = errorMessage.toLowerCase();

      setUploadErrorMessage(
        lowerErrorMessage.includes("bucket not found")
          ? `${SUPABASE_GPX_BUCKET} 버킷을 찾지 못했어요. Supabase Storage 버킷 이름을 확인해주세요.`
          : lowerErrorMessage.includes("row-level security")
            ? "Supabase Storage 또는 gpx_route_catalog 테이블의 RLS 정책이 필요해요. INSERT/SELECT 정책을 확인해주세요."
            : errorMessage,
      );
    } finally {
      setIsUploading(false);
    }
  };

  const distanceMinValue = clampNumber(
    Number(searchFilters.minDistanceKm),
    DISTANCE_FILTER_MIN,
    DISTANCE_FILTER_MAX,
  );
  const distanceMaxValue = clampNumber(
    Number(searchFilters.maxDistanceKm),
    DISTANCE_FILTER_MIN,
    DISTANCE_FILTER_MAX,
  );
  const elevationGainMinValue = clampNumber(
    Number(searchFilters.minElevationGain),
    ELEVATION_GAIN_FILTER_MIN,
    ELEVATION_GAIN_FILTER_MAX,
  );
  const elevationGainMaxValue = clampNumber(
    Number(searchFilters.maxElevationGain),
    ELEVATION_GAIN_FILTER_MIN,
    ELEVATION_GAIN_FILTER_MAX,
  );
  const distanceMinPercent =
    ((distanceMinValue - DISTANCE_FILTER_MIN) /
      (DISTANCE_FILTER_MAX - DISTANCE_FILTER_MIN)) *
    100;
  const distanceMaxPercent =
    ((distanceMaxValue - DISTANCE_FILTER_MIN) /
      (DISTANCE_FILTER_MAX - DISTANCE_FILTER_MIN)) *
    100;
  const elevationGainMinPercent =
    ((elevationGainMinValue - ELEVATION_GAIN_FILTER_MIN) /
      (ELEVATION_GAIN_FILTER_MAX - ELEVATION_GAIN_FILTER_MIN)) *
    100;
  const elevationGainMaxPercent =
    ((elevationGainMaxValue - ELEVATION_GAIN_FILTER_MIN) /
      (ELEVATION_GAIN_FILTER_MAX - ELEVATION_GAIN_FILTER_MIN)) *
    100;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "24px 16px 48px",
        boxSizing: "border-box",
        fontFamily: "Pretendard",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "Comico",
                fontSize: "clamp(20px, 2vw, 28px)",
                lineHeight: 1,
                color: "#111827",
              }}
            >
              route list
            </div>
            <div
              style={{
                marginTop: "8px",
                color: "#64748b",
                fontSize: "13px",
                fontWeight: 400,
                lineHeight: 1.4,
                wordBreak: "keep-all",
              }}
            >
              사람들이 공유한 GPX 경로를 모아보고, 새로운 코스를 발견해보세요.
            </div>
          </div>
          <button
            type="button"
            onClick={handleUploadButtonClick}
            disabled={isUploading}
            aria-label="GPX 업로드"
            style={{
              flexShrink: 0,
              width: "40px",
              height: "40px",
              borderRadius: "999px",
              border: 0,
              backgroundColor: "#111827",
              color: "#ffffff",
              fontFamily: "Pretendard",
              fontSize: "14px",
              fontWeight: 800,
              cursor: isUploading ? "not-allowed" : "pointer",
              opacity: isUploading ? 0.6 : 1,
              boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)",
            }}
          >
            <Upload size={18} strokeWidth={2.4} />
          </button>
        </div>

        {uploadErrorMessage && !isUploadModalOpen ? (
          <div
            style={{
              marginBottom: "14px",
              borderRadius: "8px",
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              padding: "12px 14px",
              fontSize: "14px",
            }}
          >
            {uploadErrorMessage}
          </div>
        ) : null}

        {uploadMessage ? (
          <div
            style={{
              marginBottom: "14px",
              borderRadius: "8px",
              backgroundColor: "#ecfdf5",
              color: "#047857",
              padding: "12px 14px",
              fontSize: "14px",
            }}
          >
            {uploadMessage}
          </div>
        ) : null}

        {isUploadModalOpen ? (
          <div
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                handleCloseUploadModal();
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              backgroundColor: "rgba(15, 23, 42, 0.42)",
            }}
          >
            <form
              onSubmit={handleGpxFileUpload}
              style={{
                width: "100%",
                maxWidth: "420px",
                boxSizing: "border-box",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                padding: "20px",
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.24)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 900,
                    color: "#0f172a",
                  }}
                >
                  GPX 업로드
                </h2>
                <button
                  type="button"
                  onClick={handleCloseUploadModal}
                  disabled={isUploading}
                  style={{
                    border: 0,
                    backgroundColor: "transparent",
                    color: "#64748b",
                    fontSize: "20px",
                    cursor: isUploading ? "not-allowed" : "pointer",
                  }}
                  aria-label="업로드 팝업 닫기"
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  marginBottom: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  color: "#64748b",
                  padding: "10px 12px",
                  fontSize: "13px",
                  lineHeight: 1.45,
                }}
              >
                GPX 파일만, 최대 5MB까지 업로드할 수 있어요.
              </div>

              {uploadErrorMessage ? (
                <div
                  style={{
                    marginBottom: "16px",
                    borderRadius: "8px",
                    backgroundColor: "#fef2f2",
                    color: "#b91c1c",
                    padding: "10px 12px",
                    fontSize: "13px",
                    lineHeight: 1.45,
                  }}
                >
                  {uploadErrorMessage}
                </div>
              ) : null}

              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  color: "#334155",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                제목 <span style={{ color: "#ef4444" }}>*</span>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(event) => setUploadTitle(event.target.value)}
                  disabled={isUploading}
                  style={{
                    width: "100%",
                    height: "40px",
                    marginTop: "6px",
                    borderRadius: "8px",
                    border: "1px solid rgba(148, 163, 184, 0.45)",
                    backgroundColor: isUploading ? "#f8fafc" : "#ffffff",
                    padding: "0 10px",
                    fontFamily: "Pretendard",
                    fontSize: "14px",
                    outline: "none",
                    cursor: isUploading ? "not-allowed" : "text",
                  }}
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "8px",
                  marginBottom: "12px",
                }}
              >
                <label
                  style={{
                    display: "block",
                    color: "#334155",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  시/도 <span style={{ color: "#ef4444" }}>*</span>
                  <select
                    value={uploadRegionSido}
                    onChange={(event) => {
                      setUploadRegionSido(event.target.value);
                      setUploadRegionCity("");
                    }}
                    disabled={isUploading}
                    style={{
                      width: "100%",
                      height: "40px",
                      marginTop: "6px",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 163, 184, 0.45)",
                      backgroundColor: isUploading ? "#f8fafc" : "#ffffff",
                      color: uploadRegionSido ? "#0f172a" : "#94a3b8",
                      padding: "0 10px",
                      fontFamily: "Pretendard",
                      fontSize: "14px",
                      outline: "none",
                      cursor: isUploading ? "not-allowed" : "pointer",
                    }}
                  >
                    <option value="">선택</option>
                    {Object.keys(REGION_OPTIONS).map((sido) => (
                      <option key={sido} value={sido}>
                        {sido}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  style={{
                    display: "block",
                    color: uploadRegionSido ? "#334155" : "#94a3b8",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  시/군/구
                  <select
                    value={uploadRegionCity}
                    onChange={(event) => setUploadRegionCity(event.target.value)}
                    disabled={isUploading || !uploadRegionSido}
                    style={{
                      width: "100%",
                      height: "40px",
                      marginTop: "6px",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 163, 184, 0.45)",
                      backgroundColor:
                        isUploading || !uploadRegionSido ? "#f8fafc" : "#ffffff",
                      color: uploadRegionCity ? "#0f172a" : "#94a3b8",
                      padding: "0 10px",
                      fontFamily: "Pretendard",
                      fontSize: "14px",
                      outline: "none",
                      cursor:
                        isUploading || !uploadRegionSido
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    <option value="">선택</option>
                    {(REGION_OPTIONS[uploadRegionSido] ?? []).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div
                style={{
                  display: "block",
                  marginBottom: "12px",
                  color: "#334155",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                GPX 파일 업로드 <span style={{ color: "#ef4444" }}>*</span>
                <input
                  id="gpx-upload-modal-file"
                  type="file"
                  accept=".gpx,application/gpx+xml,application/xml,text/xml"
                  onChange={handleSelectedGpxFileChange}
                  disabled={isUploading}
                  style={{ display: "none" }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    marginTop: "6px",
                    borderRadius: "8px",
                    border: "1px solid rgba(148, 163, 184, 0.45)",
                    backgroundColor: isUploading ? "#f8fafc" : "#ffffff",
                    padding: "7px",
                  }}
                >
                  <span
                    title={selectedGpxFile?.name || ""}
                    style={{
                      minWidth: 0,
                      flex: 1,
                      color: selectedGpxFile
                        ? "rgba(15, 23, 42, 0.75)"
                        : "#94a3b8",
                      fontSize: "13px",
                      fontWeight: selectedGpxFile ? 400 : 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedGpxFile?.name || "선택된 파일이 없어요"}
                  </span>
                  <label
                    htmlFor="gpx-upload-modal-file"
                    style={{
                      flexShrink: 0,
                      height: "32px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "8px",
                      backgroundColor: isUploading ? "#e2e8f0" : "#111827",
                      color: isUploading ? "#94a3b8" : "#ffffff",
                      padding: "0 12px",
                      fontSize: "12px",
                      fontWeight: 300,
                      cursor: isUploading ? "not-allowed" : "pointer",
                      pointerEvents: isUploading ? "none" : "auto",
                    }}
                  >
                    찾아보기
                  </label>
                </div>
              </div>

              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  color: "#334155",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                대회 날짜
                <div
                  onClick={handleUploadDueDatePickerOpen}
                  style={{
                    position: "relative",
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                    marginTop: "6px",
                    cursor: isUploading ? "not-allowed" : "pointer",
                  }}
                >
                  <input
                    ref={uploadDueDateInputRef}
                    type="date"
                    value={uploadDueDate}
                    onClick={(event) => {
                      event.currentTarget.showPicker?.();
                    }}
                    onChange={(event) => setUploadDueDate(event.target.value)}
                    disabled={isUploading}
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      minWidth: 0,
                      height: "40px",
                      boxSizing: "border-box",
                      WebkitAppearance: "none",
                      appearance: "none",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 163, 184, 0.45)",
                      backgroundColor: isUploading ? "#f8fafc" : "#ffffff",
                      color: uploadDueDate ? "#0f172a" : "transparent",
                      padding: "0 10px",
                      fontFamily: "Pretendard",
                      fontSize: "14px",
                      outline: "none",
                      cursor: isUploading ? "not-allowed" : "pointer",
                    }}
                  />
                  {!uploadDueDate ? (
                    <span
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "10px",
                        color: "#94a3b8",
                        fontSize: "14px",
                        fontWeight: 400,
                        transform: "translateY(-50%)",
                        pointerEvents: "none",
                      }}
                    >
                      ---.--.--.
                    </span>
                  ) : null}
                </div>
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                  color: "#334155",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0,
                    height: "32px",
                  }}
                >
                  <span>CP</span>
                  <button
                    type="button"
                    onClick={handleAddUploadCheckpoint}
                    disabled={
                      isUploading ||
                      uploadCheckpoints.length >= MAX_CHECKPOINT_COUNT
                    }
                    aria-label="CP 추가"
                    style={{
                      width: "20px",
                      height: "20px",
                      border: 0,
                      borderRadius: "999px",
                      backgroundColor:
                        isUploading ||
                        uploadCheckpoints.length >= MAX_CHECKPOINT_COUNT
                          ? "#e2e8f0"
                          : "#111827",
                      color:
                        isUploading ||
                        uploadCheckpoints.length >= MAX_CHECKPOINT_COUNT
                          ? "#94a3b8"
                          : "#ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor:
                        isUploading ||
                        uploadCheckpoints.length >= MAX_CHECKPOINT_COUNT
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    <Plus size={12} strokeWidth={2.5} />
                  </button>
                </div>
                <div
                  style={{
                    minWidth: 0,
                    flex: 1,
                    display: "flex",
                    flexWrap: "nowrap",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {uploadCheckpoints.map((checkpoint, index) => (
                    <div
                      key={index}
                      style={{
                        position: "relative",
                        flex: "1 1 0",
                        minWidth: "50px",
                        maxWidth: "64px",
                      }}
                    >
                      <input
                        id={`gpx-upload-cp-${index}`}
                        type="text"
                        inputMode="decimal"
                        value={checkpoint}
                        onChange={(event) =>
                          handleUploadCheckpointChange(
                            index,
                            event.target.value,
                          )
                        }
                        disabled={isUploading}
                        placeholder={`cp${index + 1}`}
                        style={{
                          width: "100%",
                          height: "32px",
                          boxSizing: "border-box",
                          borderRadius: "8px",
                          border: "1px solid rgba(148, 163, 184, 0.45)",
                          backgroundColor: isUploading ? "#f8fafc" : "#ffffff",
                          padding: "0 32px 0 6px",
                          fontFamily: "Pretendard",
                          fontSize: "12px",
                          outline: "none",
                          cursor: isUploading ? "not-allowed" : "text",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: "50%",
                          right: "18px",
                          color: "#64748b",
                          fontSize: "9px",
                          fontWeight: 500,
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                      >
                        km
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUploadCheckpoint(index)}
                        disabled={isUploading}
                        aria-label={`CP ${index + 1} 삭제`}
                        style={{
                          position: "absolute",
                          top: "50%",
                          right: "3px",
                          width: "15px",
                          height: "15px",
                          border: 0,
                          borderRadius: "999px",
                          backgroundColor: isUploading ? "#e2e8f0" : "#f1f5f9",
                          color: isUploading ? "#94a3b8" : "#475569",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transform: "translateY(-50%)",
                          cursor: isUploading ? "not-allowed" : "pointer",
                        }}
                      >
                        <Minus size={8} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <label
                style={{
                  display: "block",
                  marginBottom: "12px",
                  color: "#334155",
                  fontSize: "11px",
                  fontWeight: 800,
                }}
              >
                참고 URL
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(event) => setUploadUrl(event.target.value)}
                  disabled={isUploading}
                  style={{
                    width: "100%",
                    height: "40px",
                    marginTop: "6px",
                    borderRadius: "8px",
                    border: "1px solid rgba(148, 163, 184, 0.45)",
                    backgroundColor: isUploading ? "#f8fafc" : "#ffffff",
                    padding: "0 10px",
                    fontFamily: "Pretendard",
                    fontSize: "14px",
                    outline: "none",
                    cursor: isUploading ? "not-allowed" : "text",
                  }}
                />
              </label>

              <button
                type="submit"
                disabled={isUploading || !isUploadFormValid}
                style={{
                  width: "100%",
                  height: "44px",
                  border: 0,
                  borderRadius: "8px",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  fontFamily: "Pretendard",
                  fontSize: "15px",
                  fontWeight: 300,
                  cursor:
                    isUploading || !isUploadFormValid
                      ? "not-allowed"
                      : "pointer",
                  opacity: isUploading || !isUploadFormValid ? 0.42 : 1,
                }}
              >
                {isUploading ? "업로드 중" : "업로드하기"}
              </button>
            </form>
          </div>
        ) : null}

        <form
          onSubmit={handleSearchSubmit}
          style={{
            marginTop: "26px",
            marginBottom: "18px",
            borderRadius: "28px",
            backgroundColor: "#ffffff",
            padding: 0,
            boxSizing: "border-box",
          }}
        >
          <style>
            {`
              .gpx-range-slider {
                appearance: none;
                background: transparent;
                height: 28px;
                margin: 0;
                pointer-events: none;
                position: absolute;
                inset: 0;
                width: 100%;
              }

              .gpx-range-slider::-webkit-slider-runnable-track {
                background: transparent;
                border: 0;
                height: 4px;
              }

              .gpx-range-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                background: #111827;
                border: 3px solid #ffffff;
                border-radius: 999px;
                box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18);
                cursor: pointer;
                height: 18px;
                margin-top: -7px;
                pointer-events: auto;
                width: 18px;
              }

              .gpx-range-slider::-moz-range-track {
                background: transparent;
                border: 0;
                height: 4px;
              }

              .gpx-range-slider::-moz-range-thumb {
                background: #111827;
                border: 3px solid #ffffff;
                border-radius: 999px;
                box-shadow: 0 4px 10px rgba(15, 23, 42, 0.18);
                cursor: pointer;
                height: 14px;
                pointer-events: auto;
                width: 14px;
              }
            `}
          </style>
          <button
            type="button"
            onClick={() =>
              setIsSearchPanelOpen((currentIsOpen) => !currentIsOpen)
            }
            aria-expanded={isSearchPanelOpen}
            aria-controls="gpx-route-search-panel"
            style={{
              width: "100%",
              minHeight: "44px",
              border: 0,
              borderRadius: "999px",
              backgroundColor: "#111827",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              fontFamily: "Pretendard",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: isSearchPanelOpen
                ? "none"
                : "0 10px 22px rgba(15, 23, 42, 0.12)",
            }}
          >
            <Search size={17} strokeWidth={2.4} />
            경로 검색
          </button>
          <div
            id="gpx-route-search-panel"
            style={{
              maxHeight: isSearchPanelOpen ? "420px" : 0,
              opacity: isSearchPanelOpen ? 1 : 0,
              overflow: "hidden",
              transform: isSearchPanelOpen ? "translateY(0)" : "translateY(-8px)",
              transition:
                "max-height 260ms ease, opacity 180ms ease, transform 220ms ease",
              pointerEvents: isSearchPanelOpen ? "auto" : "none",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                gap: "12px",
                alignItems: "stretch",
                paddingTop: "12px",
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  borderRadius: "18px",
                  backgroundColor: "#f8fafc",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    color: "#64748b",
                    fontSize: "11px",
                    fontWeight: 700,
                    marginBottom: "8px",
                  }}
                >
                  지역
                </div>
                <select
                  value={searchFilters.regionSido}
                  onChange={(event) =>
                    handleSearchFilterChange("regionSido", event.target.value)
                  }
                  style={{
                    width: "100%",
                    height: "36px",
                    boxSizing: "border-box",
                    borderRadius: "8px",
                    border: 0,
                    backgroundColor: "#ffffff",
                    color: searchFilters.regionSido ? "#0f172a" : "#94a3b8",
                    padding: "0 10px",
                    fontFamily: "Pretendard",
                    fontSize: "13px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="">전체 지역</option>
                  {Object.keys(REGION_OPTIONS).map((sido) => (
                    <option key={sido} value={sido}>
                      {sido}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  minWidth: 0,
                  borderRadius: "18px",
                  backgroundColor: "#f8fafc",
                  padding: "12px",
                }}
              >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    color: "#64748b",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  총 거리
                </span>
                <strong
                  style={{
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatDistanceKm(distanceMinValue)} -{" "}
                  {formatDistanceKm(distanceMaxValue)}
                </strong>
              </div>
              <div
                style={{
                  position: "relative",
                  height: "28px",
                  marginTop: "2px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: 0,
                    right: 0,
                    height: "4px",
                    borderRadius: "999px",
                    backgroundColor: "#e2e8f0",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: `${distanceMinPercent}%`,
                    right: `${100 - distanceMaxPercent}%`,
                    height: "4px",
                    borderRadius: "999px",
                    backgroundColor: "#111827",
                  }}
                />
                <input
                  className="gpx-range-slider"
                  type="range"
                  min={DISTANCE_FILTER_MIN}
                  max={DISTANCE_FILTER_MAX}
                  step="0.1"
                  value={searchFilters.minDistanceKm}
                  onChange={(event) =>
                    handleSearchRangeChange("minDistanceKm", event.target.value)
                  }
                  style={{
                    zIndex: distanceMinValue > DISTANCE_FILTER_MAX - 8 ? 3 : 2,
                  }}
                  aria-label="최소 총 거리"
                />
                <input
                  className="gpx-range-slider"
                  type="range"
                  min={DISTANCE_FILTER_MIN}
                  max={DISTANCE_FILTER_MAX}
                  step="0.1"
                  value={searchFilters.maxDistanceKm}
                  onChange={(event) =>
                    handleSearchRangeChange("maxDistanceKm", event.target.value)
                  }
                  style={{
                    zIndex: 3,
                  }}
                  aria-label="최대 총 거리"
                />
              </div>
              </div>

              <div
                style={{
                  minWidth: 0,
                  borderRadius: "18px",
                  backgroundColor: "#f8fafc",
                  padding: "12px",
                }}
              >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <span
                  style={{
                    color: "#64748b",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  누적 상승
                </span>
                <strong
                  style={{
                    color: "#0f172a",
                    fontSize: "13px",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatElevationMeter(elevationGainMinValue)} -{" "}
                  {formatElevationMeter(elevationGainMaxValue)}
                </strong>
              </div>
              <div
                style={{
                  position: "relative",
                  height: "28px",
                  marginTop: "2px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: 0,
                    right: 0,
                    height: "4px",
                    borderRadius: "999px",
                    backgroundColor: "#e2e8f0",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: `${elevationGainMinPercent}%`,
                    right: `${100 - elevationGainMaxPercent}%`,
                    height: "4px",
                    borderRadius: "999px",
                    backgroundColor: "#111827",
                  }}
                />
                <input
                  className="gpx-range-slider"
                  type="range"
                  min={ELEVATION_GAIN_FILTER_MIN}
                  max={ELEVATION_GAIN_FILTER_MAX}
                  step="10"
                  value={searchFilters.minElevationGain}
                  onChange={(event) =>
                    handleSearchRangeChange(
                      "minElevationGain",
                      event.target.value,
                    )
                  }
                  style={{
                    zIndex:
                      elevationGainMinValue > ELEVATION_GAIN_FILTER_MAX - 500
                        ? 3
                        : 2,
                  }}
                  aria-label="최소 누적 상승"
                />
                <input
                  className="gpx-range-slider"
                  type="range"
                  min={ELEVATION_GAIN_FILTER_MIN}
                  max={ELEVATION_GAIN_FILTER_MAX}
                  step="10"
                  value={searchFilters.maxElevationGain}
                  onChange={(event) =>
                    handleSearchRangeChange(
                      "maxElevationGain",
                      event.target.value,
                    )
                  }
                  style={{
                    zIndex: 3,
                  }}
                  aria-label="최대 누적 상승"
                />
              </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "8px",
                  minWidth: 0,
                }}
              >
              <button
                type="button"
                onClick={handleSearchReset}
                style={{
                  height: "34px",
                  padding: "0 12px",
                  border: 0,
                  borderRadius: "999px",
                  backgroundColor: "#e2e8f0",
                  color: "#475569",
                  fontFamily: "Pretendard",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                초기화
              </button>
              <button
                type="submit"
                style={{
                  width: "58px",
                  height: "34px",
                  border: 0,
                  borderRadius: "999px",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  fontFamily: "Pretendard",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                검색
              </button>
              </div>
            </div>
          </div>
        </form>

        {isLoadingList && !gpxFileList.length ? (
          <div
            style={{
              borderRadius: "28px",
              backgroundColor: "#f8fafc",
              color: "#64748b",
              padding: "28px 20px",
              textAlign: "center",
              fontSize: "14px",
            }}
          >
            GPX 리스트를 불러오고 있어요.
          </div>
        ) : null}

        {!isLoadingList && !gpxFileList.length ? (
          <div
            style={{
              borderRadius: "28px",
              backgroundColor: "#f8fafc",
              color: "#64748b",
              padding: "28px 20px",
              textAlign: "center",
              fontSize: "14px",
            }}
          >
            아직 업로드된 GPX 파일이 없어요.
          </div>
        ) : null}

        <div
          style={{
            display: gpxFileList.length ? "grid" : "none",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 400px), 400px))",
            gap: "16px",
            justifyContent: "center",
          }}
        >
          {gpxFileList.map((item) => {
            const raceCardBorderColor = getRaceCardBorderColor(item.dueDate);
            const raceCardBackgroundColor = getRaceCardBackgroundColor(
              item.dueDate,
            );
            const isRaceCardDueWithinWeek = isRaceDueWithinWeek(item.dueDate);
            const statCardBackgroundColor = isRaceCardDueWithinWeek
              ? "#f8fafc"
              : "#ffffff";

            return (
              <article
                key={item.id}
                style={{
                  padding: "16px",
                  borderRadius: "28px",
                  backgroundColor: raceCardBackgroundColor,
                  border: `1px solid ${raceCardBorderColor}`,
                }}
              >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    minHeight: "34px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      width: "100%",
                    }}
                  >
                    {item.dueDate ? (
                      <span
                        style={{
                          flexShrink: 0,
                          borderRadius: "999px",
                          backgroundColor: "#e2e8f0",
                          color: "#334155",
                          padding: "3px 6px",
                          fontSize: "10px",
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                      >
                        대회
                      </span>
                    ) : null}
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          minWidth: 0,
                          color: "#0f172a",
                          fontSize: "17px",
                          fontWeight: 500,
                          lineHeight: 1.25,
                          overflow: "hidden",
                          textDecoration: "underline",
                          textOverflow: "ellipsis",
                          textUnderlineOffset: "3px",
                          whiteSpace: "nowrap",
                        }}
                        title={item.title}
                      >
                        {item.title}
                      </a>
                    ) : (
                      <div
                        style={{
                          minWidth: 0,
                          fontSize: "17px",
                          fontWeight: 500,
                          lineHeight: 1.25,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={item.title}
                      >
                        {item.title}
                      </div>
                    )}
                  </div>
                  {item.regionSido ||
                  item.regionCity ||
                  item.checkpointCount ||
                  item.dueDate ? (
                    <div
                      style={{
                        marginTop: "3px",
                        color: "#64748b",
                        fontSize: "11px",
                        fontWeight: 400,
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={[
                        [item.regionSido, item.regionCity].filter(Boolean).join(" "),
                        item.dueDate ? formatDueDate(item.dueDate) : "",
                        item.checkpointCount ? `CP ${item.checkpointCount}개` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    >
                      {[
                        [item.regionSido, item.regionCity].filter(Boolean).join(" "),
                        item.dueDate ? formatDueDate(item.dueDate) : "",
                        item.checkpointCount ? `CP ${item.checkpointCount}개` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  ) : null}
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    alignSelf: "flex-start",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {item.gpxUrl ? (
                    <a
                      href={item.gpxUrl}
                      download={item.fileName}
                      aria-label={`${item.title} 다운로드`}
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "999px",
                        border: 0,
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        boxShadow: "0 6px 14px rgba(15, 23, 42, 0.06)",
                      }}
                    >
                      <Download size={14} strokeWidth={2.4} />
                    </a>
                  ) : null}
                  {item.gpxUrl ? (
                    <a
                      href={`/gpx-viewer?routeId=${encodeURIComponent(
                        item.id,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${item.title} 뷰어 열기`}
                      title="GPX 뷰어"
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "999px",
                        border: 0,
                        backgroundColor: "#111827",
                        color: "#ffffff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        boxShadow: "0 6px 14px rgba(15, 23, 42, 0.1)",
                      }}
                    >
                      <Eye size={15} strokeWidth={2.4} />
                    </a>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  gap: "8px",
                  marginTop: "12px",
                }}
              >
                <div
                  style={{
                    flex: "0 0 108px",
                    borderRadius: "20px",
                    backgroundColor: statCardBackgroundColor,
                    padding: "12px 14px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#64748b",
                      fontSize: "11px",
                      fontWeight: 300,
                      lineHeight: 1,
                      marginBottom: "6px",
                    }}
                  >
                    총 거리
                  </span>
                  <strong
                    style={{
                      display: "block",
                      color: "#334155",
                      fontSize: "14px",
                      fontWeight: 500,
                      lineHeight: 1.1,
                    }}
                    title={formatDistance(item.distance)}
                  >
                    {formatDistance(item.distance)}
                  </strong>
                </div>

                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {[
                    {
                      label: "누적 상승",
                      value: formatElevationMeter(item.elevationGain),
                      color: "#475569",
                    },
                    {
                      label: "최고 고도",
                      value: formatElevationMeter(item.maxElevation),
                      color: "#64748b",
                    },
                  ].map((stat) => (
                    <span
                      key={stat.label}
                      style={{
                        minWidth: 0,
                        borderRadius: "20px",
                        backgroundColor: statCardBackgroundColor,
                        padding: "12px 14px",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          color: "#64748b",
                          fontSize: "11px",
                          fontWeight: 300,
                          lineHeight: 1,
                          marginBottom: "6px",
                        }}
                      >
                        {stat.label}
                      </span>
                      <strong
                        style={{
                          display: "block",
                          color: stat.color,
                          fontSize: "14px",
                          fontWeight: 500,
                          lineHeight: 1.1,
                          textAlign: "right",
                        }}
                        title={stat.value}
                      >
                        {stat.value}
                      </strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* <div
                style={{
                  marginTop: "10px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(148, 163, 184, 0.16)",
                  color: "#64748b",
                  fontSize: "11px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <span>생성 {formatDate(item.createdAt)}</span>
                  {item.updatedAt ? (
                    <span>수정 {formatDate(item.updatedAt)}</span>
                  ) : null}
                </div>
              </div> */}
              </article>
            );
          })}
        </div>

        {gpxFileList.length ? (
          <div
            ref={listLoadMoreRef}
            style={{
              minHeight: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            {isLoadingMoreList
              ? "경로를 더 불러오고 있어요."
              : hasMoreGpxList
                ? ""
                : "모든 경로를 불러왔어요."}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GpxListPage;
