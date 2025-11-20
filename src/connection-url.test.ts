import { assertEquals } from "@std/assert";
import { Connection } from "./connection.ts";

Deno.test("Connection URL handling - extracts base URL correctly", () => {
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
      input: "https://localhost:22222/platform/subscribe",
      expectedTokenUrl: "https://localhost:22222/oauth/token",
      description: "URL with path should extract base",
    },
    {
      input: "wss://localhost:22222/platform/subscribe",
      expectedTokenUrl: "https://localhost:22222/oauth/token",
      description: "WSS URL with path should extract base and convert to HTTPS",
    },
    {
      input: "ws://localhost:22222/platform/subscribe",
      expectedTokenUrl: "http://localhost:22222/oauth/token",
      description: "WS URL with path should extract base and convert to HTTP",
    },
    {
      input: "https://localhost:22222/some/deep/path/here",
      expectedTokenUrl: "https://localhost:22222/oauth/token",
      description: "URL with deep path should extract base",
    },
    {
      input: "https://localhost:22222/path?query=params&foo=bar",
      expectedTokenUrl: "https://localhost:22222/oauth/token",
      description: "URL with path and query params should extract base",
    },
    {
      input: "https://localhost:22222/path#fragment",
      expectedTokenUrl: "https://localhost:22222/oauth/token",
      description: "URL with path and fragment should extract base",
    },
    {
      input: "https://api.example.com:8080",
      expectedTokenUrl: "https://api.example.com:8080/oauth/token",
      description: "Different host and port",
    },
    {
      input: "https://api.example.com:8080/v1/platform/subscribe",
      expectedTokenUrl: "https://api.example.com:8080/oauth/token",
      description: "Different host with versioned API path",
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
      expectedWsUrl: "wss://localhost:22222",
      description: "HTTPS should convert to WSS",
    },
    {
      input: "http://localhost:22222",
      expectedWsUrl: "ws://localhost:22222",
      description: "HTTP should convert to WS",
    },
    {
      input: "https://localhost:22222/not_ignored/path",
      expectedWsUrl: "wss://localhost:22222/not_ignored/path",
      description: "Should strip path and use base URL",
    },
    {
      input: "ws://localhost:22222/not_ignored/path",
      expectedWsUrl: "ws://localhost:22222/not_ignored/path",
      description: "WS URL should strip path and stay WS",
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
