# CUSS2 DevTools Client Library

A standalone library for communicating with the CUSS2 platform's `/devtools` WebSocket endpoint to control mock devices and monitor platform messages.

## Features

- WebSocket connection management with automatic reconnection
- Send device commands to any component by ID
- Receive and handle platform messages
- Event-based message distribution
- Message buffering during disconnection
- Optional authentication support
- Full TypeScript support

## Quick Start

```typescript
import { CUSS2DevToolsClient } from "./devtools/mod.ts";

// Create client
const client = new CUSS2DevToolsClient({
  url: "ws://localhost:8080/devtools",
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
});

// Set up event handlers
client.on("connected", () => {
  console.log("Connected to CUSS2 platform");
});

client.on("component_message", (componentId, message) => {
  console.log(`Component ${componentId}:`, message);
});

// Connect
await client.connect();

// Send commands using component IDs
await client.cmd(1, "scan", { data: "1234567890" });
await client.cmd(2, "power", { state: "OFF" });

// Disconnect
client.disconnect();
```

## API Reference

### Component Type Detection

The library includes `ComponentInterrogation` from the main cuss2-ts library to help identify component types:

```typescript
import { ComponentInterrogation, CUSS2DevToolsClient } from "./devtools/mod.ts";

client.on("components", (components) => {
  components.forEach((component) => {
    if (ComponentInterrogation.isBarcodeReader(component)) {
      console.log("Found barcode reader:", component.id);
    }
  });
});
```

### Constructor

```typescript
new CUSS2DevToolsClient(options: ConnectionOptions)
```

#### ConnectionOptions

- `url` (string, required): WebSocket URL (e.g., `ws://localhost:8080/devtools`)
- `auth` (object, optional): Authentication credentials
  - `url`: Auth server URL
  - `client_id`: Client ID
  - `client_secret`: Client secret
- `reconnectInterval` (number, optional): Reconnection delay in ms (default: 2000)
- `maxReconnectAttempts` (number, optional): Max reconnection attempts (default: Infinity)
- `bufferSize` (number, optional): Message buffer size (default: 100)

### Methods

#### `connect(): Promise<void>`

Establishes connection to the CUSS2 platform.

#### `disconnect(): void`

Closes the connection and cleans up resources.

#### `cmd(componentId: number, action: string, args: Record<string, unknown>): Promise<void>`

Sends a command to a specific component.

#### `send(message: any): Promise<void>`

Sends a raw message (for advanced usage).

#### `on(event: string, handler: Function): void`

Registers an event handler.

#### `off(event: string, handler: Function): void`

Removes an event handler.

#### `isConnected(): boolean`

Returns true if connected.

#### `getConnectionState(): string`

Returns current connection state: "CONNECTING", "CONNECTED", "CLOSING", or "CLOSED".

### Events

- `connected`: Fired when connected to platform
- `disconnected`: Fired when disconnected (includes reason)
- `message`: Fired for all platform messages
- `error`: Fired on errors
- `environment`: Fired when environment data is received
- `components`: Fired when component list is received
- `component_message`: Fired for component-specific messages
- `tenant_update`: Fired when tenant/brand state changes

## Device Commands

The library provides a generic `cmd` method that works with any device type. Component IDs are assigned by your platform configuration.

### Example Commands

```typescript
// Barcode Scanner Commands
await client.cmd(1, "scan", { data: "ABC123" });
await client.cmd(1, "power", { state: "ON" });

// Printer Commands
await client.cmd(2, "set_state", {
  cover_open: false,
  out: false,
  jammed: false,
  present: true,
});

// Keypad Commands
await client.cmd(3, "keydown", { keyname: "ENTER" });
await client.cmd(3, "keyup", { keyname: "ENTER" });

// Headset Commands
await client.cmd(4, "inserted", {});
await client.cmd(4, "removed", {});
```

## Error Handling

The library provides detailed error information through the `ClientError` class:

```typescript
client.on("error", (error) => {
  switch (error.type) {
    case "CONNECTION_FAILED":
      console.error("Failed to connect:", error.message);
      break;
    case "COMMAND_FAILED":
      console.error("Command failed:", error.message);
      break;
    case "VALIDATION_ERROR":
      console.error("Invalid input:", error.message);
      break;
    case "WEBSOCKET_ERROR":
      console.error("WebSocket error:", error.message);
      break;
  }
});
```

## Requirements

- Deno >= 1.38.0
- CUSS2 platform with `/devtools` endpoint enabled
