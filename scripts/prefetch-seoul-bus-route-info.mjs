import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const ROUTE_FILE = path.join(ROOT, "src/assets/seoul_bus_id.json");
const OUTPUT_FILE = path.join(ROOT, "src/assets/seoul_bus_route_info.json");
const ENV_FILE = path.join(ROOT, ".env");
const API_URL = "http://ws.bus.go.kr/api/rest/busRouteInfo/getRouteInfo";
const DELAY_MS = 180;
const TIMEOUT_MS = 12000;
const RETRY_COUNT = 2;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseEnv = (content) => {
  const env = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 0) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    env[key] = value;
  });
  return env;
};

const getServiceKey = async () => {
  if (process.env.VITE_DATA_API_EN_KEY) {
    return decodeURIComponent(process.env.VITE_DATA_API_EN_KEY.trim());
  }
  const envText = await fs.readFile(ENV_FILE, "utf8");
  const env = parseEnv(envText);
  const value = env.VITE_DATA_API_EN_KEY || "";
  if (!value) throw new Error("VITE_DATA_API_EN_KEY not found in .env");
  return decodeURIComponent(value.trim());
};

const requestRouteInfo = async ({ serviceKey, routeId }) => {
  let lastError = null;
  for (let attempt = 1; attempt <= RETRY_COUNT + 1; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const url = new URL(API_URL);
      url.searchParams.set("ServiceKey", serviceKey);
      url.searchParams.set("busRouteId", routeId);
      url.searchParams.set("resultType", "json");
      const response = await fetch(url, { signal: controller.signal });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
      }
      const parsed = JSON.parse(text);
      return parsed;
    } catch (error) {
      lastError = error;
      if (attempt <= RETRY_COUNT) {
        await sleep(400 * attempt);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
};

const main = async () => {
  const routeRaw = await fs.readFile(ROUTE_FILE, "utf8");
  const routeJson = JSON.parse(routeRaw);
  const routes = Array.isArray(routeJson.DATA) ? routeJson.DATA : [];
  const serviceKey = await getServiceKey();

  const output = {
    generatedAt: new Date().toISOString(),
    source: "http://ws.bus.go.kr/api/rest/busRouteInfo/getRouteInfo",
    totalRoutes: routes.length,
    successCount: 0,
    failCount: 0,
    routes: {},
    failures: [],
  };

  for (let i = 0; i < routes.length; i += 1) {
    const item = routes[i];
    const routeId = String(item.rte_id);
    const routeName = String(item.rte_nm);
    try {
      const parsed = await requestRouteInfo({ serviceKey, routeId });
      const headerCd = String(parsed?.msgHeader?.headerCd ?? "");
      const headerMsg = String(parsed?.msgHeader?.headerMsg ?? "");
      const itemList = Array.isArray(parsed?.msgBody?.itemList)
        ? parsed.msgBody.itemList
        : [];
      output.routes[routeId] = {
        rte_id: routeId,
        rte_nm: routeName,
        headerCd,
        headerMsg,
        itemList,
      };
      output.successCount += 1;
      console.log(
        `[${i + 1}/${routes.length}] OK ${routeName}(${routeId}) items=${itemList.length}`,
      );
    } catch (error) {
      output.failCount += 1;
      const message = error instanceof Error ? error.message : String(error);
      output.failures.push({
        rte_id: routeId,
        rte_nm: routeName,
        error: message,
      });
      console.log(`[${i + 1}/${routes.length}] FAIL ${routeName}(${routeId})`);
    }

    if ((i + 1) % 25 === 0) {
      output.generatedAt = new Date().toISOString();
      await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`);
      console.log(`checkpoint saved: ${i + 1}`);
    }
    await sleep(DELAY_MS);
  }

  output.generatedAt = new Date().toISOString();
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`);
  console.log(
    `done: success=${output.successCount}, fail=${output.failCount}, file=${OUTPUT_FILE}`,
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
