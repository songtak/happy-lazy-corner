import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, CircleAlert } from "lucide-react";
import ingredientDb from "@/assets/seasonalFood/ingredient_db.json";
import menuAndTipsDb from "@/assets/seasonalFood/menu_and_tips.json";
import { isMobile } from "@libs/helpers";

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
  alias?: string | string[];
  months: number[];
  categoryId?: number;
  imgUrl?: string;
  description?: string;
  foods?: string[];
  coupangUrl?: string;
};

type SuggestionFieldKey = "month" | "description" | "add" | "typo" | "etc";
type StyleTag = "hearty" | "light" | "warm" | "spicy" | "fresh";
type WeatherTag = "rainy" | "cold" | "warm" | "hot";
type SituationTag = "solo" | "home" | "eatout" | "special";
type MealTypeTag = "meal" | "lightMeal" | "anju" | "dessert";
type IngredientTypeTag = "seafood" | "vegetable" | "meat" | "fruit" | "grain";
type MenuFinderAnswers = {
  style: StyleTag | null;
  weather: WeatherTag | "any" | null;
  situation: SituationTag | null;
  mealType: MealTypeTag | null;
};
type MenuTipItem = {
  name: string;
  description: string;
  seasonality: string;
  benefit: string;
  tip: string;
  tags: string;
  ingredient: string;
};
type ParsedMenuTipItem = MenuTipItem & {
  parsedTags: string[];
  ingredientType: IngredientTypeTag | null;
};

const MENU_TAG_LABELS: Record<string, string> = {
  hearty: "든든한",
  light: "가벼운",
  warm: "따뜻한",
  spicy: "자극적인",
  fresh: "상큼한",
  rainy: "비 오거나 흐린 날",
  cold: "쌀쌀한 날",
  hot: "더운 날",
  solo: "혼밥",
  home: "집밥",
  eatout: "외식",
  special: "특별한 한 끼",
  meal: "든든한 식사",
  lightMeal: "가볍게 먹기",
  anju: "술안주",
  dessert: "디저트",
  seafood: "해산물",
  vegetable: "채소",
  meat: "고기",
  fruit: "과일",
  grain: "곡물",
};

const MENU_FINDER_QUESTIONS = [
  {
    key: "style" as const,
    title: "오늘 어떤 음식이 끌려?",
    options: [
      { label: "든든한 게 먹고 싶어", value: "hearty" as const },
      { label: "가볍게 먹고 싶어", value: "light" as const },
      { label: "따뜻한 게 당겨", value: "warm" as const },
      { label: "자극적인 게 먹고 싶어", value: "spicy" as const },
      { label: "상큼한 게 당겨", value: "fresh" as const },
    ],
  },
  {
    key: "weather" as const,
    title: "지금 날씨나 분위기는 어때?",
    options: [
      { label: "비 오거나 흐려", value: "rainy" as const },
      { label: "쌀쌀해", value: "cold" as const },
      { label: "따뜻하고 산뜻해", value: "warm" as const },
      { label: "더워", value: "hot" as const },
      { label: "상관없어", value: "any" as const },
    ],
  },
  {
    key: "situation" as const,
    title: "어떤 상황이야?",
    options: [
      { label: "혼밥", value: "solo" as const },
      { label: "집밥", value: "home" as const },
      { label: "외식", value: "eatout" as const },
      { label: "특별한 한 끼", value: "special" as const },
    ],
  },
  {
    key: "mealType" as const,
    title: "지금 식사 목적은?",
    options: [
      { label: "든든한 식사", value: "meal" as const },
      { label: "가볍게 먹기", value: "lightMeal" as const },
      { label: "술안주", value: "anju" as const },
      { label: "디저트", value: "dessert" as const },
    ],
  },
];

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
  const initialMonthlyVisibleCount = isMobile() ? 1 : 3;
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const [monthlyVisibleCount, setMonthlyVisibleCount] = useState<number>(
    initialMonthlyVisibleCount,
  );
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
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] =
    useState<boolean>(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] =
    useState<boolean>(false);
  const [suggestionTarget, setSuggestionTarget] =
    useState<IngredientItem | null>(null);
  const [selectedSuggestionField, setSelectedSuggestionField] =
    useState<SuggestionFieldKey | null>(null);
  const [suggestionTexts, setSuggestionTexts] = useState<
    Record<SuggestionFieldKey, string>
  >({
    month: "",
    description: "",
    add: "",
    typo: "",
    etc: "",
  });
  const [menuFinderAnswers, setMenuFinderAnswers] = useState<MenuFinderAnswers>(
    {
      style: null,
      weather: null,
      situation: null,
      mealType: null,
    },
  );
  const [hasSubmittedMenuFinder, setHasSubmittedMenuFinder] =
    useState<boolean>(false);
  const cardClickTimerRef = useRef<number | null>(null);
  const monthlyMoreTimerRef = useRef<number | null>(null);
  const seasonMoreTimerRef = useRef<number | null>(null);
  const monthDropdownRef = useRef<HTMLDivElement | null>(null);

  const monthlyIngredients = useMemo(() => {
    return (ingredientDb as IngredientItem[])
      .filter((item) => item.months.includes(selectedMonth))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [selectedMonth]);

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

  const currentMonthIngredientNames = useMemo(() => {
    return new Set(
      (ingredientDb as IngredientItem[])
        .filter((item) => item.months.includes(currentMonth))
        .map((item) => item.name),
    );
  }, [currentMonth]);

  const currentMonthMenus = useMemo(() => {
    return (menuAndTipsDb as MenuTipItem[])
      .filter((item) => currentMonthIngredientNames.has(item.ingredient))
      .map((item) => {
        const parsedTags = item.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
        const ingredientType =
          (parsedTags.find((tag) =>
            ["seafood", "vegetable", "meat", "fruit", "grain"].includes(tag),
          ) as IngredientTypeTag | undefined) ?? null;

        return {
          ...item,
          parsedTags,
          ingredientType,
        };
      });
  }, [currentMonthIngredientNames]);

  const selectedMenuTags = useMemo(() => {
    const tags = [
      menuFinderAnswers.style,
      menuFinderAnswers.situation,
      menuFinderAnswers.mealType,
    ].filter(Boolean) as string[];

    if (menuFinderAnswers.weather && menuFinderAnswers.weather !== "any") {
      tags.splice(1, 0, menuFinderAnswers.weather);
    }

    return tags;
  }, [menuFinderAnswers]);

  const recommendedMenus = useMemo(() => {
    if (!hasSubmittedMenuFinder || selectedMenuTags.length < 3) return [];

    const scoredMenus = currentMonthMenus
      .map((menu) => {
        const matchedTags = selectedMenuTags.filter((tag) =>
          menu.parsedTags.includes(tag),
        );
        return {
          ...menu,
          matchedTags,
          matchScore: matchedTags.length,
        };
      })
      .filter((menu) => menu.matchScore > 0)
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return a.name.localeCompare(b.name, "ko");
      });

    if (scoredMenus.length === 0) return [];

    const exactMatches = scoredMenus.filter(
      (menu) => menu.matchScore === selectedMenuTags.length,
    );
    if (exactMatches.length > 0) {
      return exactMatches.slice(0, 6);
    }

    const bestScore = scoredMenus[0].matchScore;
    return scoredMenus
      .filter((menu) => menu.matchScore === bestScore)
      .slice(0, 6);
  }, [currentMonthMenus, hasSubmittedMenuFinder, selectedMenuTags]);

  const isMenuFinderComplete = useMemo(() => {
    return (
      !!menuFinderAnswers.style &&
      !!menuFinderAnswers.weather &&
      !!menuFinderAnswers.situation &&
      !!menuFinderAnswers.mealType
    );
  }, [menuFinderAnswers]);

  const visibleMenuFinderQuestionCount = useMemo(() => {
    if (!menuFinderAnswers.style) return 1;
    if (!menuFinderAnswers.weather) return 2;
    if (!menuFinderAnswers.situation) return 3;
    if (!menuFinderAnswers.mealType) return 4;
    return 4;
  }, [menuFinderAnswers]);

  const currentMenuFinderQuestionIndex = useMemo(() => {
    return Math.max(0, visibleMenuFinderQuestionCount - 1);
  }, [visibleMenuFinderQuestionCount]);

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
    setExpandedIngredientId(null);
    setMonthlyVisibleCount(initialMonthlyVisibleCount);
  }, [selectedMonth, initialMonthlyVisibleCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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

  const getCoupangUrl = (item: IngredientItem) => {
    if (item.coupangUrl) return item.coupangUrl;
    const query = encodeURIComponent(item.name);
    return `https://www.coupang.com/np/search?component=&q=${query}&channel=user`;
  };

  const getAliasList = (item: IngredientItem): string[] => {
    if (!item.alias) return [];
    if (Array.isArray(item.alias)) {
      return item.alias.map((alias) => alias.trim()).filter(Boolean);
    }
    return item.alias
      .split(",")
      .map((alias) => alias.trim())
      .filter(Boolean);
  };

  const handleClickCoupang = (coupangUrl: string) => {
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

  const handleOpenSuggestionModal = (
    item: IngredientItem,
    e: React.MouseEvent<HTMLElement>,
  ) => {
    e.stopPropagation();
    setSuggestionTarget(item);
    setSelectedSuggestionField(null);
    setSuggestionTexts({
      month: "",
      description: "",
      add: "",
      typo: "",
      etc: "",
    });
    setIsSuggestionModalOpen(true);
  };

  const handleSelectSuggestionField = (key: SuggestionFieldKey) => {
    setSelectedSuggestionField(key);
  };

  const handleSubmitSuggestion = () => {
    alert("제안 보내기 기능은 곧 연결됩니다.");
    setIsSuggestionModalOpen(false);
  };

  const canSubmitSuggestion =
    !!selectedSuggestionField &&
    suggestionTexts[selectedSuggestionField].trim().length > 0;

  const handleSelectMonth = (month: number) => {
    setSelectedMonth(month);
    setIsMonthDropdownOpen(false);
  };

  const handleSelectMenuFinderAnswer = <
    K extends keyof MenuFinderAnswers,
    V extends NonNullable<MenuFinderAnswers[K]>,
  >(
    key: K,
    value: V,
  ) => {
    const nextAnswers = {
      ...menuFinderAnswers,
      [key]: value,
    };
    setMenuFinderAnswers(nextAnswers);

    const isComplete =
      !!nextAnswers.style &&
      !!nextAnswers.weather &&
      !!nextAnswers.situation &&
      !!nextAnswers.mealType;

    setHasSubmittedMenuFinder(isComplete);
  };

  const handleResetMenuFinder = () => {
    setMenuFinderAnswers({
      style: null,
      weather: null,
      situation: null,
      mealType: null,
    });
    setHasSubmittedMenuFinder(false);
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
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <img
            src="https://songtak.github.io/happy-lazy-corner/sfimg/title.png"
            alt="마침 제철"
            style={{
              display: "block",
              width: "100%",
              maxWidth: "320px",
              height: "auto",
            }}
          />
        </div>
        <div
          style={{
            marginTop: "20px",
            paddingTop: "20px",
          }}
        >
          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              paddingTop: "20px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                color: "#0f172a",
                fontWeight: 400,
              }}
            >
              오늘의 제철 메뉴 찾기
            </div>
            {/* <div
              style={{
                marginTop: "6px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "#64748b",
              }}
            >
              지금은 {currentMonth}월. 이번 달 제철 재료로 만든 메뉴만 골라서
              추천해드릴게요.
            </div> */}

            {!hasSubmittedMenuFinder && (
              <div
                style={{
                  display: "grid",
                  gap: "14px",
                  marginTop: "16px",
                }}
              >
                <div
                  key={
                    MENU_FINDER_QUESTIONS[currentMenuFinderQuestionIndex].key
                  }
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "14px",
                    backgroundColor: "#ffffff",
                    padding: "14px",
                    minHeight: "360px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "16px",
                        color: "#0f172a",
                        fontWeight: 700,
                      }}
                    >
                      {
                        MENU_FINDER_QUESTIONS[currentMenuFinderQuestionIndex]
                          .title
                      }
                    </div>
                    <div
                      style={{
                        flexShrink: 0,
                        fontSize: "12px",
                        color: "#94a3b8",
                        fontWeight: 700,
                        textAlign: "right",
                      }}
                    >
                      {currentMenuFinderQuestionIndex + 1}/
                      {MENU_FINDER_QUESTIONS.length}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                      justifyContent: "flex-start",
                    }}
                  >
                    {MENU_FINDER_QUESTIONS[
                      currentMenuFinderQuestionIndex
                    ].options.map((option) => {
                      const questionKey =
                        MENU_FINDER_QUESTIONS[currentMenuFinderQuestionIndex]
                          .key;
                      const isSelected =
                        menuFinderAnswers[questionKey] === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            handleSelectMenuFinderAnswer(
                              questionKey,
                              option.value,
                            )
                          }
                          style={{
                            width: "100%",
                            maxWidth: "320px",
                            height: "48px",
                            borderRadius: "999px",
                            border: isSelected
                              ? "1px solid #0f172a"
                              : "1px solid #dbe2ea",
                            backgroundColor: isSelected ? "#0f172a" : "#ffffff",
                            color: isSelected ? "#ffffff" : "#334155",
                            fontSize: "13px",
                            fontWeight: 700,
                            padding: "0 12px",
                            cursor: "pointer",
                            textAlign: "center",
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {hasSubmittedMenuFinder && (
              <div
                style={{
                  marginTop: "16px",
                  borderRadius: "16px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    color: "#0f172a",
                    fontWeight: 700,
                  }}
                >
                  추천 결과
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "12px",
                    lineHeight: 1.6,
                    color: "#64748b",
                  }}
                >
                  {recommendedMenus.length > 0 &&
                  recommendedMenus[0].matchScore === selectedMenuTags.length
                    ? "선택한 조건과 맞는 제철 메뉴를 찾았어요."
                    : "완전히 일치하는 메뉴가 적어서, 지금 조건과 가장 가까운 제철 메뉴를 골랐어요."}
                </div>

                {recommendedMenus.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      marginTop: "14px",
                    }}
                  >
                    {recommendedMenus.map((menu) => (
                      <div
                        key={`${menu.ingredient}-${menu.name}`}
                        style={{
                          borderRadius: "14px",
                          border: "1px solid #dbe2ea",
                          backgroundColor: "#ffffff",
                          padding: "14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "18px",
                                color: "#0f172a",
                                fontWeight: 700,
                              }}
                            >
                              {menu.name}
                            </div>
                            <div
                              style={{
                                marginTop: "4px",
                                fontSize: "12px",
                                color: "#475569",
                              }}
                            >
                              제철 재료: {menu.ingredient}
                              {menu.ingredientType
                                ? ` · ${MENU_TAG_LABELS[menu.ingredientType]}`
                                : ""}
                            </div>
                          </div>
                          <div
                            style={{
                              flexShrink: 0,
                              borderRadius: "999px",
                              backgroundColor: "#e2e8f0",
                              color: "#0f172a",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "5px 8px",
                            }}
                          >
                            {menu.matchScore}/{selectedMenuTags.length} 매치
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: "10px",
                            fontSize: "13px",
                            color: "#334155",
                            lineHeight: 1.6,
                          }}
                        >
                          {menu.description}
                        </div>

                        <div
                          style={{
                            marginTop: "10px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {menu.matchedTags.map((tag) => (
                            <span
                              key={`${menu.name}-${tag}`}
                              style={{
                                borderRadius: "999px",
                                backgroundColor: "#e0f2fe",
                                color: "#0c4a6e",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "4px 8px",
                                textAlign: "center",
                              }}
                            >
                              #{MENU_TAG_LABELS[tag] ?? tag}
                            </span>
                          ))}
                        </div>

                        <div
                          style={{
                            marginTop: "10px",
                            fontSize: "12px",
                            color: "#475569",
                            lineHeight: 1.6,
                          }}
                        >
                          팁: {menu.tip}
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "8px",
                            marginTop: "12px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleClickFoodTag(menu.name)}
                            style={{
                              height: "38px",
                              borderRadius: "10px",
                              border: "1px solid #bae6fd",
                              backgroundColor: "#f0f9ff",
                              color: "#0c4a6e",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            메뉴 검색
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleClickFindRestaurants(menu.name)
                            }
                            style={{
                              height: "38px",
                              borderRadius: "10px",
                              border: "1px solid #dbe2ea",
                              backgroundColor: "#ffffff",
                              color: "#334155",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            맛집 찾아보기
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: "14px",
                      fontSize: "13px",
                      color: "#475569",
                      lineHeight: 1.6,
                    }}
                  >
                    이번 달 제철 메뉴 중에서는 조건과 맞는 결과를 찾지 못했어요.
                    다른 답변으로 다시 골라보세요.
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleResetMenuFinder}
                  style={{
                    width: "100%",
                    marginTop: "14px",
                    height: "48px",
                    borderRadius: "12px",
                    border: "1px solid #0f172a",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  다시하기
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: "20px",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: "24px",
                fontWeight: 200,
                color: "#0f172a",
              }}
            >
              {selectedMonth}월의 제철
            </div>
            <div ref={monthDropdownRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setIsMonthDropdownOpen((prev) => !prev)}
                style={{
                  height: "36px",
                  minWidth: "92px",
                  borderRadius: "10px",
                  border: isMonthDropdownOpen
                    ? "1px solid #64748b"
                    : "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "0 10px 0 12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  boxShadow: isMonthDropdownOpen
                    ? "0 8px 16px rgba(15, 23, 42, 0.12)"
                    : "none",
                }}
              >
                {selectedMonth}월
                <ChevronDown
                  size={14}
                  style={{
                    transform: isMonthDropdownOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.16s ease",
                  }}
                />
              </button>
              {isMonthDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "40px",
                    right: 0,
                    width: "100%",
                    maxHeight: "220px",
                    overflowY: "auto",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 14px 28px rgba(15, 23, 42, 0.16)",
                    zIndex: 20,
                    padding: "4px",
                  }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() => handleSelectMonth(month)}
                      style={{
                        width: "100%",
                        height: "32px",
                        border: "none",
                        borderRadius: "8px",
                        backgroundColor:
                          selectedMonth === month ? "#e2e8f0" : "transparent",
                        color: "#0f172a",
                        fontSize: "13px",
                        fontWeight: selectedMonth === month ? 700 : 500,
                        textAlign: "left",
                        padding: "0 10px",
                        cursor: "pointer",
                      }}
                    >
                      {month}월
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "18px",
            }}
          >
            {visibleMonthlyIngredients.map((item) => {
              const imageUrl = getIngredientImageUrl(item);
              const aliasList = getAliasList(item);
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
                      position: "relative",
                      height: "164px",
                      backgroundColor: "#e2e8f0",
                      backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {expandedIngredientId === item.id && (
                      <div
                        title="정보 수정 제안"
                        onClick={(e) => handleOpenSuggestionModal(item, e)}
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          zIndex: 2,
                          width: "28px",
                          height: "28px",
                          borderRadius: "999px",
                          border: "1px solid rgba(15, 23, 42, 0.3)",
                          backgroundColor: "rgba(255, 255, 255, 0.96)",
                          color: "#0f172a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <CircleAlert size={16} strokeWidth={2.2} />
                      </div>
                    )}
                  </div>
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
                    {expandedIngredientId === item.id &&
                      aliasList.length > 0 && (
                        <div
                          style={{
                            marginTop: "3px",
                            fontSize: "11px",
                            fontWeight: 400,
                            color: "#94a3b8",
                            textAlign: "center",
                          }}
                        >
                          ({aliasList.join(", ")})
                        </div>
                      )}
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
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClickCoupang(getCoupangUrl(item));
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
                onClick={() =>
                  setMonthlyVisibleCount(initialMonthlyVisibleCount)
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
                접기 <ChevronUp size={14} />
              </button>
            )}

          <div
            style={{
              marginTop: "20px",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "20px",
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
              계절별
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
                marginTop: "20px",
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
                  const aliasList = getAliasList(item);
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
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "8px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "17px",
                                color: "#0f172a",
                                fontWeight: 700,
                              }}
                            >
                              {item.name}
                            </span>
                            {expandedIngredientId === item.id && (
                              <span
                                title="정보 수정 제안"
                                onClick={(e) =>
                                  handleOpenSuggestionModal(item, e)
                                }
                                style={{
                                  color: "#334155",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                }}
                              >
                                <CircleAlert size={15} />
                              </span>
                            )}
                          </div>
                          {expandedIngredientId === item.id &&
                            aliasList.length > 0 && (
                              <div
                                style={{
                                  marginTop: "2px",
                                  fontSize: "10px",
                                  fontWeight: 400,
                                  color: "#94a3b8",
                                }}
                              >
                                ({aliasList.join(", ")})
                              </div>
                            )}
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
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClickCoupang(getCoupangUrl(item));
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
              marginTop: "20px",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "20px",
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
          <div
            style={{
              marginTop: "20px",
              borderTop: "1px solid #e2e8f0",
              paddingTop: "20px",
            }}
          >
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "18px",
                backgroundColor: "#ffffff",
                padding: "18px 16px",
                boxShadow: "0 6px 16px rgba(15, 23, 42, 0.05)",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  color: "#0f172a",
                  fontWeight: 700,
                }}
              >
                💡 제철음식을 먹어야 하는 이유
              </div>
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  marginTop: "16px",
                }}
              >
                {[
                  {
                    emoji: "🥗",
                    title: "영양이 풍부해요",
                    description:
                      "제철에 수확한 식재료는 영양소가 가장 풍부하고, 맛도 가장 좋습니다.",
                  },
                  {
                    emoji: "💰",
                    title: "가격이 저렴해요",
                    description:
                      "제철 식재료는 공급이 풍부하여 합리적인 가격에 구매할 수 있습니다.",
                  },
                  {
                    emoji: "🌍",
                    title: "환경에 좋아요",
                    description:
                      "제철 식재료는 운송 거리가 짧고, 에너지 소비가 적어 친환경적입니다.",
                  },
                ].map((reason) => (
                  <div
                    key={reason.title}
                    style={{
                      borderRadius: "14px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      padding: "14px 12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "24px",
                        lineHeight: 1,
                      }}
                    >
                      {reason.emoji}
                    </div>
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "17px",
                        color: "#0f172a",
                        fontWeight: 700,
                      }}
                    >
                      {reason.title}
                    </div>
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "13px",
                        lineHeight: 1.6,
                        color: "#475569",
                      }}
                    >
                      {reason.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isSuggestionModalOpen && suggestionTarget && (
          <div
            onClick={() => setIsSuggestionModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.45)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "460px",
                borderRadius: "14px",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                boxShadow: "0 16px 32px rgba(15, 23, 42, 0.24)",
                padding: "18px 16px",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "10px",
                }}
              >
                정보 수정 또는 제안
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#475569",
                  marginBottom: "12px",
                  lineHeight: 1.5,
                  fontWeight: 300,
                }}
              >
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {suggestionTarget.name}
                </span>
                의 정보가 잘못되었거나 추가할 내용이 있다면 알려주세요.
              </div>

              <div
                style={{ display: "grid", gap: "8px", marginBottom: "18px" }}
              >
                {[
                  {
                    key: "month" as const,
                    label: "제철 시기 수정",
                  },
                  {
                    key: "description" as const,
                    label: "설명 오류",
                  },
                  {
                    key: "add" as const,
                    label: "추가하면 좋은 정보",
                  },
                  {
                    key: "typo" as const,
                    label: "오타 / 표현 수정",
                  },
                  {
                    key: "etc" as const,
                    label: "기타",
                  },
                ].map((field) => (
                  <label
                    key={field.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      fontWeight: 300,
                      color: "#0f172a",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="suggestion-field"
                      checked={selectedSuggestionField === field.key}
                      onChange={() => handleSelectSuggestionField(field.key)}
                    />
                    {field.label}
                  </label>
                ))}
              </div>

              <textarea
                value={
                  selectedSuggestionField
                    ? suggestionTexts[selectedSuggestionField]
                    : ""
                }
                onChange={(e) => {
                  if (!selectedSuggestionField) return;
                  setSuggestionTexts((prev) => ({
                    ...prev,
                    [selectedSuggestionField]: e.target.value,
                  }));
                }}
                placeholder={
                  selectedSuggestionField
                    ? {
                        month:
                          "제철이라고 생각하는 월을 알려주세요. 예) 11, 12, 1, 2",
                        description:
                          "설명 중 잘못된 내용이나 어색한 부분을 알려주세요. 가능하면 어떤 점이 틀렸는지도 함께 적어주세요.",
                        add: "추가되면 좋을 정보를 알려주세요. 예) 주요 산지, 영양 정보, 추천 요리, 보관 방법, 맛집",
                        typo: "오타가 있거나 어색한 표현이 있다면 수정 내용을 적어주세요.",
                        etc: "위 항목에 해당하지 않는 의견이 있다면 자유롭게 적어주세요.",
                      }[selectedSuggestionField]
                    : "항목을 먼저 선택해주세요."
                }
                disabled={!selectedSuggestionField}
                style={{
                  width: "100%",
                  minHeight: "110px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  padding: "10px 12px",
                  fontSize: "13px",
                  resize: "vertical",
                  backgroundColor: selectedSuggestionField
                    ? "#f8fafc"
                    : "#f1f5f9",
                  marginBottom: "16px",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsSuggestionModalOpen(false)}
                  style={{
                    height: "42px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#334155",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSubmitSuggestion}
                  disabled={!canSubmitSuggestion}
                  style={{
                    height: "42px",
                    borderRadius: "10px",
                    border: canSubmitSuggestion
                      ? "1px solid #1f2937"
                      : "1px solid #cbd5e1",
                    backgroundColor: canSubmitSuggestion
                      ? "#1f2937"
                      : "#e2e8f0",
                    color: canSubmitSuggestion ? "#ffffff" : "#94a3b8",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: canSubmitSuggestion ? "pointer" : "not-allowed",
                  }}
                >
                  제안 보내기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalFoodPage;
