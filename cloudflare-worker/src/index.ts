const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    if (request.method !== "GET") {
      return Response.json(
        { error: "method not allowed" },
        {
          status: 405,
          headers: CORS_HEADERS,
        },
      );
    }

    const url = new URL(request.url);
    const locations = url.searchParams.get("locations");

    if (!locations) {
      return Response.json(
        { error: "locations is required" },
        {
          status: 400,
          headers: CORS_HEADERS,
        },
      );
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
      return Response.json(
        { error: "failed to fetch elevation data" },
        {
          status: 502,
          headers: CORS_HEADERS,
        },
      );
    }
  },
};
