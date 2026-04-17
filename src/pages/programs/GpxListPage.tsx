import React, { ChangeEvent, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type GpxFileListItem = {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  pointCount: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  createdAt: string;
  updatedAt?: string;
};

const SUPABASE_URL = `${import.meta.env.VITE_SUPABASE_URL || ""}`.trim();
const SUPABASE_PUBLISHABLE_KEY =
  `${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""}`.trim();
const SUPABASE_GPX_BUCKET =
  `${import.meta.env.VITE_SUPABASE_GPX_BUCKET || "gpx-files"}`.trim();
const MAX_GPX_FILE_SIZE = 5 * 1024 * 1024;

const supabase =
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

const mockGpxFileList: GpxFileListItem[] = [
  {
    id: "gpx-jeju-gasiri-36k",
    title: "제주트레일 가시리 36K",
    fileName: "jeju-trail-gasiri-36k.gpx",
    fileSize: 1245890,
    distance: 36180,
    elevationGain: 684,
    elevationLoss: 682,
    pointCount: 3584,
    startLat: 33.38696,
    startLng: 126.72984,
    endLat: 33.3869,
    endLng: 126.72977,
    createdAt: "2026-04-01T09:15:00+09:00",
    updatedAt: "2026-04-13T18:20:00+09:00",
  },
  {
    id: "gpx-bukhansan-loop",
    title: "북한산 둘레길 아침 코스",
    fileName: "bukhansan-morning-loop.gpx",
    fileSize: 482316,
    distance: 12840,
    elevationGain: 512,
    elevationLoss: 506,
    pointCount: 1428,
    startLat: 37.65828,
    startLng: 126.97795,
    endLat: 37.65846,
    endLng: 126.97804,
    createdAt: "2026-03-28T07:42:00+09:00",
  },
  {
    id: "gpx-han-river-night",
    title: "한강 야간 러닝",
    fileName: "han-river-night-run.gpx",
    fileSize: 298144,
    distance: 10120,
    elevationGain: 42,
    elevationLoss: 39,
    pointCount: 966,
    startLat: 37.52162,
    startLng: 126.94008,
    endLat: 37.54891,
    endLng: 127.04473,
    createdAt: "2026-03-22T21:08:00+09:00",
    updatedAt: "2026-03-23T10:11:00+09:00",
  },
  {
    id: "gpx-seorak-daecheong",
    title: "설악산 대청봉 왕복",
    fileName: "seorak-daecheong-out-and-back.gpx",
    fileSize: 887032,
    distance: 16870,
    elevationGain: 1396,
    elevationLoss: 1392,
    pointCount: 2481,
    startLat: 38.11938,
    startLng: 128.46572,
    endLat: 38.11934,
    endLng: 128.46569,
    createdAt: "2026-02-15T06:30:00+09:00",
  },
  {
    id: "gpx-namsan-short",
    title: "남산 짧은 산책",
    fileName: "namsan-short-walk.gpx",
    fileSize: 164208,
    distance: 4210,
    elevationGain: 154,
    elevationLoss: 151,
    pointCount: 522,
    startLat: 37.55136,
    startLng: 126.98821,
    endLat: 37.55131,
    endLng: 126.98817,
    createdAt: "2026-01-19T16:24:00+09:00",
    updatedAt: "2026-01-20T08:45:00+09:00",
  },
  {
    id: "gpx-busan-coast",
    title: "부산 해안 따라 걷기",
    fileName: "busan-coastal-walk.gpx",
    fileSize: 612774,
    distance: 22450,
    elevationGain: 318,
    elevationLoss: 327,
    pointCount: 1906,
    startLat: 35.1587,
    startLng: 129.16039,
    endLat: 35.10055,
    endLng: 129.03048,
    createdAt: "2025-12-07T11:02:00+09:00",
  },
  {
    id: "gpx-gyeongju-bike",
    title: "경주 자전거 한 바퀴",
    fileName: "gyeongju-bike-loop.gpx",
    fileSize: 735690,
    distance: 43600,
    elevationGain: 286,
    elevationLoss: 284,
    pointCount: 2215,
    startLat: 35.83472,
    startLng: 129.21866,
    endLat: 35.83481,
    endLng: 129.21872,
    createdAt: "2025-11-03T09:36:00+09:00",
    updatedAt: "2025-11-05T13:12:00+09:00",
  },
];

const formatDistance = (meters: number) => `${(meters / 1000).toFixed(2)} km`;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateValue: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateValue));

const isGpxFile = (file: File) => file.name.toLowerCase().endsWith(".gpx");
const getGpxUploadContentType = (file: File) =>
  isGpxFile(file)
    ? "application/gpx+xml"
    : file.type || "application/octet-stream";

const createStorageFilePath = (fileName: string) => {
  const sanitizedFileName = fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "");

  return `${Date.now()}-${sanitizedFileName || "route.gpx"}`;
};

const GpxListPage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadErrorMessage, setUploadErrorMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleGpxFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    setUploadMessage("");
    setUploadErrorMessage("");

    if (!isGpxFile(selectedFile)) {
      setUploadErrorMessage("GPX 파일만 업로드할 수 있어요.");
      return;
    }

    if (selectedFile.size > MAX_GPX_FILE_SIZE) {
      setUploadErrorMessage("5MB 이하의 GPX 파일만 업로드할 수 있어요.");
      return;
    }

    if (!supabase) {
      setUploadErrorMessage("Supabase 환경변수를 확인해주세요.");
      return;
    }

    setIsUploading(true);

    try {
      const { error } = await supabase.storage
        .from(SUPABASE_GPX_BUCKET)
        .upload(createStorageFilePath(selectedFile.name), selectedFile, {
          contentType: getGpxUploadContentType(selectedFile),
          upsert: false,
        });

      if (error) {
        throw error;
      }

      setUploadMessage(`${selectedFile.name} 업로드가 완료됐어요.`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "GPX 파일을 업로드하지 못했어요.";
      const lowerErrorMessage = errorMessage.toLowerCase();

      setUploadErrorMessage(
        lowerErrorMessage.includes("bucket not found")
          ? `${SUPABASE_GPX_BUCKET} 버킷을 찾지 못했어요. Supabase Storage 버킷 이름을 확인해주세요.`
          : lowerErrorMessage.includes("row-level security")
            ? "Supabase Storage 업로드 정책이 필요해요. gpx-files 버킷의 storage.objects INSERT 정책을 확인해주세요."
          : errorMessage,
      );
    } finally {
      setIsUploading(false);
    }
  };

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
      <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
        <div
          style={{
            fontFamily: "Comico",
            fontSize: "clamp(20px, 2vw, 28px)",
            lineHeight: 1,
            color: "#111827",
            marginBottom: "18px",
          }}
        >
          route list
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div style={{ color: "#64748b", fontSize: "14px" }}>
            GPX 파일만, 최대 5MB까지 업로드할 수 있어요.
          </div>
          <button
            type="button"
            onClick={handleUploadButtonClick}
            disabled={isUploading}
            style={{
              flexShrink: 0,
              height: "40px",
              padding: "0 16px",
              borderRadius: "8px",
              border: "1px solid rgba(15, 23, 42, 0.14)",
              backgroundColor: "#ffffff",
              color: "#0f172a",
              fontFamily: "Pretendard",
              fontSize: "14px",
              fontWeight: 800,
              cursor: isUploading ? "not-allowed" : "pointer",
              opacity: isUploading ? 0.6 : 1,
              boxShadow: "0 8px 18px rgba(15, 23, 42, 0.07)",
            }}
          >
            {isUploading ? "업로드 중" : "GPX 업로드"}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx,application/gpx+xml,application/xml,text/xml"
          onChange={handleGpxFileUpload}
          style={{ display: "none" }}
        />

        {uploadErrorMessage ? (
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "14px",
          }}
        >
          {mockGpxFileList.map((item) => (
            <article
              key={item.id}
              style={{
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={item.title}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      marginTop: "4px",
                      color: "#64748b",
                      fontSize: "13px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={item.fileName}
                  >
                    {item.fileName}
                  </div>
                </div>
                <div
                  style={{
                    flexShrink: 0,
                    alignSelf: "flex-start",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    color: "#475569",
                    fontSize: "12px",
                    padding: "5px 8px",
                  }}
                >
                  {formatFileSize(item.fileSize)}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "10px",
                }}
              >
                {[
                  ["거리", formatDistance(item.distance)],
                  ["상승", `${Math.round(item.elevationGain)} m`],
                  ["하강", `${Math.round(item.elevationLoss)} m`],
                  ["좌표", item.pointCount.toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ color: "#94a3b8", fontSize: "12px" }}>
                      {label}
                    </div>
                    <div style={{ marginTop: "2px", fontSize: "16px" }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "14px",
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(148, 163, 184, 0.16)",
                  color: "#64748b",
                  fontSize: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                }}
              >
                <span>생성 {formatDate(item.createdAt)}</span>
                {item.updatedAt ? <span>수정 {formatDate(item.updatedAt)}</span> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GpxListPage;
