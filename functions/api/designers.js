const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz4N8q4NFNQ-NYCHrDh31oGNBXNPn5wYH_OYB6IPO0S0Z-3S6aTAZ0EdVMK9CR1x7tw/exec";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "Access-Control-Allow-Origin": "*"
};

export async function onRequest(context) {
  const request = context.request;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: JSON_HEADERS
    });
  }

  try {
    const separator = APPS_SCRIPT_URL.includes("?") ? "&" : "?";
    const upstream = await fetch(APPS_SCRIPT_URL + separator + "v=" + Date.now(), {
      method: "GET",
      redirect: "follow",
      headers: { "Accept": "application/json" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });

    if (!upstream.ok) {
      throw new Error("Directory source returned " + upstream.status);
    }

    const payload = await upstream.json();

    if (!payload || payload.ok !== true || !Array.isArray(payload.designers)) {
      throw new Error(payload && payload.error ? payload.error : "Invalid directory payload");
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: JSON_HEADERS
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error && error.message ? error.message : String(error)
    }), {
      status: 502,
      headers: JSON_HEADERS
    });
  }
}
