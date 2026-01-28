#!/usr/bin/env -S deno run --allow-net

import { ComponentInterrogation, CUSS2DevToolsClient } from "../mod.ts";

const client = new CUSS2DevToolsClient({
  url: "ws://localhost:22222/devtools",
});

let scannerId: number | null = null;

client.on("components", (components) => {
  const scanner = components.find((c) => ComponentInterrogation.isBarcodeReader(c));
  if (scanner?.componentID) {
    scannerId = Number(scanner.componentID);
    console.log(`Found scanner: ID ${scannerId}`);
  }
});

await client.connect();
await new Promise((r) => setTimeout(r, 1000)); // Wait for components

if (scannerId) {
  // Simulate scanning different barcode types
  const barcodes = [
    { data: "M1DOE/JOHN  ABC123", type: "PDF417" }, // Boarding pass
    { data: "0016123456789", type: "CODE128" }, // Bag tag
    { data: "FF987654321", type: "CODE39" }, // Frequent flyer
  ];

  for (const barcode of barcodes) {
    console.log(`Scanning ${barcode.type}...`);
    client.cmd(scannerId, "scan", barcode);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

client.disconnect();
