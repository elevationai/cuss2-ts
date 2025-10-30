// Simple CORS proxy for development
// Usage: deno run --allow-net proxy-server.ts

const PROXY_PORT = 8001;
const TARGET_SERVER = "http://localhost:22222";

Deno.serve({ port: PROXY_PORT }, async (req) => {
  const url = new URL(req.url);
  const targetUrl = `${TARGET_SERVER}${url.pathname}${url.search}`;

  console.log(`Proxying: ${req.method} ${targetUrl}`);

  // Forward the request to the target server
  const targetReq = new Request(targetUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  try {
    const response = await fetch(targetReq);

    // Clone the response and add CORS headers
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: responseHeaders,
      });
    }

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
