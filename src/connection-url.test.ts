import { assertEquals } from "@std/assert";
import { Connection } from "./connection.ts";

Deno.test("Connection URL handling - preserves base URL paths correctly", () => {
  const testCases = [
    {
      input: "https://localhost:22222",
      expectedTokenUrl: "https://localhost:22222/oauth/token",
      description: "Base URL without path",
    },
    {
      input: "https://localhost:22222/",
      expectedTokenUrl: "https://localhost:22222/oauth/token",
      description: "Base URL with trailing slash",
    },
    {
      input: "https://localhost:22222/api",
      expectedTokenUrl: "https://localhost:22222/api/oauth/token",
      description: "URL with path should preserve path",
    },
    {
      input: "wss://localhost:22222/api",
      expectedTokenUrl: "https://localhost:22222/api/oauth/token",
      description: "WSS URL with path should preserve path and convert to HTTPS",
    },
    {
      input: "ws://localhost:22222/api",
      expectedTokenUrl: "http://localhost:22222/api/oauth/token",
      description: "WS URL with path should preserve path and convert to HTTP",
    },
    {
      input: "https://localhost:22222/some/deep/path",
      expectedTokenUrl: "https://localhost:22222/some/deep/path/oauth/token",
      description: "URL with deep path should preserve entire path",
    },
    {
      input: "https://localhost:22222/path?query=params&foo=bar",
      expectedTokenUrl: "https://localhost:22222/path/oauth/token",
      description: "URL with path and query params should preserve path but strip query",
    },
    {
      input: "https://localhost:22222/path#fragment",
      expectedTokenUrl: "https://localhost:22222/path/oauth/token",
      description: "URL with path and fragment should preserve path but strip fragment",
    },
    {
      input: "https://api.example.com:8080",
      expectedTokenUrl: "https://api.example.com:8080/oauth/token",
      description: "Different host and port",
    },
    {
      input: "https://api.example.com:8080/v1",
      expectedTokenUrl: "https://api.example.com:8080/v1/oauth/token",
      description: "Different host with versioned API path should preserve path",
    },
  ];

  for (const testCase of testCases) {
    const connection = new Connection(
      testCase.input,
      "test-client",
      "test-secret",
      "device-123",
    );

    // Access private property for testing
    // @ts-ignore: Accessing private _auth property to verify token URL generation
    const actualTokenUrl = connection._auth.url;

    assertEquals(
      actualTokenUrl,
      testCase.expectedTokenUrl,
      `Failed for: ${testCase.description}\nInput: ${testCase.input}`,
    );
  }
});

Deno.test("Connection URL handling - respects explicit token URL", () => {
  // When token URL is explicitly provided, it should use that instead of auto-generating
  const connection = new Connection(
    "https://localhost:22222/platform/subscribe",
    "test-client",
    "test-secret",
    "device-123",
    "https://auth.example.com/token", // Explicit token URL
  );

  // Access private property for testing
  // @ts-ignore: Accessing private _auth property to verify token URL generation
  const actualTokenUrl = connection._auth.url;

  assertEquals(
    actualTokenUrl,
    "https://auth.example.com/token",
    "Should use explicit token URL when provided",
  );
});

Deno.test("Connection URL handling - WebSocket URL construction", () => {
  const testCases = [
    {
      input: "https://localhost:22222",
      expectedWsUrl: "wss://localhost:22222/platform/subscribe",
      description: "HTTPS should convert to WSS",
    },
    {
      input: "http://localhost:22222",
      expectedWsUrl: "ws://localhost:22222/platform/subscribe",
      description: "HTTP should convert to WS",
    },
    {
      input: "https://localhost:22222/api",
      expectedWsUrl: "wss://localhost:22222/api/platform/subscribe",
      description: "Should preserve path when constructing WebSocket URL",
    },
    {
      input: "wss://localhost:22222",
      expectedWsUrl: "wss://localhost:22222/platform/subscribe",
      description: "WSS URL should stay WSS",
    },
    {
      input: "ws://localhost:22222/api",
      expectedWsUrl: "ws://localhost:22222/api/platform/subscribe",
      description: "WS URL should preserve path and stay WS",
    },
  ];

  for (const testCase of testCases) {
    const connection = new Connection(
      testCase.input,
      "test-client",
      "test-secret",
      "device-123",
    );

    // Access private property for testing
    // @ts-ignore: Accessing private _socketURL property to verify WebSocket URL generation
    const actualWsUrl = connection._socketURL;

    assertEquals(
      actualWsUrl,
      testCase.expectedWsUrl,
      `Failed for: ${testCase.description}\nInput: ${testCase.input}`,
    );
  }
});
