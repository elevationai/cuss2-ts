// Simple CORS proxy for development
// Usage: deno run --allow-net proxy-server.ts

const PROXY_PORT = 8001;
const TARGET_SERVER = "http://localhost:22222";
const ALLOWED_ORIGINS = [
  "http://localhost:8000",
  "http://127.0.0.1:8000",
  "http://172.10.0.184:8000",
];

Deno.serve({ port: PROXY_PORT }, async (req) => {
  const url = new URL(req.url);
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "*";

  // Handle preflight requests first
  if (req.method === "OPTIONS") {
    console.log(`Preflight request: ${req.method} ${url.pathname} from ${origin}`);
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, *",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const targetUrl = `${TARGET_SERVER}${url.pathname}${url.search}`;
  console.log(`Proxying: ${req.method} ${targetUrl}`);

  try {
    // Clone headers but remove host header
    const headers = new Headers();
    for (const [key, value] of req.headers.entries()) {
      if (key.toLowerCase() !== "host") {
        headers.set(key, value);
      }
    }

    // Forward the request to the target server
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    });

    console.log(`Response: ${response.status} ${response.statusText}`);

    // Clone the response and add CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", allowedOrigin);
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, *");
    responseHeaders.set("Access-Control-Expose-Headers", "*");
    responseHeaders.set("Access-Control-Allow-Credentials", "true");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(`Proxy error: ${error.message}`, {
      status: 502,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/plain",
      },
    });
  }
});

console.log(`CORS Proxy running on http://localhost:${PROXY_PORT}`);
console.log(`Forwarding requests to ${TARGET_SERVER}`);
