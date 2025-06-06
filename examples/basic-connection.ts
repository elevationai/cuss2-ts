// deno run --allow-net examples/basic-connection.ts

import { Cuss2 } from "../mod.ts";

// Example configuration - replace with your actual values
const config = {
  wss: "http://localhost:22222",
  clientId: "KAP",
  clientSecret: "secret",
  deviceID: undefined, // Optional, defaults to "00000000-0000-0000-0000-000000000000"
  tokenURL: 'http://localhost:22222/oauth/token', // Optional - will default the wss location if not provided
};

async function main() {
  // Connect to the CUSS2 platform
  console.log("Connecting to CUSS2 platform...");
  const cuss2 = Cuss2.connect(
    config.wss,
    config.clientId,
    config.clientSecret,
    config.deviceID,
    config.tokenURL,
  );

  // At this point, you have a Cuss2 instance - but it will be in the process
  // of trying to connect. You can listen for events to know when it's ready.
  cuss2.connection.on('connecting', (attemptCount) => console.log('Connecting to WebSocket... Attempt:', attemptCount))
  cuss2.connection.on('authenticating', (attemptCount) => console.log('Authenticating... Attempt:', attemptCount))
  cuss2.connection.once('authenticated', (auth) => console.log('Authenticated:', auth))

  try {
    console.log('Waiting for connection to be established...');
    await cuss2.connected;

    // Now the connection is established.
    // cuss2.environment & cuss2.components will now be populated
    console.log("Connected successfully!");

    // Log the environment information
    console.log("CUSS2 Environment:", cuss2.environment);

    // Request initialize state
    console.log("Requesting initialize state...");
    await cuss2.requestInitializeState();
    console.log("Initialize state requested successfully!");

    // Keep the connection alive for demonstration
    // In a real application, you would continue with your business logic
    console.log("Connection established. Press Ctrl+C to exit.");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the example
if (import.meta.main) {
  main();
}
