// WebSocket polyfill for Deno (browsers have native WebSocket)
// @ts-ignore - Deno.env check
if (typeof Deno !== "undefined" && Deno.env) {
  // Running in Deno, need to import ws
  const { WebSocket } = await import("npm:ws@8");
  globalThis.WebSocket = WebSocket;
}
// In browsers, WebSocket is already available globally
