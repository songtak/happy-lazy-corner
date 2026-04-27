import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import friendsZFontUrl from "@/assets/fonts/FriendsZ-6RB0D.ttf";

type Point = {
  x: number;
  y: number;
};

type Size = {
  width: number;
  height: number;
  pixelRatio: number;
};

type FallingStroke = {
  id: number;
  image: HTMLCanvasElement;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  rotation: number;
  rotationVelocity: number;
};

const MODEL_ASSET_PATH = "/mediapipe/models/hand_landmarker.task";
const WASM_ASSET_PATH = "/mediapipe/wasm";
const PINCH_THRESHOLD = 0.05;
const PINCH_STABLE_FRAMES = 2;
const FIST_STABLE_FRAMES = 3;
const SMOOTHING_FACTOR = 0.32;
const DEFAULT_ASPECT_RATIO = 16 / 9;
const DROP_ZONE_HEIGHT = 180;
const FALL_GRAVITY = 0.42;
const COLOR_OPTIONS = [
  "#111827",
  "#ffffff",
  "#ef4444",
  "#ec4899",
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#a855f7",
] as const;

const getPaletteBorderColor = (color: string) => {
  if (color === "#ffffff") {
    return "rgba(203, 213, 225, 0.96)";
  }

  return `${color}99`;
};

const getCanvas2dContext = (canvas: HTMLCanvasElement | null) => {
  return canvas?.getContext("2d") ?? null;
};

const clearCanvas = (canvas: HTMLCanvasElement | null) => {
  const context = getCanvas2dContext(canvas);

  if (!canvas || !context) {
    return;
  }

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.restore();
};

const getFingerCurled = (
  landmarks: HandLandmarkerResult["landmarks"][number],
  tipIndex: number,
  pipIndex: number,
  mcpIndex: number,
) => {
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  const mcp = landmarks[mcpIndex];

  return tip.y > pip.y && pip.y > mcp.y;
};

const isLocalCameraHost = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const { hostname } = window.location;
  const isPrivateIpv4 =
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname);

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local") ||
    isPrivateIpv4
  );
};

const getCameraSupportError = () => {
  if (typeof navigator === "undefined") {
    return "이 환경에서는 카메라를 사용할 수 없어요.";
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    const isHttp = protocol === "http:";
    const isStrictSecureHost =
      hostname === "localhost" || hostname === "127.0.0.1";

    if (isHttp && !isStrictSecureHost) {
      return "모바일 브라우저에서는 이 주소의 카메라 접근이 막혀 있어요. HTTPS 또는 localhost에서 열어주세요.";
    }
  }

  if (!window.isSecureContext && !isLocalCameraHost()) {
    return "카메라는 HTTPS 또는 localhost 환경에서만 사용할 수 있어요.";
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return "이 브라우저에서는 카메라 접근을 지원하지 않아요.";
  }

  return "";
};

const MotionDrawingPage = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const drawingLayerRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const lastVideoTimeRef = useRef(-1);
  const lastPointRef = useRef<Point | null>(null);
  const smoothPointRef = useRef<Point | null>(null);
  const pinchFramesRef = useRef(0);
  const lastPinchStateRef = useRef(false);
  const fistFramesRef = useRef(0);
  const lastFistStateRef = useRef(false);
  const stageSizeRef = useRef<Size | null>(null);
  const nextFallingStrokeIdRef = useRef(1);
  const fallingStrokesRef = useRef<FallingStroke[]>([]);
  const selectedColorRef = useRef<string>(COLOR_OPTIONS[0]);
  const loadingStepRef = useRef<
    "camera" | "video" | "wasm" | "model" | "ready"
  >("camera");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingStep, setLoadingStep] = useState<
    "camera" | "video" | "wasm" | "model" | "ready"
  >("camera");
  const [isDrawing, setIsDrawing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const [indicatorPoint, setIndicatorPoint] = useState<Point | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(COLOR_OPTIONS[0]);

  const updateLoadingStep = (
    nextStep: "camera" | "video" | "wasm" | "model" | "ready",
  ) => {
    loadingStepRef.current = nextStep;
    setLoadingStep(nextStep);
  };

  useEffect(() => {
    selectedColorRef.current = selectedColor;

    const context = canvasRef.current?.getContext("2d");

    if (!context) {
      return;
    }

    context.strokeStyle = selectedColor;
  }, [selectedColor]);

  const statusText = useMemo(() => {
    if (errorMessage) {
      return errorMessage;
    }

    if (!isCameraReady) {
      return "웹캠을 준비하고 있어요.";
    }

    if (!isModelReady) {
      if (loadingStep === "wasm") {
        return "손 추적 엔진을 준비하고 있어요.";
      }

      if (loadingStep === "model") {
        return "손 추적 모델을 불러오고 있어요.";
      }

      return "손 추적 모델을 불러오고 있어요.";
    }

    return "";
  }, [errorMessage, isCameraReady, isModelReady, loadingStep]);

  const syncDrawingLayerStyle = (size: Size) => {
    if (!drawingLayerRef.current) {
      drawingLayerRef.current = document.createElement("canvas");
    }

    const drawingLayer = drawingLayerRef.current;
    const previousDrawingLayer = document.createElement("canvas");

    previousDrawingLayer.width = drawingLayer.width;
    previousDrawingLayer.height = drawingLayer.height;
    previousDrawingLayer
      .getContext("2d")
      ?.drawImage(drawingLayer, 0, 0, drawingLayer.width, drawingLayer.height);

    drawingLayer.width = Math.floor(size.width * size.pixelRatio);
    drawingLayer.height = Math.floor(size.height * size.pixelRatio);

    const drawingContext = getCanvas2dContext(drawingLayer);

    if (!drawingContext) {
      return;
    }

    drawingContext.setTransform(
      size.pixelRatio,
      0,
      0,
      size.pixelRatio,
      0,
      0,
    );
    drawingContext.lineCap = "round";
    drawingContext.lineJoin = "round";
    drawingContext.lineWidth = 4;
    drawingContext.strokeStyle = selectedColorRef.current;

    if (previousDrawingLayer.width && previousDrawingLayer.height) {
      drawingContext.drawImage(
        previousDrawingLayer,
        0,
        0,
        previousDrawingLayer.width,
        previousDrawingLayer.height,
        0,
        0,
        size.width,
        size.height,
      );
    }
  };

  const renderScene = () => {
    const canvas = canvasRef.current;
    const context = getCanvas2dContext(canvas);
    const drawingLayer = drawingLayerRef.current;
    const stageSize = stageSizeRef.current;

    if (!canvas || !context || !stageSize) {
      return;
    }

    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();

    if (drawingLayer) {
      context.drawImage(drawingLayer, 0, 0, stageSize.width, stageSize.height);
    }

    fallingStrokesRef.current.forEach((stroke) => {
      context.save();
      context.translate(stroke.x + stroke.width / 2, stroke.y + stroke.height / 2);
      context.rotate(stroke.rotation);
      context.drawImage(
        stroke.image,
        -stroke.width / 2,
        -stroke.height / 2,
        stroke.width,
        stroke.height,
      );
      context.restore();
    });
  };

  const updateFallingStrokes = () => {
    const stageSize = stageSizeRef.current;

    if (!stageSize) {
      return;
    }

    fallingStrokesRef.current = fallingStrokesRef.current
      .map((stroke) => ({
        ...stroke,
        y: stroke.y + stroke.velocityY,
        velocityY: stroke.velocityY + FALL_GRAVITY,
        rotation: stroke.rotation + stroke.rotationVelocity,
      }))
      .filter((stroke) => stroke.y < stageSize.height + DROP_ZONE_HEIGHT);
  };

  const releaseDrawingAsFallingStroke = () => {
    const drawingLayer = drawingLayerRef.current;
    const drawingContext = getCanvas2dContext(drawingLayer);
    const stageSize = stageSizeRef.current;

    if (!drawingLayer || !drawingContext || !stageSize) {
      return;
    }

    const imageData = drawingContext.getImageData(
      0,
      0,
      drawingLayer.width,
      drawingLayer.height,
    );
    const { data, width, height } = imageData;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[(y * width + x) * 4 + 3];

        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      return;
    }

    const snapshot = document.createElement("canvas");
    const snapshotWidth = maxX - minX + 1;
    const snapshotHeight = maxY - minY + 1;

    snapshot.width = snapshotWidth;
    snapshot.height = snapshotHeight;
    snapshot
      .getContext("2d")
      ?.putImageData(
        drawingContext.getImageData(minX, minY, snapshotWidth, snapshotHeight),
        0,
        0,
      );

    const pixelRatio = stageSize.pixelRatio;

    fallingStrokesRef.current.push({
      id: nextFallingStrokeIdRef.current,
      image: snapshot,
      x: minX / pixelRatio,
      y: minY / pixelRatio,
      width: snapshotWidth / pixelRatio,
      height: snapshotHeight / pixelRatio,
      velocityY: 4,
      rotation: 0,
      rotationVelocity: (Math.random() - 0.5) * 0.04,
    });
    nextFallingStrokeIdRef.current += 1;

    clearCanvas(drawingLayer);
    lastPointRef.current = null;
    smoothPointRef.current = null;
  };

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        const supportError = getCameraSupportError();

        if (supportError) {
          throw new Error(supportError);
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted || !videoRef.current) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = mediaStream;
        videoRef.current.srcObject = mediaStream;
        updateLoadingStep("video");
        await videoRef.current.play();

        if (!isMounted) {
          return;
        }

        const videoWidth = videoRef.current.videoWidth || 1280;
        const videoHeight = videoRef.current.videoHeight || 720;
        setAspectRatio(videoWidth / videoHeight);
        setIsCameraReady(true);

        updateLoadingStep("wasm");
        const vision = await FilesetResolver.forVisionTasks(WASM_ASSET_PATH);
        updateLoadingStep("model");
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_PATH,
          },
          numHands: 1,
          runningMode: "VIDEO",
        });

        if (!isMounted) {
          handLandmarker.close();
          return;
        }

        handLandmarkerRef.current = handLandmarker;
        setIsModelReady(true);
        updateLoadingStep("ready");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const prefixByStep = {
          camera: "웹캠을 준비하지 못했어요.",
          video: "웹캠 영상을 시작하지 못했어요.",
          wasm: "손 추적 엔진을 불러오지 못했어요.",
          model: "손 추적 모델을 불러오지 못했어요.",
          ready: "웹캠 또는 손 추적 모델을 초기화하지 못했어요.",
        } as const;
        const currentStep = loadingStepRef.current;
        const fallbackMessage = prefixByStep[currentStep];
        const detailMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : "";

        console.error("MotionDrawingPage setup error", {
          loadingStep: currentStep,
          error,
        });

        setErrorMessage(
          detailMessage
            ? `${fallbackMessage} ${detailMessage}`
            : fallbackMessage,
        );
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserverRef.current?.disconnect();
      handLandmarkerRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;

    if (!stage || !canvas) {
      return;
    }

    const resizeCanvas = () => {
      const context = getCanvas2dContext(canvas);

      if (!context) {
        return;
      }
      const rect = stage.getBoundingClientRect();
      const nextSize = {
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
        pixelRatio: window.devicePixelRatio || 1,
      };
      const previousSize = stageSizeRef.current;

      canvas.width = Math.floor(nextSize.width * nextSize.pixelRatio);
      canvas.height = Math.floor(nextSize.height * nextSize.pixelRatio);
      canvas.style.width = `${nextSize.width}px`;
      canvas.style.height = `${nextSize.height}px`;

      context.setTransform(
        nextSize.pixelRatio,
        0,
        0,
        nextSize.pixelRatio,
        0,
        0,
      );

      if (previousSize) {
        const widthRatio = nextSize.width / previousSize.width;
        const heightRatio = nextSize.height / previousSize.height;

        fallingStrokesRef.current = fallingStrokesRef.current.map((stroke) => ({
          ...stroke,
          x: stroke.x * widthRatio,
          y: stroke.y * heightRatio,
          width: stroke.width * widthRatio,
          height: stroke.height * heightRatio,
        }));
      }

      syncDrawingLayerStyle(nextSize);
      stageSizeRef.current = nextSize;
      renderScene();
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(stage);
    resizeObserverRef.current = resizeObserver;

    return () => {
      resizeObserver.disconnect();
    };
  }, [aspectRatio]);

  useEffect(() => {
    const runDetection = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const handLandmarker = handLandmarkerRef.current;

      if (!video || !canvas || !handLandmarker) {
        animationFrameRef.current = requestAnimationFrame(runDetection);
        return;
      }

      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        animationFrameRef.current = requestAnimationFrame(runDetection);
        return;
      }

      const hasNewFrame = lastVideoTimeRef.current !== video.currentTime;

      if (hasNewFrame) {
        lastVideoTimeRef.current = video.currentTime;
        const result = handLandmarker.detectForVideo(video, performance.now());

        handleHandResult(result);
      }

      updateFallingStrokes();
      renderScene();

      animationFrameRef.current = requestAnimationFrame(runDetection);
    };

    if (isCameraReady && isModelReady) {
      animationFrameRef.current = requestAnimationFrame(runDetection);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraReady, isModelReady]);

  const handleHandResult = (result: HandLandmarkerResult) => {
    const viewport = viewportRef.current;
    const drawingLayer = drawingLayerRef.current;
    const drawingContext = getCanvas2dContext(drawingLayer);

    if (!viewport || !drawingLayer || !drawingContext) {
      return;
    }

    const handLandmarks = result.landmarks[0];

    if (!handLandmarks) {
      pinchFramesRef.current = 0;
      fistFramesRef.current = 0;
      lastPointRef.current = null;
      smoothPointRef.current = null;
      lastPinchStateRef.current = false;
      lastFistStateRef.current = false;
      setIndicatorPoint(null);
      setIsDrawing(false);
      return;
    }

    const indexTip = handLandmarks[8];
    const thumbTip = handLandmarks[4];
    const pinchDistance = Math.hypot(
      indexTip.x - thumbTip.x,
      indexTip.y - thumbTip.y,
    );
    const isPinchCandidate = pinchDistance < PINCH_THRESHOLD;
    const curledFingerCount = [
      getFingerCurled(handLandmarks, 8, 6, 5),
      getFingerCurled(handLandmarks, 12, 10, 9),
      getFingerCurled(handLandmarks, 16, 14, 13),
      getFingerCurled(handLandmarks, 20, 18, 17),
    ].filter(Boolean).length;
    const isFistCandidate = !isPinchCandidate && curledFingerCount >= 3;

    pinchFramesRef.current = isPinchCandidate ? pinchFramesRef.current + 1 : 0;
    fistFramesRef.current = isFistCandidate ? fistFramesRef.current + 1 : 0;
    const isPinching = pinchFramesRef.current >= PINCH_STABLE_FRAMES;
    const isFist = fistFramesRef.current >= FIST_STABLE_FRAMES;

    const rect = viewport.getBoundingClientRect();
    const rawPoint = {
      x: (1 - indexTip.x) * rect.width,
      y: indexTip.y * rect.height,
    };
    const previousSmoothPoint = smoothPointRef.current ?? rawPoint;
    const smoothPoint = {
      x:
        previousSmoothPoint.x +
        (rawPoint.x - previousSmoothPoint.x) * SMOOTHING_FACTOR,
      y:
        previousSmoothPoint.y +
        (rawPoint.y - previousSmoothPoint.y) * SMOOTHING_FACTOR,
    };

    smoothPointRef.current = smoothPoint;
    setIndicatorPoint(smoothPoint);
    setIsDrawing(isPinching);

    if (isFist && !lastFistStateRef.current) {
      releaseDrawingAsFallingStroke();
      lastFistStateRef.current = true;
    } else if (!isFist) {
      lastFistStateRef.current = false;
    }

    if (!isPinching) {
      lastPointRef.current = null;
      lastPinchStateRef.current = false;
      return;
    }

    if (!lastPinchStateRef.current) {
      lastPointRef.current = smoothPoint;
      lastPinchStateRef.current = true;
      return;
    }

    const lastPoint = lastPointRef.current;

    if (!lastPoint) {
      lastPointRef.current = smoothPoint;
      return;
    }

    drawingContext.beginPath();
    drawingContext.strokeStyle = selectedColorRef.current;
    drawingContext.moveTo(lastPoint.x, lastPoint.y);
    drawingContext.lineTo(smoothPoint.x, smoothPoint.y);
    drawingContext.stroke();

    lastPointRef.current = smoothPoint;
  };

  const handleClearCanvas = () => {
    clearCanvas(drawingLayerRef.current);
    fallingStrokesRef.current = [];
    lastPointRef.current = null;
    smoothPointRef.current = null;
    setIndicatorPoint(null);
    setIsDrawing(false);
    renderScene();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "48px 16px 48px",
        boxSizing: "border-box",
        color: "#0f172a",
        fontFamily: "Pretendard, system-ui, sans-serif",
      }}
    >
      <style>{`
        @font-face {
          font-family: "FriendsZ";
          src: url("${friendsZFontUrl}") format("truetype");
          font-display: swap;
        }

        .motion-drawing-title {
          font-size: clamp(40px, 7vw, 80px);
        }

        @media (max-width: 767px) {
          .motion-drawing-title {
            font-size: clamp(56px, 15vw, 88px);
          }
        }
      `}</style>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              className="motion-drawing-title"
              style={{
                fontFamily: "FriendsZ, Pretendard, system-ui, sans-serif",
                lineHeight: 1,
                letterSpacing: 0,
              }}
            >
              motion drawing
            </div>
            <div
              style={{
                marginTop: "12px",
                color: "#64748b",
                fontSize: "9px",
                lineHeight: 1.5,
              }}
            >
              엄지와 검지를 오므리면 선이 이어지고, 손을 떼면 멈춰요.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`색상 ${color}`}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: "22px",
                    height: "22px",
                    padding: 0,
                    borderRadius: "999px",
                    border:
                      selectedColor === color
                        ? `2px solid ${getPaletteBorderColor(color)}`
                        : "2px solid rgba(255, 255, 255, 0.72)",
                    backgroundColor: color,
                    boxShadow:
                      selectedColor === color
                        ? `0 0 0 3px ${getPaletteBorderColor(color)}33, 0 6px 14px rgba(15, 23, 42, 0.2)`
                        : "0 3px 10px rgba(15, 23, 42, 0.14)",
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleClearCanvas}
              style={{
                height: "38px",
                padding: "0 14px",
                border: 0,
                borderRadius: "999px",
                backgroundColor: "#111827",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {statusText ? (
          <div
            style={{
              marginBottom: "14px",
              borderRadius: "12px",
              backgroundColor: errorMessage ? "#fef2f2" : "#ffffff",
              color: errorMessage ? "#b91c1c" : "#475569",
              padding: "12px 14px",
              fontSize: "14px",
            }}
          >
            {statusText}
          </div>
        ) : null}

        <div
          ref={stageRef}
          style={{
            position: "relative",
            width: "100%",
          }}
        >
          <div
            ref={viewportRef}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio,
              overflow: "hidden",
              borderRadius: "8px",
              backgroundColor: "#0f172a",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />
          </div>
          <div
            style={{
              height: `${DROP_ZONE_HEIGHT}px`,
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          />
          {indicatorPoint ? (
            <div
              style={{
                position: "absolute",
                left: indicatorPoint.x,
                top: indicatorPoint.y,
                width: "14px",
                height: "14px",
                borderRadius: "999px",
                backgroundColor: isDrawing ? selectedColor : "#ffffff",
                border: "2px solid #f8fafc",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.24)",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
          ) : null}
          {isDrawing ? (
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                padding: "6px 10px",
                borderRadius: "999px",
                backgroundColor: "rgba(15, 23, 42, 0.78)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                pointerEvents: "none",
              }}
            >
              Drawing...
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MotionDrawingPage;
