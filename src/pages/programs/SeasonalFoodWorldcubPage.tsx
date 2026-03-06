import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ingredientDb from "@/assets/seasonalFood/ingredient_db.json";

const DEPLOY_BASE_URL = "https://songtak.github.io/happy-lazy-corner";
const INGREDIENT_IMAGE_PATH = "/sfimg";

type IngredientItem = {
  id: number;
  name: string;
  months: number[];
  imgUrl?: string;
  description?: string;
  foods?: string[];
};

/** 제철 음식 추천기 */
const SeasonalFoodPage = () => {
  const navigate = useNavigate();
  const [selectedRound, setSelectedRound] = useState<string>("32");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(new Date().getMonth() + 1),
  );
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] =
    useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [hoveredMonthOption, setHoveredMonthOption] = useState<string | null>(
    null,
  );
  const [isStartHovered, setIsStartHovered] = useState<boolean>(false);
  const [isStartPressed, setIsStartPressed] = useState<boolean>(false);
  const [roundPool, setRoundPool] = useState<IngredientItem[]>([]);
  const [winners, setWinners] = useState<IngredientItem[]>([]);
  const [battleIndex, setBattleIndex] = useState<number>(0);
  const [pickedItemId, setPickedItemId] = useState<number | null>(null);
  const [currentRoundLabel, setCurrentRoundLabel] = useState<string>("");
  const [champion, setChampion] = useState<IngredientItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const monthDropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const pickTimeoutRef = useRef<number | null>(null);
  const monthCopy = `나의 월별 제철 음식 원픽은?`;

  const roundOptions = [
    { value: "32", label: "32강" },
    { value: "16", label: "16강" },
    { value: "8", label: "8강" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMonthDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pickTimeoutRef.current) {
        window.clearTimeout(pickTimeoutRef.current);
      }
    };
  }, []);

  const getShuffledIngredients = (ingredients: IngredientItem[]) => {
    const cloned = [...ingredients];
    for (let i = cloned.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
    }
    return cloned;
  };

  const getTournamentSize = (requestedSize: number, availableCount: number) => {
    const maxSize = Math.min(requestedSize, availableCount);
    if (maxSize < 2) return 0;
    return 2 ** Math.floor(Math.log2(maxSize));
  };

  const getRoundTone = (roundSize: number) => {
    if (roundSize >= 32) {
      return { bg: "#ecfeff", border: "#67e8f9", text: "#155e75" };
    }
    if (roundSize >= 16) {
      return { bg: "#eef2ff", border: "#a5b4fc", text: "#3730a3" };
    }
    if (roundSize >= 8) {
      return { bg: "#fff7ed", border: "#fdba74", text: "#9a3412" };
    }
    if (roundSize >= 4) {
      return { bg: "#fff1f2", border: "#fda4af", text: "#9f1239" };
    }
    return { bg: "#fef2f2", border: "#f87171", text: "#991b1b" };
  };

  const resetTournament = () => {
    if (pickTimeoutRef.current) {
      window.clearTimeout(pickTimeoutRef.current);
    }
    setRoundPool([]);
    setWinners([]);
    setBattleIndex(0);
    setPickedItemId(null);
    setCurrentRoundLabel("");
    setChampion(null);
    setErrorMessage("");
  };

  const handleStart = () => {
    const roundSize = Number(selectedRound);
    const monthNumber = Number(selectedMonth);
    const monthlyIngredients = (ingredientDb as IngredientItem[]).filter(
      (item) => item.months.includes(monthNumber),
    );

    const tournamentSize = getTournamentSize(
      roundSize,
      monthlyIngredients.length,
    );
    if (tournamentSize < 2) {
      setErrorMessage(
        `${selectedMonth}월 재료가 부족해서 월드컵을 시작할 수 없어요.`,
      );
      return;
    }

    const randomPick = getShuffledIngredients(monthlyIngredients).slice(
      0,
      tournamentSize,
    );

    setRoundPool(randomPick);
    setWinners([]);
    setBattleIndex(0);
    setPickedItemId(null);
    setCurrentRoundLabel(`${randomPick.length}강`);
    setChampion(null);
    setErrorMessage("");
  };

  const proceedWinner = (winner: IngredientItem) => {
    const nextWinners = [...winners, winner];
    const nextIndex = battleIndex + 2;

    if (nextIndex >= roundPool.length) {
      if (nextWinners.length === 1) {
        setChampion(nextWinners[0]);
        setPickedItemId(null);
        return;
      }

      setRoundPool(nextWinners);
      setWinners([]);
      setBattleIndex(0);
      setPickedItemId(null);
      setCurrentRoundLabel(`${nextWinners.length}강`);
      return;
    }

    setWinners(nextWinners);
    setBattleIndex(nextIndex);
    setPickedItemId(null);
  };

  const handlePickWinner = (winner: IngredientItem) => {
    if (pickedItemId !== null) return;
    setPickedItemId(winner.id);
    pickTimeoutRef.current = window.setTimeout(() => {
      proceedWinner(winner);
    }, 220);
  };

  const handleClickFindNearbyRestaurants = () => {
    if (!champion) return;
    const query = encodeURIComponent(`${champion.name} 맛집`);
    window.open(`https://map.naver.com/p/search/${query}`, "_blank");
  };

  const handleClickInstagramSearch = (food: string) => {
    const query = encodeURIComponent(food);
    window.open(
      `https://search.naver.com/search.naver?query=${query}`,
      "_blank",
    );
  };

  const handleBack = () => {
    if (roundPool.length > 0 || champion) {
      resetTournament();
      return;
    }
    navigate("/seasonal-food");
  };

  const getAbsoluteUrl = (path: string) =>
    `${DEPLOY_BASE_URL}/${path.replace(/^\/+/, "")}`;

  const getIngredientImageUrl = (item: IngredientItem) => {
    if (item.imgUrl) {
      if (
        item.imgUrl.startsWith("http://") ||
        item.imgUrl.startsWith("https://")
      ) {
        return item.imgUrl;
      }
      return getAbsoluteUrl(item.imgUrl);
    }
    return getAbsoluteUrl(
      `${INGREDIENT_IMAGE_PATH}/${encodeURIComponent(item.name)}.png`,
    );
  };

  const leftItem = roundPool[battleIndex];
  const rightItem = roundPool[battleIndex + 1];
  const currentMatch = Math.floor(battleIndex / 2) + 1;
  const totalMatches = Math.max(1, Math.floor(roundPool.length / 2));
  const roundTone = getRoundTone(roundPool.length);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "60vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "GMedium",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.08)",
          padding: "28px 20px",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          aria-label="뒤로가기"
          style={{
            position: "absolute",
            left: "16px",
            top: "16px",
            width: "32px",
            height: "32px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "black",
          }}
        >
          <ArrowLeft size={22} />
        </button>
        <div style={{ paddingTop: "18px" }}>
          <h1
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: "30px",
              color: "#1f2937",
            }}
          >
            제철 음식 월드컵
          </h1>
          <div
            style={{
              marginTop: "8px",
              marginBottom: "8px",
              fontSize: "18px",
              color: "#475569",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            {monthCopy}
          </div>

          {roundPool.length === 0 && !champion && (
            <>
              <div style={{ marginTop: "28px" }}>
                <div
                  style={{
                    marginBottom: "8px",
                    fontSize: "14px",
                    color: "#4b5563",
                  }}
                >
                  월 선택
                </div>
                <div
                  style={{ position: "relative", marginBottom: "12px" }}
                  ref={monthDropdownRef}
                >
                  <button
                    type="button"
                    onClick={() => setIsMonthDropdownOpen((prev) => !prev)}
                    style={{
                      width: "100%",
                      height: "52px",
                      borderRadius: "12px",
                      border: isMonthDropdownOpen
                        ? "1px solid #16a34a"
                        : "1px solid #d1d5db",
                      padding: "0 44px 0 14px",
                      fontSize: "16px",
                      fontFamily: "GMedium",
                      textAlign: "left",
                      color: "#374151",
                      backgroundColor: "#f9fafb",
                      cursor: "pointer",
                      boxShadow: isMonthDropdownOpen
                        ? "0 0 0 4px rgba(22, 163, 74, 0.15)"
                        : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {selectedMonth}월
                  </button>

                  {isMonthDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        zIndex: 10,
                        top: "56px",
                        left: 0,
                        right: 0,
                        backgroundColor: "#ffffff",
                        border: "1px solid #d1d5db",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 12px 24px rgba(0, 0, 0, 0.12)",
                        maxHeight: "220px",
                        overflowY: "auto",
                      }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (month) => {
                          const monthValue = String(month);
                          return (
                            <button
                              key={monthValue}
                              type="button"
                              onClick={() => {
                                setSelectedMonth(monthValue);
                                setIsMonthDropdownOpen(false);
                              }}
                              onMouseEnter={() =>
                                setHoveredMonthOption(monthValue)
                              }
                              onMouseLeave={() => setHoveredMonthOption(null)}
                              style={{
                                width: "100%",
                                height: "44px",
                                border: "none",
                                borderBottom:
                                  month !== 12 ? "1px solid #f3f4f6" : "none",
                                textAlign: "left",
                                padding: "0 14px",
                                fontSize: "15px",
                                cursor: "pointer",
                                backgroundColor:
                                  monthValue === selectedMonth
                                    ? "#ecfdf3"
                                    : hoveredMonthOption === monthValue
                                      ? "#f3f4f6"
                                      : "#ffffff",
                                color:
                                  monthValue === selectedMonth
                                    ? "#166534"
                                    : "#374151",
                              }}
                            >
                              {month}월
                            </button>
                          );
                        },
                      )}
                    </div>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: isMonthDropdownOpen
                        ? "translateY(-50%) rotate(180deg)"
                        : "translateY(-50%)",
                      color: "#6b7280",
                      fontSize: "13px",
                      pointerEvents: "none",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    ▼
                  </span>
                </div>
                <div
                  style={{
                    marginBottom: "8px",
                    fontSize: "14px",
                    color: "#4b5563",
                  }}
                >
                  라운드 선택
                </div>
                <div style={{ position: "relative" }} ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                    style={{
                      width: "100%",
                      height: "52px",
                      borderRadius: "12px",
                      border: isDropdownOpen
                        ? "1px solid #16a34a"
                        : "1px solid #d1d5db",
                      padding: "0 44px 0 14px",
                      fontSize: "16px",
                      fontFamily: "GMedium",
                      textAlign: "left",
                      color: "#374151",
                      backgroundColor: "#f9fafb",
                      cursor: "pointer",
                      boxShadow: isDropdownOpen
                        ? "0 0 0 4px rgba(22, 163, 74, 0.15)"
                        : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {selectedRound}강
                  </button>

                  {isDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        zIndex: 10,
                        top: "56px",
                        left: 0,
                        right: 0,
                        backgroundColor: "#ffffff",
                        border: "1px solid #d1d5db",
                        borderRadius: "12px",
                        overflow: "hidden",
                        boxShadow: "0 12px 24px rgba(0, 0, 0, 0.12)",
                      }}
                    >
                      {roundOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSelectedRound(option.value);
                            setIsDropdownOpen(false);
                          }}
                          onMouseEnter={() => setHoveredOption(option.value)}
                          onMouseLeave={() => setHoveredOption(null)}
                          style={{
                            width: "100%",
                            height: "44px",
                            border: "none",
                            borderBottom:
                              option.value !==
                              roundOptions[roundOptions.length - 1].value
                                ? "1px solid #f3f4f6"
                                : "none",
                            textAlign: "left",
                            padding: "0 14px",
                            fontSize: "15px",
                            cursor: "pointer",
                            backgroundColor:
                              option.value === selectedRound
                                ? "#ecfdf3"
                                : hoveredOption === option.value
                                  ? "#f3f4f6"
                                  : "#ffffff",
                            color:
                              option.value === selectedRound
                                ? "#166534"
                                : "#374151",
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <span
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: isDropdownOpen
                        ? "translateY(-50%) rotate(180deg)"
                        : "translateY(-50%)",
                      color: "#6b7280",
                      fontSize: "13px",
                      pointerEvents: "none",
                      transition: "transform 0.2s ease",
                    }}
                  >
                    ▼
                  </span>
                </div>
              </div>

              <button
                onClick={handleStart}
                onMouseEnter={() => setIsStartHovered(true)}
                onMouseLeave={() => {
                  setIsStartHovered(false);
                  setIsStartPressed(false);
                }}
                onMouseDown={() => setIsStartPressed(true)}
                onMouseUp={() => setIsStartPressed(false)}
                style={{
                  width: "100%",
                  marginTop: "14px",
                  height: "52px",
                  borderRadius: "14px",
                  border: "1px solid rgba(30, 41, 59, 0.55)",
                  background:
                    "linear-gradient(135deg, #334155 0%, #1f2937 55%, #0f172a 100%)",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: 700,
                  letterSpacing: "0.3px",
                  cursor: "pointer",
                  boxShadow: isStartHovered
                    ? "0 12px 20px rgba(15, 23, 42, 0.30)"
                    : "0 8px 14px rgba(15, 23, 42, 0.20)",
                  transform: isStartPressed
                    ? "translateY(1px) scale(0.995)"
                    : isStartHovered
                      ? "translateY(-1px)"
                      : "translateY(0)",
                  transition: "all 0.18s ease",
                }}
              >
                시작
              </button>
              {!!errorMessage && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    backgroundColor: "#fff1f2",
                    color: "#9f1239",
                    fontSize: "13px",
                  }}
                >
                  {errorMessage}
                </div>
              )}
            </>
          )}

          {roundPool.length > 0 && !champion && leftItem && rightItem && (
            <div style={{ marginTop: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: roundTone.text,
                    backgroundColor: roundTone.bg,
                    border: `1px solid ${roundTone.border}`,
                    borderRadius: "999px",
                    padding: "4px 10px",
                  }}
                >
                  {currentRoundLabel}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: roundTone.text,
                    backgroundColor: roundTone.bg,
                    border: `1px solid ${roundTone.border}`,
                    borderRadius: "999px",
                    padding: "4px 10px",
                  }}
                >
                  {currentMatch} / {totalMatches}
                </span>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                {[leftItem, rightItem].map((item) => {
                  const imageUrl = getIngredientImageUrl(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePickWinner(item)}
                      disabled={pickedItemId !== null}
                      style={{
                        flex: 1,
                        border:
                          pickedItemId === item.id
                            ? "1px solid #22c55e"
                            : "1px solid #dbe2ea",
                        backgroundColor: "#ffffff",
                        borderRadius: "14px",
                        padding: "0",
                        overflow: "hidden",
                        cursor: pickedItemId !== null ? "default" : "pointer",
                        transform:
                          pickedItemId === item.id
                            ? "scale(1.03)"
                            : pickedItemId !== null
                              ? "scale(0.97)"
                              : "scale(1)",
                        opacity:
                          pickedItemId !== null && pickedItemId !== item.id
                            ? 0.45
                            : 1,
                        boxShadow:
                          pickedItemId === item.id
                            ? "0 14px 28px rgba(34, 197, 94, 0.35)"
                            : "none",
                        transition: "all 0.22s ease",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          height: "200px",
                          backgroundColor: "#e2e8f0",
                          backgroundImage: imageUrl
                            ? `url(${imageUrl})`
                            : "none",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#1e293b",
                          fontSize: "14px",
                        }}
                      >
                        {pickedItemId === item.id && (
                          <div
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              padding: "4px 8px",
                              borderRadius: "999px",
                              backgroundColor: "rgba(22, 163, 74, 0.92)",
                              color: "#ffffff",
                              fontSize: "12px",
                              fontWeight: 700,
                            }}
                          >
                            선택!
                          </div>
                        )}
                        {!imageUrl && "imgUrl 준비중"}
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          fontSize: "20px",
                          color: "#0f172a",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        {item.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {champion && (
            <div style={{ marginTop: "20px" }}>
              {(() => {
                const championImageUrl = getIngredientImageUrl(champion);
                return (
                  <>
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "16px",
                        color: "#475569",
                        marginBottom: "10px",
                      }}
                    >
                      최종 우승
                    </div>
                    <div
                      style={{
                        border: "1px solid #dbe2ea",
                        borderRadius: "14px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "220px",
                          backgroundColor: "#e2e8f0",
                          backgroundImage: championImageUrl
                            ? `url(${championImageUrl})`
                            : "none",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#1e293b",
                          fontSize: "14px",
                        }}
                      >
                        {!championImageUrl && "imgUrl 준비중"}
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          fontSize: "22px",
                          color: "#0f172a",
                          fontWeight: 700,
                          textAlign: "center",
                        }}
                      >
                        {champion.name}
                      </div>
                      {!!champion.description && (
                        <div
                          style={{
                            padding: "0 14px 10px 14px",
                            fontSize: "14px",
                            color: "#475569",
                            lineHeight: 1.5,
                            textAlign: "center",
                          }}
                        >
                          {champion.description}
                        </div>
                      )}
                      {!!champion.foods?.length && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "0 14px 14px 14px",
                            display: "flex",
                            flexWrap: "wrap",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          {champion.foods.map((food) => (
                            <button
                              key={food}
                              type="button"
                              onClick={() => handleClickInstagramSearch(food)}
                              style={{
                                fontSize: "11px",
                                color: "#0c4a6e",
                                backgroundColor: "#e0f2fe",
                                borderRadius: "999px",
                                padding: "3px 7px",
                                fontWeight: 700,
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              #{food}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleClickFindNearbyRestaurants}
                      style={{
                        width: "100%",
                        marginTop: "10px",
                        height: "48px",
                        borderRadius: "12px",
                        border: "1px solid #bae6fd",
                        backgroundColor: "#f0f9ff",
                        color: "#0c4a6e",
                        fontSize: "15px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      주변 맛집 찾아보기 👀
                    </button>
                    <button
                      type="button"
                      onClick={resetTournament}
                      style={{
                        width: "100%",
                        marginTop: "12px",
                        marginBottom: "40px",
                        height: "48px",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        color: "#0f172a",
                        fontSize: "15px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      다시 하기
                    </button>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeasonalFoodPage;
