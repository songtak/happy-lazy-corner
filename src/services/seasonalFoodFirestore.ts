import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { seasonalFoodDb } from "../../firebaseConfig";

export const SEASONAL_FOOD_COLLECTIONS = {
  ingredients: "ingredients",
  worldcupResults: "worldcup_results",
} as const;

export type SeasonalIngredientDoc = {
  id: number;
  name: string;
  months: number[];
  categoryId?: number;
  subCategoryId?: number;
  description?: string;
  foods?: string[];
  imgUrl?: string;
  coupangUrl?: string;
};

export type SeasonalWorldcupResultDoc = {
  month: number;
  round: number;
  winnerName: string;
  winnerId?: number;
};

export const upsertSeasonalIngredient = async (
  ingredient: SeasonalIngredientDoc,
) => {
  const ref = doc(seasonalFoodDb, SEASONAL_FOOD_COLLECTIONS.ingredients, String(ingredient.id));
  await setDoc(
    ref,
    {
      ...ingredient,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

export const getSeasonalIngredients = async () => {
  const q = query(
    collection(seasonalFoodDb, SEASONAL_FOOD_COLLECTIONS.ingredients),
    orderBy("name", "asc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => item.data() as SeasonalIngredientDoc);
};

export const saveSeasonalWorldcupResult = async (
  result: SeasonalWorldcupResultDoc,
) => {
  await addDoc(collection(seasonalFoodDb, SEASONAL_FOOD_COLLECTIONS.worldcupResults), {
    ...result,
    createdAt: serverTimestamp(),
  });
};

export const getSeasonalWorldcupResults = async (take = 20) => {
  const q = query(
    collection(seasonalFoodDb, SEASONAL_FOOD_COLLECTIONS.worldcupResults),
    orderBy("createdAt", "desc"),
    limit(take),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => item.data() as SeasonalWorldcupResultDoc);
};
