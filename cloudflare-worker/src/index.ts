const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type Env = {
  NAVER_DIRECTION_API_KEY_ID?: string;
  NAVER_DIRECTION_API_KEY?: string;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });

const handleElevationProxy = async (requestUrl: URL) => {
  const locations = requestUrl.searchParams.get("locations");

  if (!locations) {
    return jsonResponse({ error: "locations is required" }, 400);
  }

  const targetUrl =
    `https://api.opentopodata.org/v1/aster30m,srtm90m?locations=${encodeURIComponent(locations)}`;

  try {
    const upstreamResponse = await fetch(targetUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    const text = await upstreamResponse.text();

    return new Response(text, {
      status: upstreamResponse.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch {
    return jsonResponse({ error: "failed to fetch elevation data" }, 502);
  }
};

const handleDirectionsProxy = async (requestUrl: URL, env: Env) => {
  const apiKeyId = env.NAVER_DIRECTION_API_KEY_ID?.trim();
  const apiKey = env.NAVER_DIRECTION_API_KEY?.trim();

  if (!apiKeyId || !apiKey) {
    return jsonResponse(
      { error: "NAVER Directions credentials are not configured" },
      500,
    );
  }

  const start = requestUrl.searchParams.get("start");
  const goal = requestUrl.searchParams.get("goal");
  const waypoints = requestUrl.searchParams.get("waypoints");
  const option = requestUrl.searchParams.get("option") || "traoptimal";

  if (!start || !goal) {
    return jsonResponse({ error: "start and goal are required" }, 400);
  }

  const upstreamUrl = new URL(
    "https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving",
  );
  upstreamUrl.searchParams.set("start", start);
  upstreamUrl.searchParams.set("goal", goal);
  upstreamUrl.searchParams.set("option", option);

  if (waypoints) {
    upstreamUrl.searchParams.set("waypoints", waypoints);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: {
        Accept: "application/json",
        "x-ncp-apigw-api-key-id": apiKeyId,
        "x-ncp-apigw-api-key": apiKey,
      },
    });

    const text = await upstreamResponse.text();

    return new Response(text, {
      status: upstreamResponse.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch {
    return jsonResponse({ error: "failed to fetch directions data" }, 502);
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    if (request.method !== "GET") {
      return jsonResponse({ error: "method not allowed" }, 405);
    }

    const requestUrl = new URL(request.url);

    if (requestUrl.pathname === "/directions-15") {
      return handleDirectionsProxy(requestUrl, env);
    }

    return handleElevationProxy(requestUrl);
  },
};
