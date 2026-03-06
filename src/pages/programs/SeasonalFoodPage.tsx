import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import ingredientDb from "@/assets/seasonalFood/ingredient_db.json";

const DEPLOY_BASE_URL = "https://songtak.github.io/happy-lazy-corner";
const INGREDIENT_IMAGE_PATH = "/sfimg";
const SEASON_MONTH_MAP: Record<string, number[]> = {
  봄: [3, 4, 5],
  여름: [6, 7, 8],
  가을: [9, 10, 11],
  겨울: [12, 1, 2],
};

type IngredientItem = {
  id: number;
  name: string;
  months: number[];
  categoryId?: number;
  imgUrl?: string;
  description?: string;
  foods?: string[];
  coupangUrl?: string;
};

const SeasonalFoodPage = () => {
  const categoryOptions = [
    { id: 0, label: "전체" },
    { id: 1, label: "해산물" },
    { id: 2, label: "채소" },
    { id: 3, label: "과일" },
    { id: 4, label: "곡물" },
  ];

  const navigate = useNavigate();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const [monthlyVisibleCount, setMonthlyVisibleCount] = useState<number>(1);
  const [seasonVisibleCount, setSeasonVisibleCount] = useState<number>(5);
  const [expandedIngredientId, setExpandedIngredientId] = useState<
    number | null
  >(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [clickedCardId, setClickedCardId] = useState<number | null>(null);
  const [isMonthlyMoreAnimating, setIsMonthlyMoreAnimating] =
    useState<boolean>(false);
  const [isSeasonMoreAnimating, setIsSeasonMoreAnimating] =
    useState<boolean>(false);
  const cardClickTimerRef = useRef<number | null>(null);
  const monthlyMoreTimerRef = useRef<number | null>(null);
  const seasonMoreTimerRef = useRef<number | null>(null);

  const monthlyIngredients = useMemo(() => {
    return (ingredientDb as IngredientItem[])
      .filter((item) => item.months.includes(currentMonth))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [currentMonth]);

  const shuffledMonthlyIngredients = useMemo(() => {
    const shuffled = [...monthlyIngredients];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [monthlyIngredients]);

  const visibleMonthlyIngredients = shuffledMonthlyIngredients.slice(
    0,
    Math.min(monthlyVisibleCount, shuffledMonthlyIngredients.length),
  );

  const seasonIngredients = useMemo(() => {
    if (!selectedSeason) return [];
    const targetMonths = SEASON_MONTH_MAP[selectedSeason];
    return (ingredientDb as IngredientItem[])
      .filter((item) =>
        item.months.some((month) => targetMonths.includes(month)),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [selectedSeason]);

  const filteredSeasonIngredients = useMemo(() => {
    if (selectedCategoryId === 0) return seasonIngredients;
    return seasonIngredients.filter(
      (item) => item.categoryId === selectedCategoryId,
    );
  }, [seasonIngredients, selectedCategoryId]);

  const visibleSeasonIngredients = filteredSeasonIngredients.slice(
    0,
    Math.min(seasonVisibleCount, filteredSeasonIngredients.length),
  );

  useEffect(() => {
    setExpandedIngredientId(null);
  }, [selectedSeason]);

  useEffect(() => {
    setSeasonVisibleCount(5);
    setSelectedCategoryId(0);
  }, [selectedSeason]);

  useEffect(() => {
    setSeasonVisibleCount(5);
  }, [selectedCategoryId]);

  useEffect(() => {
    return () => {
      if (cardClickTimerRef.current)
        window.clearTimeout(cardClickTimerRef.current);
      if (monthlyMoreTimerRef.current)
        window.clearTimeout(monthlyMoreTimerRef.current);
      if (seasonMoreTimerRef.current)
        window.clearTimeout(seasonMoreTimerRef.current);
    };
  }, []);

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

  const handleClickFoodTag = (food: string) => {
    const query = encodeURIComponent(food);
    window.open(
      `https://search.naver.com/search.naver?query=${query}`,
      "_blank",
    );
  };

  const handleClickFindRestaurants = (name: string) => {
    const query = encodeURIComponent(`${name} 맛집`);
    window.open(
      `https://search.naver.com/search.naver?query=${query}`,
      "_blank",
    );
  };

  const handleClickCoupang = (coupangUrl?: string) => {
    if (!coupangUrl) return;
    window.open(coupangUrl, "_blank");
  };

  const handleCardClick = (id: number) => {
    if (cardClickTimerRef.current)
      window.clearTimeout(cardClickTimerRef.current);
    setClickedCardId(id);
    setExpandedIngredientId((prev) => (prev === id ? null : id));
    cardClickTimerRef.current = window.setTimeout(() => {
      setClickedCardId(null);
    }, 200);
  };

  const handleClickMonthlyMore = () => {
    setIsMonthlyMoreAnimating(true);
    setMonthlyVisibleCount((prev) =>
      Math.min(prev + 3, shuffledMonthlyIngredients.length),
    );
    if (monthlyMoreTimerRef.current)
      window.clearTimeout(monthlyMoreTimerRef.current);
    monthlyMoreTimerRef.current = window.setTimeout(() => {
      setIsMonthlyMoreAnimating(false);
    }, 180);
  };

  const handleClickSeasonMore = () => {
    setIsSeasonMoreAnimating(true);
    setSeasonVisibleCount((prev) =>
      Math.min(prev + 5, filteredSeasonIngredients.length),
    );
    if (seasonMoreTimerRef.current)
      window.clearTimeout(seasonMoreTimerRef.current);
    seasonMoreTimerRef.current = window.setTimeout(() => {
      setIsSeasonMoreAnimating(false);
    }, 180);
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "60vh",
        fontFamily: "GMedium",
        padding: "24px 16px 40px",
        marginBottom: "60px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "820px", margin: "0 auto" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "30px",
            textAlign: "center",
            color: "#0f172a",
            transform: "translateY(-4px)",
          }}
        >
          제철 음식 사냥꾼
        </h1>
        <div
          style={{
            marginTop: "32px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "32px",
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 200,
                color: "#0f172a",
              }}
            >
              {currentMonth}월의 제철 식재료 🌱
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "18px",
            }}
          >
            {visibleMonthlyIngredients.map((item) => {
              const imageUrl = getIngredientImageUrl(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCardClick(item.id)}
                  style={{
                    textAlign: "left",
                    padding: 0,
                    width: "100%",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    overflow: "hidden",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    transform:
                      clickedCardId === item.id ? "scale(0.985)" : "scale(1)",
                    boxShadow:
                      clickedCardId === item.id
                        ? "0 8px 18px rgba(15, 23, 42, 0.14)"
                        : "0 4px 12px rgba(15, 23, 42, 0.06)",
                    transition: "transform 0.16s ease, box-shadow 0.16s ease",
                  }}
                >
                  <div
                    style={{
                      height: "124px",
                      backgroundColor: "#e2e8f0",
                      backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div style={{ padding: "10px 10px 12px" }}>
                    <div
                      style={{
                        fontSize: "16px",
                        color: "#0f172a",
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    >
                      {item.name}
                    </div>
                    {!!item.description && (
                      <div
                        style={{
                          marginTop: "6px",
                          fontSize: "12px",
                          color: "#64748b",
                          textAlign: "center",
                          lineHeight: 1.4,
                          display:
                            expandedIngredientId === item.id
                              ? "block"
                              : "-webkit-box",
                          WebkitLineClamp:
                            expandedIngredientId === item.id ? "unset" : 2,
                          WebkitBoxOrient: "vertical",
                          overflow:
                            expandedIngredientId === item.id
                              ? "visible"
                              : "hidden",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                    {expandedIngredientId === item.id && (
                      <div
                        style={{
                          marginTop: "22px",
                          fontSize: "11px",
                          color: "#6b7280",
                          textAlign: "center",
                        }}
                      >
                        시기 : {item.months.join(", ")}월
                      </div>
                    )}
                  </div>

                  {expandedIngredientId === item.id && (
                    <div style={{ padding: "0 10px 12px 10px" }}>
                      <div
                        style={{
                          marginTop: "2px",
                          borderTop: "1px solid #e2e8f0",
                          paddingTop: "10px",
                        }}
                      >
                        {!!item.foods?.length && (
                          <div
                            style={{
                              marginTop: "8px",
                              marginBottom: "8px",
                              display: "flex",
                              flexWrap: "wrap",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            {item.foods.map((food) => (
                              <button
                                key={food}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClickFoodTag(food);
                                }}
                                style={{
                                  border: "none",
                                  borderRadius: "999px",
                                  backgroundColor: "#e0f2fe",
                                  color: "#0c4a6e",
                                  padding: "3px 7px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                #{food}
                              </button>
                            ))}
                          </div>
                        )}
                        {!item.months.includes(currentMonth) ? (
                          <button
                            type="button"
                            disabled
                            style={{
                              width: "100%",
                              marginTop: "10px",
                              height: "40px",
                              borderRadius: "10px",
                              border: "1px solid #d1d5db",
                              backgroundColor: "#e5e7eb",
                              color: "#6b7280",
                              fontSize: "13px",
                              fontWeight: 700,
                              cursor: "not-allowed",
                            }}
                          >
                            아직 제철이 아니에요 🥲
                          </button>
                        ) : (
                          !!item.coupangUrl && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClickCoupang(item.coupangUrl);
                              }}
                              style={{
                                width: "100%",
                                marginTop: "10px",
                                height: "40px",
                                borderRadius: "10px",
                                border: "1px solid #fde68a",
                                backgroundColor: "#fef3c7",
                                color: "#92400e",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {item.name} 사러가기 🛒
                            </button>
                          )
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClickFindRestaurants(item.name);
                          }}
                          style={{
                            width: "100%",
                            marginTop: "10px",
                            height: "40px",
                            borderRadius: "10px",
                            border: "1px solid #bae6fd",
                            backgroundColor: "#f0f9ff",
                            color: "#0c4a6e",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {item.name} 맛집 찾아보기 👀
                        </button>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {monthlyVisibleCount < shuffledMonthlyIngredients.length && (
            <button
              type="button"
              onClick={handleClickMonthlyMore}
              style={{
                width: "100%",
                marginTop: "12px",
                height: "42px",
                borderRadius: "10px",
                border: "1px solid #dbe2ea",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontSize: "14px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                cursor: "pointer",
                transform: isMonthlyMoreAnimating ? "scale(0.985)" : "scale(1)",
                boxShadow: isMonthlyMoreAnimating
                  ? "0 6px 14px rgba(15, 23, 42, 0.12)"
                  : "none",
                transition: "transform 0.16s ease, box-shadow 0.16s ease",
              }}
            >
              더보기 <ChevronDown size={14} />
            </button>
          )}

          {monthlyVisibleCount >= shuffledMonthlyIngredients.length &&
            shuffledMonthlyIngredients.length > 1 && (
              <button
                type="button"
                onClick={() => setMonthlyVisibleCount(1)}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  height: "42px",
                  borderRadius: "10px",
                  border: "1px solid #dbe2ea",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  fontSize: "14px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                접기 <ChevronUp size={14} />
              </button>
            )}

          <div
            style={{
              marginTop: "32px",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "32px",
            }}
          >
            <div
              style={{
                marginBottom: "10px",
                fontSize: "24px",
                color: "#0f172a",
                fontWeight: 400,
              }}
            >
              계절별 제철 식재료
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              {["봄", "여름", "가을", "겨울"].map((season) => (
                <button
                  key={season}
                  type="button"
                  onClick={() =>
                    setSelectedSeason((prev) =>
                      prev === season ? null : season,
                    )
                  }
                  style={{
                    height: "38px",
                    borderRadius: "999px",
                    borderColor:
                      season === "봄"
                        ? "#facc15"
                        : season === "여름"
                          ? "#7dd3fc"
                          : season === "가을"
                            ? "#fb923c"
                            : "#dbe2ea",
                    borderStyle: "solid",
                    borderWidth: "1px",
                    backgroundColor:
                      selectedSeason === season
                        ? season === "봄"
                          ? "#facc15"
                          : season === "여름"
                            ? "#7dd3fc"
                            : season === "가을"
                              ? "#fb923c"
                              : "#dbe2ea"
                        : "#ffffff",
                    color:
                      selectedSeason === season
                        ? "#ffffff"
                        : season === "봄"
                          ? "#854d0e"
                          : season === "여름"
                            ? "#075985"
                            : season === "가을"
                              ? "#9a3412"
                              : "#334155",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>

          {selectedSeason && (
            <div
              style={{
                marginTop: "32px",
              }}
            >
              <div
                style={{
                  marginBottom: "10px",
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: "8px",
                }}
              >
                {categoryOptions.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    style={{
                      height: "34px",
                      borderRadius: "999px",
                      border:
                        selectedCategoryId === category.id
                          ? "1px solid #1f2937"
                          : "1px solid #dbe2ea",
                      backgroundColor:
                        selectedCategoryId === category.id
                          ? "#1f2937"
                          : "#ffffff",
                      color:
                        selectedCategoryId === category.id
                          ? "#ffffff"
                          : "#334155",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "10px",
                }}
              >
                {visibleSeasonIngredients.map((item) => {
                  const imageUrl = getIngredientImageUrl(item);
                  return (
                    <button
                      key={`season-${item.id}`}
                      type="button"
                      onClick={() => handleCardClick(item.id)}
                      style={{
                        textAlign: "left",
                        padding: 0,
                        width: "100%",
                        border: "1px solid #e2e8f0",
                        borderRadius: "12px",
                        overflow: "hidden",
                        backgroundColor: "#ffffff",
                        cursor: "pointer",
                        transform:
                          clickedCardId === item.id
                            ? "scale(0.985)"
                            : "scale(1)",
                        boxShadow:
                          clickedCardId === item.id
                            ? "0 8px 18px rgba(15, 23, 42, 0.14)"
                            : "0 4px 12px rgba(15, 23, 42, 0.06)",
                        transition:
                          "transform 0.16s ease, box-shadow 0.16s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "9px 10px",
                        }}
                      >
                        <div
                          style={{
                            width: "64px",
                            height: "64px",
                            flexShrink: 0,
                            borderRadius: "8px",
                            backgroundColor: "#e2e8f0",
                            backgroundImage: imageUrl
                              ? `url(${imageUrl})`
                              : "none",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                        <div style={{ minWidth: 0, width: "100%" }}>
                          <div
                            style={{
                              fontSize: "17px",
                              color: "#0f172a",
                              fontWeight: 700,
                            }}
                          >
                            {item.name}
                          </div>
                          {!!item.description && (
                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "12px",
                                color: "#64748b",
                                lineHeight: 1.4,
                                display:
                                  expandedIngredientId === item.id
                                    ? "block"
                                    : "-webkit-box",
                                WebkitLineClamp:
                                  expandedIngredientId === item.id
                                    ? "unset"
                                    : 1,
                                WebkitBoxOrient: "vertical",
                                overflow:
                                  expandedIngredientId === item.id
                                    ? "visible"
                                    : "hidden",
                              }}
                            >
                              {item.description}
                            </div>
                          )}
                          {expandedIngredientId === item.id && (
                            <div
                              style={{
                                marginTop: "8px",
                                fontSize: "10px",
                                color: "#6b7280",
                              }}
                            >
                              시기 : {item.months.join(", ")}월
                            </div>
                          )}
                        </div>
                      </div>
                      {expandedIngredientId === item.id && (
                        <div style={{ padding: "0 10px 10px 10px" }}>
                          <div
                            style={{
                              marginTop: "2px",
                              borderTop: "1px solid #e2e8f0",
                              paddingTop: "10px",
                            }}
                          >
                            {!!item.foods?.length && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  marginBottom: "8px",
                                  display: "flex",
                                  flexWrap: "wrap",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                              >
                                {item.foods.map((food) => (
                                  <button
                                    key={food}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleClickFoodTag(food);
                                    }}
                                    style={{
                                      border: "none",
                                      borderRadius: "999px",
                                      backgroundColor: "#e0f2fe",
                                      color: "#0c4a6e",
                                      padding: "3px 7px",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                    }}
                                  >
                                    #{food}
                                  </button>
                                ))}
                              </div>
                            )}
                            {!item.months.includes(currentMonth) ? (
                              <button
                                type="button"
                                disabled
                                style={{
                                  width: "100%",
                                  marginTop: "10px",
                                  height: "40px",
                                  borderRadius: "10px",
                                  border: "1px solid #d1d5db",
                                  backgroundColor: "#e5e7eb",
                                  color: "#6b7280",
                                  fontSize: "13px",
                                  fontWeight: 700,
                                  cursor: "not-allowed",
                                }}
                              >
                                아직 제철이 아니에요 🥲
                              </button>
                            ) : (
                              !!item.coupangUrl && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClickCoupang(item.coupangUrl);
                                  }}
                                  style={{
                                    width: "100%",
                                    marginTop: "10px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    border: "1px solid #fde68a",
                                    backgroundColor: "#fef3c7",
                                    color: "#92400e",
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  {item.name} 사러가기 🛒
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClickFindRestaurants(item.name);
                              }}
                              style={{
                                width: "100%",
                                marginTop: "10px",
                                height: "40px",
                                borderRadius: "10px",
                                border: "1px solid #bae6fd",
                                backgroundColor: "#f0f9ff",
                                color: "#0c4a6e",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              {item.name} 맛집 찾아보기 👀
                            </button>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {seasonVisibleCount < filteredSeasonIngredients.length && (
                <button
                  type="button"
                  onClick={handleClickSeasonMore}
                  style={{
                    width: "100%",
                    marginTop: "12px",
                    height: "42px",
                    borderRadius: "10px",
                    border: "1px solid #dbe2ea",
                    backgroundColor: "#ffffff",
                    color: "#475569",
                    fontSize: "14px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    cursor: "pointer",
                    transform: isSeasonMoreAnimating
                      ? "scale(0.985)"
                      : "scale(1)",
                    boxShadow: isSeasonMoreAnimating
                      ? "0 6px 14px rgba(15, 23, 42, 0.12)"
                      : "none",
                    transition: "transform 0.16s ease, box-shadow 0.16s ease",
                  }}
                >
                  더보기 <ChevronDown size={14} />
                </button>
              )}
            </div>
          )}
          <div
            style={{
              marginTop: "32px",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "32px",
            }}
          >
            <button
              type="button"
              onClick={() => navigate("/seasonal-food/worldcub")}
              style={{
                width: "100%",
                height: "52px",
                borderRadius: "14px",
                border: "1px solid rgba(30, 41, 59, 0.55)",
                background:
                  "linear-gradient(135deg, #334155 0%, #1f2937 55%, #0f172a 100%)",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "0.2px",
                cursor: "pointer",
              }}
            >
              제철 음식 월드컵
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalFoodPage;
