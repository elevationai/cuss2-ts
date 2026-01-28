// WebSocket polyfill for Deno (browsers have native WebSocket)
// @ts-ignore - Deno.env check
if (typeof Deno !== "undefined" && Deno.env) {
  // Running in Deno, need to import ws
  // top-level await not allowed in modules, so wrap in IIFE
  (async function () {
    const { WebSocket } = await import("ws");
    globalThis.WebSocket = WebSocket;
  })();
}
