import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
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

const SeasonalFoodPage = () => {
  const navigate = useNavigate();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const [visibleCount, setVisibleCount] = useState<number>(3);
  const [selectedIngredient, setSelectedIngredient] =
    useState<IngredientItem | null>(null);
  const todayLabel = `${String(currentMonth).padStart(2, "0")}월 ${String(
    currentDay,
  ).padStart(2, "0")}일`;

  const monthlyIngredients = useMemo(
    () =>
      (ingredientDb as IngredientItem[])
        .filter((item) => item.months.includes(currentMonth))
        .sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [currentMonth],
  );

  const shuffledMonthlyIngredients = useMemo(() => {
    const shuffled = [...monthlyIngredients];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [monthlyIngredients]);

  const visibleIngredients = shuffledMonthlyIngredients.slice(
    0,
    Math.min(visibleCount, shuffledMonthlyIngredients.length),
  );

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
    window.open(`https://search.naver.com/search.naver?query=${query}`, "_blank");
  };

  const handleClickFindRestaurants = (name: string) => {
    const query = encodeURIComponent(`${name} 맛집`);
    window.open(`https://search.naver.com/search.naver?query=${query}`, "_blank");
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
          제철 사냥꾼
        </h1>
        <div
          style={{
            marginTop: "2px",
            marginBottom: "10px",
            fontSize: "14px",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          {todayLabel}
        </div>

        <button
          type="button"
          onClick={() => navigate("/seasonal-food-/worldcub")}
          style={{
            width: "100%",
            marginTop: "16px",
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
          제철음식 월드컵
        </button>

        <div
          style={{
            marginTop: "20px",
            borderTop: "1px solid #e2e8f0",
            paddingTop: "14px",
          }}
        >
          <div
            style={{
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {currentMonth}월의 제철 식재료
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "12px",
            }}
          >
            {visibleIngredients.map((item) => {
              const imageUrl = getIngredientImageUrl(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIngredient(item)}
                  style={{
                    textAlign: "left",
                    padding: 0,
                    width: "100%",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    overflow: "hidden",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
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
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {visibleCount < shuffledMonthlyIngredients.length && (
            <button
              type="button"
              onClick={() =>
                setVisibleCount((prev) =>
                  Math.min(prev + 5, shuffledMonthlyIngredients.length),
                )
              }
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
              더보기 <ChevronDown size={14} />
            </button>
          )}
          {visibleCount >= shuffledMonthlyIngredients.length &&
            shuffledMonthlyIngredients.length > 3 && (
              <button
                type="button"
                onClick={() => setVisibleCount(3)}
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
        </div>
      </div>
      {selectedIngredient && (
        <div
          onClick={() => setSelectedIngredient(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            zIndex: 1000,
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "86vh",
              overflowY: "auto",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #dbe2ea",
              boxShadow: "0 18px 38px rgba(15, 23, 42, 0.24)",
            }}
          >
            <div
              style={{
                height: "260px",
                backgroundColor: "#e2e8f0",
                backgroundImage: `url(${getIngredientImageUrl(selectedIngredient)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div style={{ padding: "14px" }}>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#0f172a",
                  textAlign: "center",
                }}
              >
                {selectedIngredient.name}
              </div>
              {!!selectedIngredient.description && (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "14px",
                    color: "#475569",
                    lineHeight: 1.6,
                    textAlign: "center",
                  }}
                >
                  {selectedIngredient.description}
                </div>
              )}
              {!!selectedIngredient.foods?.length && (
                <div
                  style={{
                    marginTop: "12px",
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {selectedIngredient.foods.map((food) => (
                    <button
                      key={food}
                      type="button"
                      onClick={() => handleClickFoodTag(food)}
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
              <button
                type="button"
                onClick={() => handleClickFindRestaurants(selectedIngredient.name)}
                style={{
                  width: "100%",
                  marginTop: "12px",
                  height: "46px",
                  borderRadius: "12px",
                  border: "1px solid #bae6fd",
                  backgroundColor: "#f0f9ff",
                  color: "#0c4a6e",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {selectedIngredient.name} 맛집 찾아보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonalFoodPage;
