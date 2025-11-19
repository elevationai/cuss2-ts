import { assertEquals } from "@std/assert";
import { Connection } from "./connection.ts";

Deno.test("Connection URL handling - preserves path and appends endpoints correctly", () => {
  const testCases = [
    {
      input: "https://localhost:22222",
      expectedTokenUrl: "https://localhost:22222/oauth/token",
      expectedWsUrl: "wss://localhost:22222/platform/subscribe",
      description: "Base URL without path",
    },
    {
      input: "https://localhost:22222",
      oauthInput: "https://custom-auth.example.com/oauth/token",
      expectedTokenUrl: "https://custom-auth.example.com/oauth/token",
      expectedWsUrl: "wss://localhost:22222/platform/subscribe",
      description: "Base URL without path with custom OAuth URL",
    },
    {
      input: "https://localhost:22222",
      oauthInput: "https://custom-auth.example.com/",
      expectedTokenUrl: "https://custom-auth.example.com/oauth/token",
      expectedWsUrl: "wss://localhost:22222/platform/subscribe",
      description: "Base URL without path with custom OAuth URL without token endpoint specified",
    },
    {
      input: "wss://localhost:22222",
      oauthInput: "https://localhost:22222/token",
      expectedTokenUrl: "https://localhost:22222/oauth/token",
      expectedWsUrl: "wss://localhost:22222/platform/subscribe",
      description: "Oauth URL with incorrect oauth endpoint specified",
    },
    {
      input: "https://localhost:22222/",
      expectedTokenUrl: "https://localhost:22222/oauth/token",
      expectedWsUrl: "wss://localhost:22222/platform/subscribe",
      description: "Base URL with trailing slash",
    },
    {
      input: "https://localhost:22222/api",
      expectedTokenUrl: "https://localhost:22222/api/oauth/token",
      expectedWsUrl: "wss://localhost:22222/api/platform/subscribe",
      description: "URL with path should preserve it",
    },
    {
      input: "https://localhost:22222/api/v1",
      expectedTokenUrl: "https://localhost:22222/api/v1/oauth/token",
      expectedWsUrl: "wss://localhost:22222/api/v1/platform/subscribe",
      description: "URL with versioned path should preserve it",
    },
    {
      input: "wss://localhost:22222/api",
      expectedTokenUrl: "https://localhost:22222/api/oauth/token",
      expectedWsUrl: "wss://localhost:22222/api/platform/subscribe",
      description: "WSS URL with path should preserve path and convert to HTTPS for OAuth",
    },
    {
      input: "ws://localhost:22222/api",
      expectedTokenUrl: "http://localhost:22222/api/oauth/token",
      expectedWsUrl: "ws://localhost:22222/api/platform/subscribe",
      description: "WS URL with path should preserve path and convert to HTTP for OAuth",
    },
    {
      input: "https://localhost:22222/path?query=params&foo=bar",
      expectedTokenUrl: "https://localhost:22222/path/oauth/token",
      expectedWsUrl: "wss://localhost:22222/path/platform/subscribe",
      description: "URL with path and query params should preserve path but strip query",
    },
    {
      input: "https://localhost:22222/path#fragment",
      expectedTokenUrl: "https://localhost:22222/path/oauth/token",
      expectedWsUrl: "wss://localhost:22222/path/platform/subscribe",
      description: "URL with path and fragment should preserve path but strip fragment",
    },
    {
      input: "https://api.example.com:8080",
      expectedTokenUrl: "https://api.example.com:8080/oauth/token",
      expectedWsUrl: "wss://api.example.com:8080/platform/subscribe",
      description: "Different host and port without path",
    },
    {
      input: "https://api.example.com:8080/v1",
      expectedTokenUrl: "https://api.example.com:8080/v1/oauth/token",
      expectedWsUrl: "wss://api.example.com:8080/v1/platform/subscribe",
      description: "Different host with versioned API path",
    },
    {
      input: "https://api.example.com:8080/v1?query=param",
      expectedTokenUrl: "https://api.example.com:8080/v1/oauth/token",
      expectedWsUrl: "wss://api.example.com:8080/v1/platform/subscribe",
      description: "Different host with versioned API path and query params",
    },
    {
      input: "https://api.example.com:8080/v1",
      oauthInput: "https://custom-auth.example.com/oauth/token",
      expectedTokenUrl: "https://custom-auth.example.com/oauth/token",
      expectedWsUrl: "wss://api.example.com:8080/v1/platform/subscribe",
      description: "Different host with custom OAuth URL provided",
    },
  ];

  for (const testCase of testCases) {
    const connection = new Connection(
      testCase.input,
      "test-client",
      "test-secret",
      "device-123",
      testCase.oauthInput,
    );

    // Access private property for testing
    // @ts-ignore: Accessing private _auth property to verify token URL generation
    const actualTokenUrl = connection._auth.url;
    // @ts-ignore: Accessing private _socketURL property to verify WebSocket URL generation
    const actualWsUrl = connection._socketURL;

    assertEquals(
      actualTokenUrl,
      testCase.expectedTokenUrl,
      `Failed for OAuth URL: ${testCase.description}\nInput: ${testCase.input}`,
    );

    assertEquals(
      actualWsUrl,
      testCase.expectedWsUrl,
      `Failed for WebSocket URL: ${testCase.description}\nInput: ${testCase.input}`,
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
    "https://auth.example.com/api/oauth/token", // Explicit token URL
  );

  // Access private property for testing
  // @ts-ignore: Accessing private _auth property to verify token URL generation
  const actualTokenUrl = connection._auth.url;

  assertEquals(
    actualTokenUrl,
    "https://auth.example.com/api/oauth/token",
    "Should use explicit token URL when provided",
  );
});

Deno.test("Connection URL handling - respects existing endpoints", () => {
  // Test URL that already has /platform/subscribe endpoint
  const wsConnection = new Connection(
    "https://localhost:22222/api/platform/subscribe",
    "test-client",
    "test-secret",
    "device-123",
  );

  // @ts-ignore: Accessing private _socketURL property
  const wsUrl = wsConnection._socketURL;
  const tokenUrl = wsConnection._auth.url;

  assertEquals(
    wsUrl,
    "wss://localhost:22222/api/platform/subscribe",
    "Should not modify URL that already has /platform/subscribe endpoint",
  );

  assertEquals(
    tokenUrl,
    "https://localhost:22222/api/oauth/token",
    "Should modify OAuth URL to add /oauth/token endpoint",
  );

  // Test URL that already has /oauth/token endpoint
  const authConnection = new Connection(
    "https://localhost:22222/api/oauth/token",
    "test-client",
    "test-secret",
    "device-123",
  );

  // @ts-ignore: Accessing private _auth property
  const tokenUrl2 = authConnection._auth.url;
  const wsUrl2 = authConnection._socketURL;

  assertEquals(
    wsUrl2,
    "wss://localhost:22222/api/platform/subscribe",
    "Should modify websocket URL if only supplied with /oauth/token",
  );

  assertEquals(
    tokenUrl2,
    "https://localhost:22222/api/oauth/token",
    "Should not modify OAuth URL that already has /oauth/token endpoint",
  );
});
