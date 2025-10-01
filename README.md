# CUSS2-ts

A TypeScript SDK for the Common Use Self-Service version 2 (CUSS2) platform that facilitates developing applications for
airline self-service kiosks.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![JSR Package](https://jsr.io/badges/@cuss/cuss2-ts)](https://jsr.io/@cuss/cuss2-ts)

## Overview

CUSS2-ts provides a robust TypeScript interface to interact with a CUSS2 platform, enabling developers to create
applications for self-service check-in, self-tagging, and self bag-drop terminals in the airline industry. This SDK
handles WebSocket communication, OAuth authentication, platform state management, and provides a clean API for
interacting with various peripheral devices.

## Browser Quickstart

Get started with CUSS2-ts in your browser in under 5 minutes:

### Option 1: Use the CDN Bundle

```html
<!DOCTYPE html>
<html>
  <head>
    <title>CUSS2 Quick Start</title>
  </head>
  <body>
    <h1>CUSS2 Platform Connection</h1>
    <button id="connect">Connect</button>
    <div id="status"></div>

    <!-- Load CUSS2-ts from JSR (via esm.sh) -->
    <script type="module">
      import { Cuss2 } from "https://esm.sh/jsr/@cuss/cuss2-ts@latest";

      document.getElementById("connect").addEventListener("click", async () => {
        const status = document.getElementById("status");
        status.textContent = "Connecting...";

        // Connect to your CUSS2 platform (uses default URL http://localhost:22222)
        const cuss2 = Cuss2.connect(
          "your-client-id", // Replace with your client ID
          "your-client-secret", // Replace with your client secret
          // Optional: provide custom WebSocket URL as 3rd parameter
          // "wss://your-platform.example.com"
        );

        // Wait for connection
        await cuss2.connected;
        status.textContent = `Connected! State: ${cuss2.state}`;

        // List available components
        console.log("Available components:", Object.keys(cuss2.components));

        // Request state transitions
        await cuss2.requestInitializeState();
        await cuss2.requestUnavailableState();
        status.textContent = `State: ${cuss2.state}`;
      });
    </script>
  </body>
</html>
```

### Option 2: Use the Pre-built Bundle

1. Download the latest bundle:

```bash
curl -O https://jsr.io/@cuss/cuss2-ts/latest/dist/cuss2.min.js
```

2. Include it in your HTML:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>CUSS2 Quick Start</title>
  </head>
  <body>
    <script src="cuss2.min.js"></script>
    <script>
      // Connect to the platform (uses default URL http://localhost:22222)
      const cuss2 = Cuss2.connect(
        "your-client-id", // Replace with your client ID
        "your-client-secret", // Replace with your client secret
        // Optional: provide custom WebSocket URL as 3rd parameter
        // "wss://your-platform.example.com"
      );

      // Wait for connection and interact
      cuss2.connected.then(async () => {
        console.log("Connected to CUSS2 platform!");
        console.log("Environment:", cuss2.environment);
        console.log("Components:", cuss2.components);

        // Work with components
        if (cuss2.barcodeReader) {
          await cuss2.barcodeReader.enable();
          cuss2.barcodeReader.on("data", (data) => {
            console.log("Barcode scanned:", data);
          });
        }
      });
    </script>
  </body>
</html>
```

### Try the Live Example

Check out the [basic browser example](docs/examples/basic-connection-browser.html) for a complete working demo with
connection status, logging, and error handling.

## Deno Quickstart

```typescript
import { Cuss2 } from "jsr:@cuss/cuss2-ts@latest";

const cuss2 = Cuss2.connect(
  "client-id",
  "client-secret",
  // Optional parameters:
  // "wss://cuss-platform.example.com",  // Custom WebSocket URL (default: https://localhost:22222)
  // "device-id",                         // Device ID (default: "00000000-0000-0000-0000-000000000000")
  // "https://oauth.example.com/token"    // OAuth token URL (default: wss location)
);

// Wait for connection to be established
await cuss2.connected;

// Now cuss2.environment and cuss2.components are populated
console.log("Environment:", cuss2.environment);

// Request state transitions
await cuss2.requestInitializeState();
await cuss2.requestUnavailableState();
await cuss2.requestAvailableState();

// Work with components
if (cuss2.barcodeReader) {
  await cuss2.barcodeReader.enable();
  cuss2.barcodeReader.on("data", (data) => {
    console.log("Barcode scanned:", data);
  });
}
```

## Features

- **Complete TypeScript Support**: Fully typed interfaces for all CUSS2 components and responses
- **WebSocket Communication**: Manages WebSocket lifecycle with automatic reconnection
- **OAuth Authentication**: Handles OAuth token acquisition and refresh
- **State Management**: Easily transition through application states (STOPPED, INITIALIZE, UNAVAILABLE, AVAILABLE,
  ACTIVE)
- **Component Management**: Interface with 30+ peripheral device types
- **Event-Driven Architecture**: Subscribe to events for state changes, component updates, and device data
- **Automatic State Synchronization**: Automatically manages state based on required component availability
- **Connection Resilience**: Built-in reconnection with exponential backoff
- **Deno-First Development**: Built specifically for the Deno runtime

## Core Concepts

### Application States

CUSS2 applications transition through defined states:

- `STOPPED`: Application is stopped
- `INITIALIZE`: Initial startup state
- `UNAVAILABLE`: Application is loaded but not available for passenger use
- `AVAILABLE`: Application is ready for passenger use
- `ACTIVE`: Application is actively being used by a passenger

State transitions follow specific rules:

- From `STOPPED` → `INITIALIZE` only
- From `INITIALIZE` → `UNAVAILABLE` only
- From `UNAVAILABLE` → `AVAILABLE` or back to `INITIALIZE`
- From `AVAILABLE` → `ACTIVE` or `UNAVAILABLE`
- From `ACTIVE` → `AVAILABLE` or `UNAVAILABLE`
- From any state → `STOPPED`

### Connection Lifecycle

```typescript
const cuss2 = Cuss2.connect(clientId, clientSecret, wss, deviceId, tokenUrl);
// Basic usage with defaults:
const cuss2 = Cuss2.connect("EAI", "secret");

// Connection events
cuss2.connection.on("connecting", (attempt) => console.log("Connecting...", attempt));
cuss2.connection.on("authenticating", (attempt) => console.log("Authenticating...", attempt));
cuss2.connection.on("authenticated", (auth) => console.log("Authenticated", auth));
cuss2.connection.on("open", () => console.log("WebSocket open"));
cuss2.connection.on("close", () => console.log("WebSocket closed"));
cuss2.connection.on("error", (error) => console.error("Connection error", error));

// Wait for connection to be ready
await cuss2.connected;
```

### State Management

```typescript
// Request state transitions
await cuss2.requestInitializeState(); // From STOPPED
await cuss2.requestUnavailableState(); // From INITIALIZE, AVAILABLE, or ACTIVE
await cuss2.requestAvailableState(); // From UNAVAILABLE or ACTIVE
await cuss2.requestActiveState(); // From AVAILABLE or ACTIVE
await cuss2.requestStoppedState(); // From any state

// Listen for state changes
cuss2.on("stateChange", (stateChange) => {
  console.log(`State changed from ${stateChange.previous} to ${stateChange.current}`);
});

// Get current state
console.log("Current state:", cuss2.state);

// Special state transitions
cuss2.on("activated", (activationData) => {
  console.log("Application activated", activationData);
  console.log("Multi-tenant mode:", cuss2.multiTenant);
  console.log("Accessible mode:", cuss2.accessibleMode);
  console.log("Language:", cuss2.language);
});

cuss2.on("deactivated", (newState) => {
  console.log("Application deactivated, new state:", newState);
});
```

### Component Types

The SDK supports all CUSS2 peripheral types:

**Printers**

- `BagTagPrinter` - Prints bag tags
- `BoardingPassPrinter` - Prints boarding passes

**Data Readers**

- `BarcodeReader` - Reads 1D/2D barcodes
- `CardReader` - Reads magnetic stripe and chip cards
- `DocumentReader` - Reads travel documents
- `RFID` - Reads RFID tags

**Input Devices**

- `Keypad` - Physical or virtual keypads
- `Biometric` - Fingerprint/facial recognition
- `Camera` - Image capture

**Baggage Handling**

- `Scale` - Weighs baggage
- `InsertionBelt` - Bag drop insertion
- `VerificationBelt` - Bag verification
- `ParkingBelt` - Bag parking position
- `BHS` - Baggage handling system interface
- `AEASBD` - Automated equipment for self bag drop

**Output/Feedback**

- `Announcement` - Audio announcements
- `Illumination` - LED indicators
- `Headset` - Audio output device

**Printer Support Components**

- `Feeder` - Paper/card feeder for printers
- `Dispenser` - Output dispenser for printers

### Component Discovery and Access

Components are automatically discovered during initialization:

```typescript
// Access specific component types directly
const reader = cuss2.barcodeReader;
const printer = cuss2.boardingPassPrinter;

// Access all components via the components collection
const components = cuss2.components; // Record<string, Component>

// Iterate through all components
Object.entries(components).forEach(([id, component]) => {
  console.log(`Component ${id}:`, {
    type: component.constructor.name,
    ready: component.ready,
    enabled: component.enabled,
    required: component.required,
  });
});
```

### Component Usage

All components follow a similar pattern:

```typescript
// 1. Query component status
const status = await component.query();

// 2. Enable the component
await component.enable();

// 3. Use component-specific methods
// For data readers:
component.on("data", (data) => {
  console.log("Data received:", data);
});

// For printers:
await printer.send(dataRecords);

// 4. Disable when done
await component.disable();
```

### Required Components and Auto State Management

Mark components as required to enable automatic state management:

```typescript
// Mark components as required
cuss2.barcodeReader.required = true;
cuss2.boardingPassPrinter.required = true;

// The SDK will automatically:
// - Transition to UNAVAILABLE if any required component becomes unavailable
// - Transition to AVAILABLE when all required components are ready

// Check unavailable components
const unavailable = cuss2.unavailableComponents;
const unavailableRequired = cuss2.unavailableRequiredComponents;

// Manually trigger state sync
cuss2.checkRequiredComponentsAndSyncState();

// Control online/offline status
cuss2.applicationOnline = true; // Triggers state sync
```

## Component Examples

### Barcode Reader

```typescript
const reader = cuss2.barcodeReader;
if (reader) {
  // Enable and listen for data
  await reader.enable();

  reader.on("data", (data) => {
    console.log("Barcode:", data.rawData);
    console.log("Format:", data.symbology);
  });

  // Disable when done
  await reader.disable();
}
```

### Boarding Pass Printer

```typescript
const printer = cuss2.boardingPassPrinter;
if (printer) {
  await printer.enable();

  // Send print data
  const printData = [{
    data: "M1DOE/JOHN...", // IATA BCBP format
    dsTypes: [CussDataTypes.IATA_BCBP],
  }];

  await printer.send(printData);

  await printer.disable();
}
```

### Scale

```typescript
const scale = cuss2.scale;
if (scale) {
  await scale.enable();

  scale.on("data", (weight) => {
    console.log("Weight:", weight.weight, weight.unit);
    console.log("Stable:", weight.stable);
  });

  await scale.disable();
}
```

### Announcement

```typescript
const announcement = cuss2.announcement;
if (announcement) {
  await announcement.enable();

  // Play SSML announcement
  await announcement.play("<speak>Welcome to the self-service kiosk.</speak>");

  // Control playback
  await announcement.pause();
  await announcement.resume();
  await announcement.stop();

  await announcement.disable();
}
```

## Event Handling

The SDK uses an event-driven architecture:

```typescript
// Connection events
cuss2.connection.on("open", () => {});
cuss2.connection.on("close", () => {});
cuss2.connection.on("error", (error) => {});
cuss2.connection.on("message", (data) => {});

// Platform events
cuss2.on("connected", (cuss2) => {});
cuss2.on("stateChange", (stateChange) => {});
cuss2.on("activated", (activationData) => {});
cuss2.on("deactivated", (newState) => {});
cuss2.on("message", (platformData) => {});
cuss2.on("sessionTimeout", (environment) => {});
cuss2.on("componentStateChange", (component) => {});
cuss2.on("queryError", (error) => {});

// Component events
component.on("data", (data) => {});
component.on("stateChange", (state) => {});
component.on("statusChange", (status) => {});
```

## Advanced Usage

### Environment Information

```typescript
const env = cuss2.environment;
console.log("Device ID:", env.deviceID);
console.log("CUSS Version:", env.cuss2Version);
console.log("Location:", env.locationCode);
console.log("Capabilities:", env.platformCapabilities);
```

### Session Management

```typescript
// Handle session timeout
cuss2.on("sessionTimeout", (environment) => {
  const killTimeout = environment.killTimeout; // Time until app termination
  console.log(`Session timeout warning - app will be killed in ${killTimeout} seconds`);
  // Implement re-authentication or cleanup
});

// Request reload (closes connection)
await cuss2.requestReload();
```

### Error Handling

```typescript
try {
  await cuss2.boardingPassPrinter.enable();
}
catch (error) {
  if (error.code === MessageCodes.MEDIA_NOTREADY) {
    console.log("Printer out of paper");
  }
  else if (error.code === MessageCodes.DEVICE_NOTOPERATIONAL) {
    console.log("Printer not operational");
  }
}
```

## Building

### JavaScript Browser Bundle

Build browser-compatible JavaScript bundles:

```bash
# Build the JavaScript bundles
deno task build
```

This creates:

- `dist/cuss2.js` - Full browser bundle
- `dist/cuss2.min.js` - Minified bundle with source map

### Using the Browser Bundle

```html
<script src="dist/cuss2.js"></script>
<script>
  // The global Cuss2 object contains all exports
  const cuss2 = Cuss2.connect(
    "client-id",
    "client-secret",
    // Optional: custom WebSocket URL as 3rd parameter
    // "wss://platform.example.com"
  );

  // All models are available under Cuss2.Models
  const { ApplicationStateCodes, MessageCodes } = Cuss2.Models;

  // Wait for connection
  cuss2.connected.then(() => {
    console.log("Connected!");
  });
</script>
```

## Testing

```bash
# Run all tests
deno task test
```

## Pre-Commit Checks

You MUST run these checks before committing code:

```bash
deno check
deno lint
deno fmt --check
deno task test
deno task build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
