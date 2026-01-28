#!/usr/bin/env -S deno run --allow-net

import { ComponentInterrogation, CUSS2DevToolsClient, getComponentType } from "../mod.ts";

const client = new CUSS2DevToolsClient({
  url: "ws://localhost:22222/devtools",
});

let scannerId: number | null = null;
let printerId: number | null = null;

client.on("connected", () => console.log("Connected"));
client.on("components", (components) => {
  components.forEach((c) => {
    const type = getComponentType(c);
    console.log(`Found ${type}: ID ${c.componentID}`);

    // Store component IDs for later use
    if (ComponentInterrogation.isBarcodeReader(c)) {
      scannerId = Number(c.componentID);
    }
    if (ComponentInterrogation.isBoardingPassPrinter(c)) {
      printerId = Number(c.componentID);
    }
  });
});

await client.connect();
await new Promise((r) => setTimeout(r, 1000)); // Wait for components

// Send commands to discovered devices
if (scannerId) {
  client.cmd(scannerId, "scan", { data: "ABC123" });
}
if (printerId) {
  client.cmd(printerId, "power", { state: "ON" });
}

setTimeout(() => client.disconnect(), 5000);
