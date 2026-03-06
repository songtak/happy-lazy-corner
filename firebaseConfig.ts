// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getFirestore } from "firebase/firestore";

const FIREBASE_APPKEY = `${import.meta.env.VITE_FIREBASE_APPKEY}`;

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: FIREBASE_APPKEY,
  authDomain: "emoji2025-f9abc.firebaseapp.com",
  projectId: "emoji2025-f9abc",
  storageBucket: "emoji2025-f9abc.firebasestorage.app",
  messagingSenderId: "23905185557",
  appId: "1:23905185557:web:96ad5cc4a334d33e9f031c",
  measurementId: "G-JX8M3NZQ5K",
};

const proxyFirebaseConfig = {
  apiKey: "AIzaSyCHaXG5d1YqQQGKmpB_A21tMit6avEizIg",
  authDomain: "public-data-proxy.firebaseapp.com",
  projectId: "public-data-proxy",
  storageBucket: "public-data-proxy.firebasestorage.app",
  messagingSenderId: "646248728066",
  appId: "1:646248728066:web:b011b98fb6d619c7c6491b",
  measurementId: "G-RN0SJ4NBL5",
};

const seasonalFoodFirebaseConfig = {
  apiKey: "AIzaSyDXS1lRm9EgDQ0S0iEc_umHQJftCsKHa6A",
  authDomain: "seasonal-food-d5c2f.firebaseapp.com",
  projectId: "seasonal-food-d5c2f",
  storageBucket: "seasonal-food-d5c2f.firebasestorage.app",
  messagingSenderId: "1046406753729",
  appId: "1:1046406753729:web:a917de716041b5b8925340",
  measurementId: "G-KLKZCRCQC6",
};

// Initialize Firebase (main project)
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

// Initialize Firebase (proxy project as secondary app)
const PROXY_APP_NAME = "public-data-proxy";
export const proxyApp =
  getApps().find((item) => item.name === PROXY_APP_NAME) ||
  initializeApp(proxyFirebaseConfig, PROXY_APP_NAME);
export const proxyAnalytics =
  typeof window !== "undefined" ? getAnalytics(proxyApp) : null;

// Initialize Firebase (seasonal-food project as secondary app)
const SEASONAL_FOOD_APP_NAME = "seasonal-food-d5c2f";
export const seasonalFoodApp =
  getApps().find((item) => item.name === SEASONAL_FOOD_APP_NAME) ||
  initializeApp(seasonalFoodFirebaseConfig, SEASONAL_FOOD_APP_NAME);
export const seasonalFoodAnalytics =
  typeof window !== "undefined" ? getAnalytics(seasonalFoodApp) : null;

// Initialize Firestore
export const db = getFirestore(app);
export const seasonalFoodDb = getFirestore(seasonalFoodApp);
