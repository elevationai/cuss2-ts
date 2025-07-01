// For Deno runtime, import from npm:ws
// For browser builds, this file is redirected to WebSocket.browser.ts
import { WebSocket } from "npm:ws@8";
globalThis.WebSocket = WebSocket;
