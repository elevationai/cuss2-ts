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

Deno.test("Connection URL handling - OAuth and WebSocket on different origins", () => {
  const testCases = [
    {
      baseUrl: "wss://ws.platform.com/api",
      tokenUrl: "https://auth.platform.com/v1/oauth/token",
      expectedOAuthUrl: "https://auth.platform.com/v1/oauth/token",
      expectedWsUrl: "wss://ws.platform.com/api/platform/subscribe",
      description: "WebSocket on ws.platform.com, OAuth on auth.platform.com",
    },
    {
      baseUrl: "https://api.example.com/v2",
      tokenUrl: "https://oauth.different-domain.com/token",
      expectedOAuthUrl: "https://oauth.different-domain.com/token",
      expectedWsUrl: "wss://api.example.com/v2/platform/subscribe",
      description: "Completely different domains for OAuth and WebSocket",
    },
    {
      baseUrl: "wss://platform.internal:8443/cuss",
      tokenUrl: "http://auth.internal:9000/api/v1/auth/token",
      expectedOAuthUrl: "http://auth.internal:9000/api/v1/auth/token",
      expectedWsUrl: "wss://platform.internal:8443/cuss/platform/subscribe",
      description: "Different hosts and ports with paths",
    },
    {
      baseUrl: "ws://localhost:3000/platform/subscribe",
      tokenUrl: "http://localhost:8080/auth/oauth/token",
      expectedOAuthUrl: "http://localhost:8080/auth/oauth/token",
      expectedWsUrl: "ws://localhost:3000/platform/subscribe",
      description: "Same host different ports, WS URL already has /platform/subscribe",
    },
  ];

  for (const testCase of testCases) {
    const connection = new Connection(
      testCase.baseUrl,
      "test-client",
      "test-secret",
      "device-123",
      testCase.tokenUrl,
    );

    // @ts-ignore: Accessing private properties for testing
    const actualOAuthUrl = connection._auth.url;
    // @ts-ignore: Accessing private properties for testing
    const actualWsUrl = connection._socketURL;

    assertEquals(
      actualOAuthUrl,
      testCase.expectedOAuthUrl,
      `OAuth URL failed for: ${testCase.description}`,
    );

    assertEquals(
      actualWsUrl,
      testCase.expectedWsUrl,
      `WebSocket URL failed for: ${testCase.description}`,
    );
  }
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
      input: "https://localhost:22222/some/path",
      expectedWsUrl: "wss://localhost:22222/some/path/platform/subscribe",
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
