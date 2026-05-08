import React, { useEffect, useRef, useState } from "react";
import ReactGA from "react-ga4";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { sunrise_result } from "@/assets/sunrise_coords";

const NCLOUD_CLIENT_ID = "4he4o3zf4v"; // provided by user
// const NCLOUD_CLIENT_SECRET = "EwP64krczmUPTdvp8rgvT3drQ5mF03ABrI7Hmiby";

const loadNaverMaps = (clientId: string) => {
  return new Promise<void>((resolve, reject) => {
    // @ts-ignore
    if (window.naver && window.naver.maps) {
      resolve();
      return;
    }

    // ✅ 이미 maps.js가 있으면(누가 넣었든) 새로 append 하지 말고 load만 기다림
    const existing = Array.from(document.getElementsByTagName("script")).find(
      (s) => s.src.includes("oapi.map.naver.com/openapi/v3/maps.js"),
    ) as HTMLScriptElement | undefined;

    if (existing) {
      // 이미 로딩 끝난 상태면 바로 resolve
      // @ts-ignore
      if (window.naver && window.naver.maps) {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", (e) => reject(e as any), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(
      clientId,
    )}&submodules=geocoder`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

// const loadNaverMaps = (clientId: string) => {
//   return new Promise<void>((resolve, reject) => {
//     // @ts-ignore
//     if (window.naver && window.naver.maps) {
//       resolve();
//       return;
//     }

//     // ✅ 이미 maps.js가 있으면(누가 넣었든) 새로 넣지 말고 load만 기다림
//     const existing = Array.from(document.getElementsByTagName("script")).find(
//       (s) => s.src.includes("openapi.map.naver.com/openapi/v3/maps.js")
//     ) as HTMLScriptElement | undefined;

//     if (existing) {
//       // 이미 로드 완료된 경우
//       // @ts-ignore
//       if (window.naver && window.naver.maps) {
//         resolve();
//         return;
//       }

//       existing.addEventListener("load", () => resolve(), { once: true });
//       existing.addEventListener("error", (e) => reject(e as any), {
//         once: true,
//       });
//       return;
//     }

//     const script = document.createElement("script");
//     script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${encodeURIComponent(
//       clientId
//     )}`;
//     script.async = true;
//     script.onload = () => resolve();
//     script.onerror = (e) => reject(e);
//     document.head.appendChild(script);
//   });
// };

const SUNRISE_LOCATION_SUFFIX_PATTERN =
  /(특별시|광역시|특별자치시|특별자치도|자치시|자치도|시|군|구)$/g;

const normalizeRegionName = (value?: string) =>
  value?.replace(SUNRISE_LOCATION_SUFFIX_PATTERN, "").trim() ?? "";

const buildSunriseLocationCandidates = (payload: {
  area1?: string;
  area2?: string;
  area3?: string;
}) => {
  const area1 = payload.area1?.trim() ?? "";
  const area2 = payload.area2?.trim() ?? "";
  const area3 = payload.area3?.trim() ?? "";

  const area1Base = normalizeRegionName(area1);
  const area2Base = normalizeRegionName(area2);
  const area3Base = normalizeRegionName(area3);

  return [
    `${area2}${area3}`,
    `${area1Base}${area2Base}${area3Base}`,
    `${area1Base}${area2Base}`,
    area1Base,
    area2Base,
    area2,
    area3,
    area3Base,
  ].filter(
    (value, index, list) => Boolean(value) && list.indexOf(value) === index,
  );
};

const findSunriseLocation = (payload: {
  area1?: string;
  area2?: string;
  area3?: string;
}) => {
  const candidates = buildSunriseLocationCandidates(payload);
  const availableLocations = sunrise_result.map((item) => item.location);

  for (const candidate of candidates) {
    const exactMatch = availableLocations.find(
      (location) => location === candidate,
    );
    if (exactMatch) {
      return exactMatch;
    }
  }

  for (const candidate of candidates) {
    const partialMatch = availableLocations.find(
      (location) =>
        location.includes(candidate) || candidate.includes(location),
    );

    if (partialMatch) {
      return partialMatch;
    }
  }

  return null;
};

const formatCoordinate = (value: number) => value.toFixed(6);

const BLACK_MARKER_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000000'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z'/%3E%3C/svg%3E";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatTime = (raw?: string) => {
  if (!raw) return "-";
  const s = String(raw).trim();
  if (/:/.test(s)) {
    const parts = s.split(":").map((p) => p.padStart(2, "0"));
    return `${parts[0].slice(-2)}:${parts[1].slice(0, 2)}`;
  }

  const digits = s.replace(/\D/g, "");
  if (!digits) return s;
  const hhmm = digits.length >= 4 ? digits.slice(-4) : digits.padStart(4, "0");
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2)}`;
};

const SunriseSunsetPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [locDate, setLocDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  });

  const [debugOrigin, setDebugOrigin] = useState<string>("");
  const [debugHref, setDebugHref] = useState<string>("");
  const [debugReferrer, setDebugReferrer] = useState<string>("");
  const [naverLoadedFlag, setNaverLoadedFlag] = useState<boolean>(false);
  const [isIntroComplete, setIsIntroComplete] = useState<boolean>(false);
  // keep a ref of the selected date so closures (marker handlers) always read latest value
  const locDateRef = React.useRef<string>(locDate);
  const mapInstanceRef = React.useRef<any>(null);
  const infoWindowRef = React.useRef<any>(null);
  const activeMarkerRef = React.useRef<any>(null);
  const activeLocationRef = React.useRef<string | null>(null);
  const clickedMarkerRef = React.useRef<any>(null);

  React.useEffect(() => {
    locDateRef.current = locDate;
  }, [locDate]);

  useEffect(() => {
    const titleTimer = window.setTimeout(() => {
      setIsIntroComplete(true);
    }, 1700);

    return () => {
      window.clearTimeout(titleTimer);
    };
  }, []);

  // Refined Apple-like InfoWindow HTML template using Naver InfoWindow options
  const appleTemplate = (
    title: string,
    subtitle: string,
    innerHtml: string,
  ) => {
    const titleStyle =
      "font-weight:600; font-size:14px; margin-bottom:4px; color:#1c1c1e; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; text-align:center;";
    const subtitleStyle =
      "font-size:12px; color:#6e6e73; margin-bottom:8px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; text-align:center;";
    const bodyStyle =
      "font-size:13px; line-height:1.5; color:#1c1c1e; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto; overflow-wrap:break-word; text-align:center;";

    return `
        <div style="padding:12px 14px; min-width:180px; max-width:300px; display:flex; flex-direction:column; align-items:center;">
          <div style="${titleStyle}">${escapeHtml(title)}</div>
          ${subtitle ? `<div style="${subtitleStyle}">${escapeHtml(subtitle)}</div>` : ""}
          <div style="${bodyStyle}">${innerHtml}</div>
        </div>
      `;
  };

  // calculate time difference: returns formatted string like "-02:30" or "+01:45" with light gray style
  const getTimeDifference = (timeStr: string) => {
    if (!timeStr) return "";
    try {
      const now = new Date();
      const [hours, mins] = formatTime(timeStr).split(":").map(Number);

      const nowHours = now.getHours();
      const nowMins = now.getMinutes();

      // convert to minutes for easier calculation
      const targetTotalMins = hours * 60 + mins;
      const nowTotalMins = nowHours * 60 + nowMins;
      const diffMins = targetTotalMins - nowTotalMins;

      const sign = diffMins >= 0 ? "-" : "+";
      const absDiff = Math.abs(diffMins);
      const diffHours = Math.floor(absDiff / 60);
      const diffMinsRemainder = absDiff % 60;

      const timeStr_ = `${sign}${String(diffHours).padStart(2, "0")}:${String(
        diffMinsRemainder,
      ).padStart(2, "0")}`;
      return `<span style="color:#a0a0a6; font-size:12px; margin-left:8px;">${timeStr_}</span>`;
    } catch (e) {
      return "";
    }
  };

  // 날짜 선택 함수: getDateOffsetRelative는 기준 날짜 문자열(YYYYMMDD)으로부터 offset일을 계산합니다.
  const getDateOffset = (days: number, base?: string): string => {
    const d =
      base && base.length === 8
        ? new Date(
            Number(base.slice(0, 4)),
            Number(base.slice(4, 6)) - 1,
            Number(base.slice(6, 8)),
          )
        : new Date();
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  };

  // offset은 현재 선택된 날짜(locDate)를 기준으로 적용됩니다.
  const handleDateChange = (offset: number) => {
    const newDate = getDateOffset(offset, locDate);

    console.log("handleDateChange_newDate", newDate);

    setLocDate(newDate);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;

    const y = Number(dateStr.slice(0, 4));
    const m = Number(dateStr.slice(4, 6));
    const d = Number(dateStr.slice(6, 8));

    const date = new Date(y, m - 1, d);

    // 일/월/화/수/목/금/토
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];

    // 01월 02일 (수)
    const mm = String(m).padStart(2, "0");
    const dd = String(d).padStart(2, "0");

    return `${mm}월 ${dd}일 (${weekday})`;
  };

  const canGoNext = () => {
    const currentDateNum = parseInt(locDate);
    const maxDate = parseInt(getDateOffset(7));
    return currentDateNum < maxDate;
  };

  /** 송탁 버튼 클릭 */
  const handleClickSongtak = () => {
    ReactGA.event("송탁_버튼_클릭", {
      category: "songtak_button_click",
      action: "송탁 버튼 클릭",
    });

    window.location.href = "https://instagram.com/sn9tk";
  };
  useEffect(() => {
    let mapInstance: any = null;
    let infoWindow: any = null;
    let mapClickListener: any = null;

    // populate debug info early
    try {
      setDebugOrigin(window.location.origin || "");
      setDebugHref(window.location.href || "");
      setDebugReferrer(document.referrer || "");
    } catch (e) {
      /* ignore */
    }

    loadNaverMaps(NCLOUD_CLIENT_ID)
      .then(() => {
        setNaverLoadedFlag(true);
        // @ts-ignore
        const naver = window.naver;
        if (!naver || !naver.maps) {
          setError("Naver Maps SDK 로드에 실패했습니다.");
          return;
        }

        // default center: Seoul City Hall
        const defaultCenter = new naver.maps.LatLng(37.5665, 126.978);

        const initMap = (centerLatLng: any, isUser = false) => {
          // Prefer the ref DOM node, fall back to the element id
          const mapDiv =
            mapRef.current && mapRef.current instanceof HTMLElement
              ? (mapRef.current as HTMLElement)
              : document.getElementById("naver-map");

          if (!mapDiv) {
            setError(
              "지도 요소가 준비되지 않았습니다. 페이지를 새로고침해 주세요.",
            );
            return;
          }

          try {
            mapInstance = new naver.maps.Map(mapDiv as any, {
              center: centerLatLng,
              zoom: 12,
              mapTypeControl: true,
            });
            mapInstanceRef.current = mapInstance;
            // close tooltip when clicking blank map area
            mapClickListener = naver.maps.Event.addListener(
              mapInstance,
              "click",
              () => {
                if (infoWindowRef.current) {
                  infoWindowRef.current.close();
                }
                activeMarkerRef.current = null;
                activeLocationRef.current = null;
              },
            );

            naver.maps.Event.addListener(
              mapInstance,
              "click",
              async (event: any) => {
                const clickedLat = event?.coord?.lat;
                const clickedLng = event?.coord?.lng;

                if (
                  typeof clickedLat !== "number" ||
                  typeof clickedLng !== "number"
                ) {
                  return;
                }

                try {
                  const reverseGeocode = await reverseGeocodePoint(
                    clickedLat,
                    clickedLng,
                  );
                  const matchedLocation = findSunriseLocation(reverseGeocode);

                  if (clickedMarkerRef.current) {
                    clickedMarkerRef.current.setMap(null);
                  }

                  const clickedMarker = new naver.maps.Marker({
                    position: new naver.maps.LatLng(clickedLat, clickedLng),
                    map: mapInstance,
                    title: reverseGeocode.address || "선택한 지점",
                  });
                  clickedMarkerRef.current = clickedMarker;

                  activeMarkerRef.current = clickedMarker;
                  activeLocationRef.current = matchedLocation;

                  const extraLines = [
                    `위도: ${formatCoordinate(clickedLat)}`,
                    `경도: ${formatCoordinate(clickedLng)}`,
                  ];

                  if (reverseGeocode.address) {
                    extraLines.unshift(`주소: ${reverseGeocode.address}`);
                  } else {
                    extraLines.unshift("주소를 찾는 중...");
                  }

                  if (
                    matchedLocation &&
                    matchedLocation !== reverseGeocode.address
                  ) {
                    extraLines.push(`조회 기준 지역: ${matchedLocation}`);
                  } else if (!matchedLocation) {
                    extraLines.push(
                      "조회 기준 지역을 찾지 못해 주소 정보만 표시했어요.",
                    );
                  }

                  await openInfoWindowForPoint(clickedMarker, {
                    title: reverseGeocode.address || "선택한 지점",
                    subtitle: matchedLocation ? matchedLocation : "클릭한 좌표",
                    locationForQuery: matchedLocation,
                    extraHtml: extraLines
                      .map(
                        (line) =>
                          `<div style="color:#1c1c1e; margin-bottom:3px;">${escapeHtml(
                            line,
                          )}</div>`,
                      )
                      .join(""),
                  });
                } catch (err) {
                  console.warn("지도 클릭 지점 역지오코딩 실패", err);
                }
              },
            );
          } catch (e) {
            console.error("naver.maps.Map 생성 실패", e);
            setError(
              "지도 초기화에 실패했습니다. (인증 실패 또는 SDK 로드 문제). 네이버 클라우드의 허용 출처(Referer)를 확인하세요.",
            );
            return;
          }

          // add a marker for the center (user or default)
          try {
            new naver.maps.Marker({
              position: centerLatLng,
              map: mapInstance,
              title: isUser ? "내 위치" : "기본 위치 (서울)",
              icon: new naver.maps.MarkerImage(
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e74c3c'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z'/%3E%3C/svg%3E",
                new naver.maps.Size(24, 24),
                { anchor: new naver.maps.Point(12, 12) },
              ),
            });
          } catch (e) {
            console.warn("Failed to add center marker", e);
          }

          // add markers from sunrise_result
          try {
            // shared InfoWindow instance with Naver InfoWindow native options (like official example)
            infoWindow = new naver.maps.InfoWindow({
              content: appleTemplate(
                "정보",
                "",
                '<div style="color:#6e6e73">정보를 불러오는 중...</div>',
              ),
              backgroundColor: "#ffffff",
              borderColor: "#e0e0e0",
              borderWidth: 1,
              borderRadius: 12,
              anchorSize: new naver.maps.Size(25, 25),
              anchorSkew: true,
              anchorColor: "#ffffff",
              pixelOffset: new naver.maps.Point(0, -10),
              radius: 8,
            });
            infoWindowRef.current = infoWindow;

            sunrise_result.forEach((item) => {
              if (item.lat == null || item.lng == null) return;
              try {
                const marker = new naver.maps.Marker({
                  position: new naver.maps.LatLng(item.lat, item.lng),
                  map: mapInstance,
                  title: item.location,
                });

                // attach click handler to fetch rise/set info for the currently selected date and show in infoWindow
                naver.maps.Event.addListener(marker, "click", async () => {
                  try {
                    activeMarkerRef.current = marker;
                    activeLocationRef.current = item.location;
                    // show temporary loading content
                    const infoWindowLocal = infoWindowRef.current;
                    if (infoWindowLocal) {
                      infoWindowLocal.setContent(
                        appleTemplate(
                          "정보",
                          "",
                          '<div style="color:#6e6e73">정보를 불러오는 중...</div>',
                        ),
                      );
                      infoWindowLocal.open(mapInstanceRef.current, marker);
                    }

                    await openInfoWindowForPoint(marker, {
                      title: item.location,
                      //   subtitle: "일출/일몰 기준 지역",
                      locationForQuery: item.location,
                    });
                  } catch (err) {
                    console.error("Marker click 처리 중 오류", err);
                    if (infoWindowRef.current) {
                      infoWindowRef.current.setContent(
                        appleTemplate(
                          "오류",
                          "",
                          '<div style="color:#6e6e73">정보를 불러오지 못했습니다.</div>',
                        ),
                      );
                      infoWindowRef.current.open(
                        mapInstanceRef.current,
                        marker,
                      );
                    }
                  }
                });
              } catch (inner) {
                // continue adding other markers even if one fails
                console.warn("Marker 추가 실패", item.location, inner);
              }
            });
          } catch (e) {
            console.warn("Failed to add sunrise_result markers", e);
          }
        };

        // Try to use browser geolocation to set the map center
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const userCenter = new naver.maps.LatLng(
                pos.coords.latitude,
                pos.coords.longitude,
              );
              initMap(userCenter, true);
            },
            (err) => {
              console.warn(
                "Geolocation error, falling back to default center",
                err,
              );
              initMap(defaultCenter, false);
            },
            { enableHighAccuracy: true, timeout: 5000 },
          );
        } else {
          initMap(defaultCenter, false);
        }

        // Handle window resize to prevent map misalignment on mobile
        const handleResize = () => {
          try {
            if (mapInstance && mapInstance.updateSize) {
              mapInstance.updateSize();
            }
          } catch (e) {
            console.warn("Map resize failed", e);
          }
        };

        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
        };
      })
      .catch((e) => {
        console.error(e);
        setError("지도 로드 중 오류가 발생했습니다.");
      });

    return () => {
      // clean up if needed
      // @ts-ignore
      try {
        if (
          infoWindowRef.current &&
          typeof infoWindowRef.current.close === "function"
        )
          infoWindowRef.current.close();
        // remove map click listener if attached
        // @ts-ignore
        if (
          mapClickListener &&
          window.naver &&
          window.naver.maps &&
          window.naver.maps.Event
        ) {
          // @ts-ignore
          window.naver.maps.Event.removeListener(mapClickListener);
        }
      } catch (e) {
        /* ignore */
      }
      // @ts-ignore
      if (mapInstance && mapInstance.destroy) mapInstance.destroy();
    };
  }, []);

  // --- Public Data.go.kr Sunrise/Sunset API 호출 ---
  const SERVICE_KEY_ENCODED =
    "uE2Fljsvf2rPBpiUGBrvnx9BD8hRYKp18YS3GeagdnuhTgCE3DggKvsj46Wtk4D6dOXlsZzcKpCtrzojcFwEnQ==";

  // Parameterized fetch helper: returns parsed items for a given location and date
  const fetchRiseSetForLocation = async (
    location: string,
    locdate: string,
  ): Promise<Array<Record<string, string>> | null> => {
    console.log("locdate=-=-=-", locdate);

    try {
      const base =
        "https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService/getAreaRiseSetInfo";
      const params = new URLSearchParams({
        location,
        locdate,
        ServiceKey: SERVICE_KEY_ENCODED,
      });

      const url = `${base}?${params.toString()}`;
      // debug: show which locdate is used for the API call
      // eslint-disable-next-line no-console
      console.debug("fetchRiseSetForLocation ->", url);

      const res = await fetch(url);
      const text = await res.text();

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");
      const parsererror = xml.querySelector("parsererror");
      if (parsererror) {
        console.warn("응답 XML 파싱 실패", text.slice(0, 200));
        return null;
      }

      const items = Array.from(xml.querySelectorAll("item")).map((item) => {
        const obj: Record<string, string> = {};
        Array.from(item.children).forEach((c) => {
          obj[c.tagName] = c.textContent ?? "";
        });
        return obj;
      });

      if (items.length) return items;

      // fallback: if no <item>, return top-level children
      const rootObj: Record<string, string> = {};
      Array.from(xml.documentElement.children).forEach((c) => {
        rootObj[c.tagName] = c.textContent ?? "";
      });
      return [rootObj];
    } catch (e) {
      console.error("fetchRiseSetForLocation error", e);
      return null;
    }
  };

  const reverseGeocodePoint = (
    lat: number,
    lng: number,
  ): Promise<{
    address: string;
    area1?: string;
    area2?: string;
    area3?: string;
    area4?: string;
  }> =>
    new Promise((resolve, reject) => {
      const naver = window.naver;

      if (!naver?.maps?.Service) {
        reject(new Error("주소 변환 기능을 불러오지 못했어요."));
        return;
      }

      naver.maps.Service.reverseGeocode(
        {
          coords: `${lng},${lat}`,
          orders: "legalcode,admcode,addr,roadaddr",
        },
        (status: string, response: any) => {
          if (status !== naver.maps.Service.Status.OK) {
            reject(new Error("좌표의 주소를 찾지 못했어요."));
            return;
          }

          const firstV2Result = response?.v2?.results?.[0];
          const firstResultItem = response?.result?.items?.[0];
          const address =
            response?.v2?.address?.roadAddress ||
            response?.v2?.address?.jibunAddress ||
            firstResultItem?.address ||
            "";

          resolve({
            address,
            area1:
              firstV2Result?.region?.area1?.name ||
              firstResultItem?.addrdetail?.country,
            area2:
              firstV2Result?.region?.area2?.name ||
              firstResultItem?.addrdetail?.sigugun,
            area3:
              firstV2Result?.region?.area3?.name ||
              firstResultItem?.addrdetail?.dongmyun,
            area4: firstV2Result?.region?.area4?.name,
          });
        },
      );
    });

  const openInfoWindowForPoint = async (
    marker: any,
    options: {
      title: string;
      subtitle?: string;
      locationForQuery?: string | null;
      extraHtml?: string;
    },
  ) => {
    try {
      // read latest selected date from ref (updated by a small effect)
      const selectedLocDate = locDateRef.current || locDate;
      const mapInstance = mapInstanceRef.current;
      // @ts-ignore
      const naver = window.naver;
      if (!mapInstance || !naver || !naver.maps) return;

      // ensure infoWindow exists
      if (!infoWindowRef.current) {
        infoWindowRef.current = new naver.maps.InfoWindow({
          content: appleTemplate(
            "정보",
            "",
            '<div style="color:#6e6e73">정보를 불러오는 중...</div>',
          ),
          backgroundColor: "#ffffff",
          borderColor: "#e0e0e0",
          borderWidth: 1,
          borderRadius: 12,
          anchorSize: new naver.maps.Size(25, 25),
          anchorSkew: true,
          anchorColor: "#ffffff",
          pixelOffset: new naver.maps.Point(0, -10),
          radius: 8,
        });
      } else {
        infoWindowRef.current.setContent(
          appleTemplate(
            "정보",
            "",
            '<div style="color:#6e6e73">정보를 불러오는 중...</div>',
          ),
        );
      }
      infoWindowRef.current.open(mapInstance, marker);

      const items = options.locationForQuery
        ? await fetchRiseSetForLocation(
            options.locationForQuery,
            selectedLocDate,
          )
        : null;

      // build Apple-like content from returned items (use first item if exists)
      let bodyHtml = options.extraHtml || "";

      if (bodyHtml) {
        bodyHtml += `<div style="height:8px"></div>`;
      }

      if (items && items.length) {
        const first = items[0];
        const sunrise =
          first["sunrise"] ||
          first["sunriseTime"] ||
          first["srTime"] ||
          first["sunR"] ||
          first["suntime"] ||
          "";
        const sunset =
          first["sunset"] ||
          first["sunsetTime"] ||
          first["ssTime"] ||
          first["sunS"] ||
          "";

        if (sunrise || sunset) {
          bodyHtml += `<div style="color:#1c1c1e; margin-bottom:4px; display:flex; align-items:center;">일출 🌞  ${formatTime(sunrise)}${getTimeDifference(sunrise)}</div>`;
          bodyHtml += `<div style="color:#1c1c1e; display:flex; align-items:center;">일몰 🌚  ${formatTime(sunset)}${getTimeDifference(sunset)}</div>`;
        } else {
          const keys = Object.keys(first).slice(0, 6);
          keys.forEach((k) => {
            bodyHtml += `<div style="color:#1c1c1e; margin-bottom:3px"><strong style="font-weight:500; color:#1c1c1e">${k}</strong>: ${
              first[k] ?? ""
            }</div>`;
          });
        }
      } else {
        bodyHtml += `<div style="color:#6e6e73">데이터가 없습니다.</div>`;
      }

      const content = appleTemplate(
        options.title,
        options.subtitle || "",
        bodyHtml,
      );
      infoWindowRef.current.setContent(content);
      infoWindowRef.current.open(mapInstance, marker);
    } catch (err) {
      console.error("openInfoWindowForMarker error", err);
    }
  };

  // re-fetch tooltip data when date changes while a tooltip is open
  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !infoWindowRef.current ||
      !activeMarkerRef.current ||
      !activeLocationRef.current
    ) {
      return;
    }
    openInfoWindowForPoint(activeMarkerRef.current, {
      title: activeLocationRef.current,
      subtitle: "일출/일몰 기준 지역",
      locationForQuery: activeLocationRef.current,
    });
  }, [locDate]);

  const d = locDate || "";
  const formattedDate =
    d.length === 8
      ? `${d.slice(0, 4)}년 ${d.slice(4, 6)}월 ${d.slice(6, 8)}일`
      : d;

  return (
    <div
      className="result_main_content_sunrise"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isIntroComplete ? "flex-start" : "center",
        paddingTop: isIntroComplete ? "60px" : "0",
        transition: "padding-top 700ms ease",
        boxSizing: "border-box",
        paddingLeft: "16px",
        paddingRight: "16px",
        width: "100vw",
      }}
    >
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: isIntroComplete ? "24px" : "50%",
          transform: isIntroComplete
            ? "translateX(-50%) scale(0.34)"
            : "translate(-50%, -50%) scale(1)",
          transformOrigin: "center top",
          width: "100%",
          zIndex: 5,
          pointerEvents: "none",
          transition: "top 700ms ease, transform 700ms ease",
        }}
      >
        <h2
          style={{
            fontFamily: "LEDLIGHT, Pretendard, sans-serif",
            textAlign: "center",
            fontSize: "6em",
            fontWeight: 300,
            lineHeight: 0.9,
            textShadow: "0 0 0.8px currentColor, 0 0 0.8px currentColor",
            margin: 0,
            transition: "letter-spacing 700ms ease, opacity 700ms ease",
            letterSpacing: isIntroComplete ? "0.01em" : "0.04em",
            color: "#f28c28",
          }}
        >
          {isIntroComplete ? (
            "sunrise and sunset"
          ) : (
            <>
              sunrise
              <br />
              and
              <br />
              sunset
            </>
          )}
        </h2>
      </div>

      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1px",
          fontSize: "18px",
          opacity: isIntroComplete ? 1 : 0,
          transform: isIntroComplete ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 700ms ease, transform 700ms ease",
          pointerEvents: isIntroComplete ? "auto" : "none",
        }}
      >
        <button
          onClick={() => handleDateChange(-1)}
          disabled={locDate === getDateOffset(0)}
          style={{
            background: "none",
            border: "none",
            cursor: locDate === getDateOffset(0) ? "default" : "pointer",
            opacity: locDate === getDateOffset(0) ? 0.3 : 1,
            padding: 0,
            lineHeight: 1,
          }}
          aria-label="이전 날짜"
        >
          <ArrowLeft size={28} strokeWidth={2.25} />
        </button>

        <span style={{ minWidth: "140px", textAlign: "center" }}>
          {formatDateDisplay(locDate)}
        </span>

        <button
          onClick={() => handleDateChange(1)}
          disabled={!canGoNext()}
          style={{
            background: "none",
            border: "none",
            cursor: !canGoNext() ? "default" : "pointer",
            opacity: !canGoNext() ? 0.3 : 1,
            padding: 0,
            lineHeight: 1,
          }}
          aria-label="다음 날짜"
        >
          <ArrowRight size={28} strokeWidth={2.25} />
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          boxSizing: "border-box",
          opacity: isIntroComplete ? 1 : 0,
          transform: isIntroComplete ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 900ms ease 250ms, transform 900ms ease 250ms",
          pointerEvents: isIntroComplete ? "auto" : "none",
        }}
      >
        <div style={{ width: "100%", maxWidth: "100%" }}>
          <div
            ref={mapRef}
            id="naver-map"
            style={{
              width: "100%",
              height: "70vh",
              borderRadius: 8,
              overflow: "hidden",
            }}
          />

          <div
            style={{
              marginTop: 6,
              display: "flex",
              justifyContent: "flex-end",
              fontSize: 11,
              color: "rgba(0,0,0,0.55)",
            }}
          >
            한국천문연구원 제공
          </div>
        </div>
      </div>
    </div>
  );
};

export default SunriseSunsetPage;
