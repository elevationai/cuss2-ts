import { assertEquals, assertExists, assertRejects, assertStringIncludes } from "jsr:@std/assert";
import { delay } from "jsr:@std/async/delay";

import { Connection, global } from "./connection.ts";
import { AuthenticationError } from "./models/Errors.ts";
import { PlatformResponseError } from "./models/platformResponseError.ts";
import { MessageCodes, PlatformDirectives } from "cuss2-typescript-models";

// Mock for the WebSocket class
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string = "";
  readyState: number = MockWebSocket.CONNECTING;

  // Event handlers
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  // Tracking for testing
  sentMessages: string[] = [];

  // Methods
  close(code = 1000, reason = ""): void {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent("close", { code, reason }));
  }

  send(data: string): void {
    if (typeof data === "string") {
      this.sentMessages.push(data);
    }
  }

  // Helper methods for testing

  // Simulate receiving a message
  simulateMessage(data: string): void {
    this.onmessage?.(new MessageEvent("message", { data }));
  }

  // Simulate connection opening
  _simulateOpen(): void {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }
}

// Mock response for fetch
class MockResponse {
  _status: number;
  _data: unknown;

  constructor(status: number, data: unknown) {
    this._status = status;
    this._data = data;
  }

  get status(): number {
    return this._status;
  }

  json(): Promise<unknown> {
    return Promise.resolve(this._data);
  }
}

// Common test values
const testDeviceId = "device-123";
const testClientId = "client-id";
const testClientSecret = "client-secret";
const testBaseUrl = "https://example.com/api";
const testTokenUrl = "https://example.com/api/oauth/token";
const testToken = "test-token";

function mockGlobal(fn: () => Promise<unknown>): () => Promise<void> {
  const originalWebSocket = globalThis.WebSocket;
  return async () => {
    try {
      await fn();
    }
    finally {
      // Restore original WebSocket
      // @ts-ignore - restore for tests
      globalThis.WebSocket = originalWebSocket;
      global.fetch = globalThis.fetch;
      global.setTimeout = globalThis.setTimeout.bind(globalThis);
      global.clearTimeout = globalThis.clearTimeout.bind(globalThis);
    }
  };
}

function mockWebSocket(action?: (ws: MockWebSocket) => (() => void) | undefined): MockWebSocket {
  const mockWs = new MockWebSocket();
  function creator(url: string) {
    mockWs.url = url;
    const a = action && action(mockWs);
    const deferredWork = a || (() => mockWs._simulateOpen());
    delay(10).then(deferredWork);
    return mockWs;
  }
  creator.prototype = MockWebSocket.prototype;

  //@ts-ignore - Mock WebSocket for testing
  globalThis.WebSocket = creator;
  return mockWs;
}

function mockFetch(options?: { action?: () => void; status?: number; token?: string; expires_in?: number }) {
  const { action = () => {}, status = 200, token = testToken, expires_in = 3600 } = options || {};

  global.fetch = () => {
    action();
    return Promise.resolve(
      new MockResponse(status, {
        access_token: token,
        expires_in,
        token_type: "Bearer",
      }) as unknown as Response,
    );
  };
}

// Tests for the Connection class

// Test for Connection.authorize (now private instance method)
Deno.test(
  "authorize should get and return a token with event emissions",
  mockGlobal(async () => {
    let fetchCalled = false;
    let authenticatingEmitted = false;
    let authenticatingAttempt = 0;
    let authenticatedEmitted = false;
    // deno-lint-ignore no-explicit-any
    let authenticatedData: any = null;

    global.fetch = (url: string | URL | Request, options?: RequestInit) => {
      fetchCalled = true;
      // Verify correct URL and options
      assertEquals(url, testTokenUrl);
      assertEquals(options?.method, "POST");
      // Type assertion for header key
      assertEquals(
        (options?.headers as Record<string, string>)?.["Content-Type"],
        "application/x-www-form-urlencoded",
      );

      // Extract and verify body parameters
      const bodyParams = new URLSearchParams(options?.body as string);
      assertEquals(bodyParams.get("client_id"), testClientId);
      assertEquals(bodyParams.get("client_secret"), testClientSecret);
      assertEquals(bodyParams.get("grant_type"), "client_credentials");

      // Return a successful response
      return Promise.resolve(
        new MockResponse(200, {
          access_token: testToken,
          expires_in: 3600,
          token_type: "Bearer",
        }) as unknown as Response,
      );
    };

    const connection = new Connection(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    // Listen for events
    connection.on("authenticating", (attempt) => {
      authenticatingEmitted = true;
      authenticatingAttempt = attempt;
    });

    connection.on("authenticated", (data) => {
      authenticatedEmitted = true;
      authenticatedData = data;
    });

    // @ts-ignore - Accessing private method for testing
    const result = await connection.authorize();

    assertEquals(fetchCalled, true);
    assertEquals(authenticatingEmitted, true);
    assertEquals(authenticatingAttempt, 1);
    assertEquals(authenticatedEmitted, true);
    assertEquals(authenticatedData.access_token, testToken);
    assertEquals(authenticatedData.expires_in, 3600);
    assertEquals(authenticatedData.token_type, "Bearer");
    assertEquals(result.access_token, testToken);
    assertEquals(result.expires_in, 3600);
    assertEquals(result.token_type, "Bearer");
  }),
);

Deno.test(
  "authorize should throw AuthenticationError for 401 responses",
  mockGlobal(async () => {
    global.fetch = () => {
      return Promise.resolve(new MockResponse(401, { error: "invalid_client" }) as unknown as Response);
    };

    const connection = new Connection(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    // Verify that calling the method throws the expected error
    await assertRejects(
      async () => {
        // @ts-ignore - Accessing private method for testing
        await connection.authorize();
      },
      AuthenticationError,
      "Invalid Credentials",
    );
  }),
);

Deno.test(
  "authorize should retry on non-401 errors",
  mockGlobal(async () => {
    let fetchCallCount = 0;
    const authenticatingEvents: number[] = [];

    global.fetch = () => {
      fetchCallCount++;
      if (fetchCallCount < 3) {
        // Fail first two attempts
        return Promise.resolve(new MockResponse(500, { error: "server_error" }) as unknown as Response);
      }
      // Succeed on third attempt
      return Promise.resolve(
        new MockResponse(200, {
          access_token: testToken,
          expires_in: 3600,
          token_type: "Bearer",
        }) as unknown as Response,
      );
    };

    const connection = new Connection(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
      {
        minTimeout: 10,
        maxTimeout: 50,
      },
    );

    connection.on("authenticating", (attempt) => {
      authenticatingEvents.push(attempt);
    });

    // @ts-ignore - Accessing private method for testing
    const result = await connection.authorize();

    assertEquals(fetchCallCount, 3);
    assertEquals(authenticatingEvents, [1, 2, 3]);
    assertEquals(result.access_token, testToken);
  }),
);

// Tests for private helper methods
Deno.test("_cleanBaseURL should remove query parameters and trailing slashes", () => {
  const connection = new Connection(
    testBaseUrl,
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  // @ts-ignore - Accessing private method for testing
  const cleanBaseURL = connection._cleanBaseURL.bind(connection);

  // Test different URL formats
  assertEquals(cleanBaseURL("https://example.com/api"), "https://example.com/api");
  assertEquals(cleanBaseURL("https://example.com/api/"), "https://example.com/api");
  assertEquals(cleanBaseURL("https://example.com/api?param=value"), "https://example.com/api");
  assertEquals(cleanBaseURL("https://example.com/api/?param=value"), "https://example.com/api");
});

Deno.test("_buildWebSocketURL should create correct WebSocket URL", () => {
  const connection = new Connection(
    testBaseUrl,
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  // @ts-ignore - Accessing private method for testing
  const buildWebSocketURL = connection._buildWebSocketURL.bind(connection);

  // Test different URL formats
  assertEquals(
    buildWebSocketURL("https://example.com/api"),
    "wss://example.com/api/platform/subscribe",
  );

  assertEquals(
    buildWebSocketURL("http://example.com/api"),
    "ws://example.com/api/platform/subscribe",
  );

  assertEquals(
    buildWebSocketURL("ws://example.com/api"),
    "ws://example.com/api/platform/subscribe",
  );

  assertEquals(
    buildWebSocketURL("wss://example.com/api"),
    "wss://example.com/api/platform/subscribe",
  );
});

Deno.test("Connection constructor should set URLs correctly", () => {
  const connection = new Connection(
    "https://example.com/api/?param=value",
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  // Check that internal state is set correctly
  // @ts-ignore - Accessing private property for testing
  assertEquals(connection._baseURL, "https://example.com/api");
  // @ts-ignore - Accessing private property for testing
  assertEquals(connection._socketURL, "wss://example.com/api/platform/subscribe");

  // Test with WebSocket URL - base URL keeps ws:// but OAuth URL converts to http://
  const wsConnection = new Connection(
    "ws://example.com/api/",
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  // @ts-ignore - Accessing private property for testing
  // Base URL should keep ws:// protocol
  assertEquals(wsConnection._baseURL, "ws://example.com/api");
  // @ts-ignore - Accessing private property for testing
  assertEquals(wsConnection._socketURL, "ws://example.com/api/platform/subscribe");
  // Note: testTokenUrl is provided, so OAuth URL uses the provided token URL

  // Test with secure WebSocket URL - base URL keeps wss:// but OAuth URL converts to https://
  const wssConnection = new Connection(
    "wss://example.com/api/",
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  // @ts-ignore - Accessing private property for testing
  // Base URL should keep wss:// protocol
  assertEquals(wssConnection._baseURL, "wss://example.com/api");
  // @ts-ignore - Accessing private property for testing
  assertEquals(wssConnection._socketURL, "wss://example.com/api/platform/subscribe");
});

Deno.test("OAuth URL should always use HTTP/HTTPS protocol", () => {
  // Test with ws:// base URL and no explicit token URL
  const wsConnectionNoToken = new Connection(
    "ws://example.com/api",
    testClientId,
    testClientSecret,
    testDeviceId,
    undefined, // No token URL provided
  );
  // @ts-ignore - Accessing private property for testing
  assertEquals(wsConnectionNoToken._auth.url, "http://example.com/api/oauth/token");

  // Test with wss:// base URL and no explicit token URL
  const wssConnectionNoToken = new Connection(
    "wss://example.com/api",
    testClientId,
    testClientSecret,
    testDeviceId,
    undefined, // No token URL provided
  );
  // @ts-ignore - Accessing private property for testing
  assertEquals(wssConnectionNoToken._auth.url, "https://example.com/api/oauth/token");

  // Test with ws:// token URL explicitly provided
  const wsConnectionWithWsToken = new Connection(
    "http://example.com/api",
    testClientId,
    testClientSecret,
    testDeviceId,
    "ws://auth.example.com/token", // Explicitly provided ws:// token URL
  );
  // @ts-ignore - Accessing private property for testing
  assertEquals(wsConnectionWithWsToken._auth.url, "http://auth.example.com/token");

  // Test with wss:// token URL explicitly provided
  const wssConnectionWithWssToken = new Connection(
    "https://example.com/api",
    testClientId,
    testClientSecret,
    testDeviceId,
    "wss://auth.example.com/token", // Explicitly provided wss:// token URL
  );
  // @ts-ignore - Accessing private property for testing
  assertEquals(wssConnectionWithWssToken._auth.url, "https://auth.example.com/token");
});

Deno.test(
  "_authenticateAndQueueTokenRefresh should fetch token and set access_token",
  mockGlobal(async () => {
    let timeoutCallback: TimerHandler | undefined = undefined;
    let timeoutDuration: number | undefined = 0;

    const tokenResponse = {
      access_token: testToken,
      expires_in: 3600,
      token_type: "Bearer",
    };

    global.fetch = () => {
      return Promise.resolve(new MockResponse(200, tokenResponse) as unknown as Response);
    };

    global.setTimeout = (callback: TimerHandler, timeout?: number): number => {
      timeoutCallback = callback;
      timeoutDuration = timeout;

      return 1 as ReturnType<typeof setTimeout>; // Explicitly match the expected return type
    };

    const connection = new Connection(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    // @ts-ignore - Accessing private method for testing
    await connection._authenticateAndQueueTokenRefresh();

    assertEquals(connection.access_token, testToken);

    assertEquals(timeoutDuration, 3599000); // (3600 - 1) * 1000
    assertExists(timeoutCallback);

    // @ts-ignore - Accessing private property for testing
    assertEquals(connection._auth.url, testTokenUrl);
    // @ts-ignore - Accessing private property for testing
    assertEquals(connection._auth.client_id, testClientId);
    // @ts-ignore - Accessing private property for testing
    assertEquals(connection._auth.client_secret, testClientSecret);
  }),
);

Deno.test(
  "_authenticateAndQueueTokenRefresh should emit authenticationError event when authorization fails",
  mockGlobal(async () => {
    global.fetch = () => {
      return Promise.resolve(new MockResponse(401, { error: "invalid_client" }) as unknown as Response);
    };

    const connection = new Connection(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    let authErrorEmitted = false;
    let emittedError: AuthenticationError | null = null;

    connection.on("authenticationError", (error) => {
      authErrorEmitted = true;
      emittedError = error;
    });

    // Call the method - it should not throw but emit an event
    // @ts-ignore - Accessing private method for testing
    await connection._authenticateAndQueueTokenRefresh();

    // Verify the authenticationError event was emitted
    assertEquals(authErrorEmitted, true);
    assertExists(emittedError);
    // Type assertion to allow instanceof check
    const error = emittedError as unknown;
    assertEquals(error instanceof AuthenticationError, true);
    const authError = emittedError as AuthenticationError;
    assertEquals(authError.message, "Invalid Credentials");
    assertEquals(authError.status, 401);
  }),
);

// Test token refresh with zero expiration
Deno.test(
  "_authenticateAndQueueTokenRefresh should not set refresher timer when expires_in is zero",
  mockGlobal(async () => {
    let fetchCalled = false;
    mockFetch({
      status: 200,
      action: () => fetchCalled = true,
      token: "short-lived-token",
      expires_in: 0,
    });

    const connection = new Connection(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    // @ts-ignore - Accessing private method for testing
    await connection._authenticateAndQueueTokenRefresh();

    // Verify fetch was called
    assertEquals(fetchCalled, true);

    // Verify access_token was set
    assertEquals(connection.access_token, "short-lived-token");

    // Verify no timeout is set due to expires_in being 0
    // @ts-ignore - Accessing private property for testing
    assertEquals(connection._refresher, null);
  }),
);

Deno.test(
  "_authenticateAndQueueTokenRefresh should clear previous timeout when called again",
  mockGlobal(async () => {
    let timeoutCleared = false;
    const mockTimeoutId = 12345;

    global.fetch = () => {
      return Promise.resolve(
        new MockResponse(200, {
          access_token: testToken,
          expires_in: 3600,
          token_type: "Bearer",
        }) as unknown as Response,
      );
    };

    global.setTimeout = () => {
      return mockTimeoutId as unknown as ReturnType<typeof setTimeout>;
    };

    global.clearTimeout = (id: number | undefined) => {
      if (id === mockTimeoutId) {
        timeoutCleared = true;
      }
    };

    const connection = new Connection(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    // @ts-ignore - Accessing private property for testing
    connection._refresher = mockTimeoutId as unknown as ReturnType<typeof setTimeout>;

    // @ts-ignore - Accessing private method for testing
    await connection._authenticateAndQueueTokenRefresh();

    assertEquals(timeoutCleared, true);
  }),
);

// Tests for Connection.connect method with new authentication flow
Deno.test(
  "Connection.connect should authenticate asynchronously and create websocket after authentication",
  mockGlobal(async () => {
    // Track if authenticate was called
    let authenticateCalled = false;
    let webSocketConstructorCalled = false;
    let authenticatedEventFired = false;

    mockFetch({
      status: 200,
      action: () => authenticateCalled = true,
    });

    const mockWs = mockWebSocket((_ws: MockWebSocket) => {
      webSocketConstructorCalled = true;
      return undefined;
    });

    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    // Connection should be returned immediately
    assertExists(connection);
    assertEquals(connection instanceof Connection, true);

    // Track authenticated event
    connection.on("authenticated", () => {
      authenticatedEventFired = true;
    });

    // Wait for authentication and websocket creation
    await connection.waitFor("open");

    // @ts-ignore - Accessing private property for testing
    assertEquals(connection._socket, mockWs);
    assertEquals(authenticateCalled, true);
    assertEquals(webSocketConstructorCalled, true);
    assertEquals(authenticatedEventFired, true);
    assertEquals(mockWs.url, `wss://example.com/api/platform/subscribe`);
  }),
);

// Test WebSocket error handling
Deno.test(
  "Connection should emit error events when socket.onerror is triggered",
  mockGlobal(async () => {
    mockFetch();
    const mockWs = mockWebSocket();

    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    await connection.waitFor("open");

    // Track if error event is emitted
    let errorEventData: unknown = null;
    connection.once("socketError", (data) => {
      errorEventData = data;
    });

    // Create an error event
    const errorEvent = { type: "error", message: "Test error" } as unknown as Event;

    // Trigger the onerror handler
    if (mockWs.onerror) {
      mockWs.onerror(errorEvent);
    }

    // Verify error event was emitted with correct data
    assertEquals(errorEventData, errorEvent);
  }),
);

Deno.test(
  "_createWebSocketAndAttachEventHandlers should not create new WebSocket when isOpen is true",
  mockGlobal(async () => {
    let constructorCalls = 0;
    mockFetch();
    mockWebSocket((_ws: MockWebSocket) => {
      constructorCalls++;
      return undefined;
    });

    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    await connection.waitFor("open");

    assertEquals(connection.isOpen, true);

    // @ts-ignore - Accessing private method for testing
    connection._createWebSocketAndAttachEventHandlers();
    // Give it a moment to check isOpen
    await delay(20);
    assertEquals(constructorCalls, 1);
  }),
);

Deno.test(
  "Connection should handle WebSocket message events",
  mockGlobal(async () => {
    mockFetch();
    const mockWs = mockWebSocket();

    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    await connection.waitFor("open");

    // Track emitted events
    const emittedEvents: { event: string; data: unknown }[] = [];

    // @ts-ignore - Event types are not properly defined for testing
    connection.on("message", (data) => {
      emittedEvents.push({ event: "message", data });
    });

    // @ts-ignore - Event types are not properly defined for testing
    connection.on("ping", (data) => {
      emittedEvents.push({ event: "ping", data });
    });

    // @ts-ignore - Event types are not properly defined for testing
    connection.on("ack", (data) => {
      emittedEvents.push({ event: "ack", data });
    });

    // Simulate receiving a message
    mockWs.simulateMessage(JSON.stringify({
      meta: {
        requestID: "test-request-id",
        deviceID: testDeviceId,
      },
      payload: { test: true },
    }));

    // Verify message event was emitted
    assertEquals(emittedEvents.length, 1);
    assertEquals(emittedEvents[0]?.event, "message");

    // Simulate receiving a ping message
    emittedEvents.length = 0; // Clear events
    mockWs.simulateMessage(JSON.stringify({ ping: Date.now() }));

    // Verify ping event was emitted and pong sent
    assertEquals(emittedEvents.length, 1);
    assertEquals(emittedEvents[0]?.event, "ping");
    assertEquals(mockWs.sentMessages.length, 1);
    if (mockWs.sentMessages[0]) {
      assertStringIncludes(mockWs.sentMessages[0], "pong");
    }

    // Simulate receiving an ack message
    emittedEvents.length = 0; // Clear events
    mockWs.simulateMessage(JSON.stringify({ ackCode: 200 }));

    // Verify ack event was emitted
    assertEquals(emittedEvents.length, 1);
    assertEquals(emittedEvents[0]?.event, "ack");
  }),
);

Deno.test(
  "Connection.connect should retry WebSocket connection on non-authentication errors",
  mockGlobal(async () => {
    let attemptCount = 0;
    const connectingEvents: number[] = [];

    mockFetch();

    // Create a mock WebSocket
    mockWebSocket((ws) => {
      attemptCount++;
      if (attemptCount === 2) return;
      return () => {
        ws.close(4001, "Testing Failure");
      };
    });

    // Start connection process
    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
      {
        minTimeout: 10,
      },
    );

    connection.on("connecting", (attempt) => {
      connectingEvents.push(attempt);
    });

    await connection.waitFor("open");

    // Verify connection succeeded after retry
    assertExists(connection);
    assertEquals(connection instanceof Connection, true);

    assertEquals(attemptCount, 2); // Verify we retried once
    assertEquals(connectingEvents, [1, 2]);
  }),
);

// Test abnormal websocket closures
Deno.test(
  "Connection should emit close events for abnormal WebSocket closures",
  mockGlobal(async () => {
    mockFetch();
    const mockWs = mockWebSocket();

    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    await connection.waitFor("open");

    // Track if close event is emitted
    let closeEventFired = false;
    let closeEventObj: CloseEvent | undefined;

    // @ts-ignore - Event types are not properly defined for testing
    connection.once("close", (event) => {
      closeEventFired = true;
      closeEventObj = event;
    });

    // Create a close event with non-1000 code
    const closeEvent = {
      type: "close",
      code: 1006, // Abnormal closure
      reason: "Connection lost",
      wasClean: false,
      target: mockWs,
    } as unknown as CloseEvent;

    // Trigger the onclose handler
    if (mockWs.onclose) {
      mockWs.onclose(closeEvent);
    }

    // Verify close event was emitted
    assertEquals(closeEventFired, true);
    assertExists(closeEventObj);
    assertEquals(closeEventObj.code, 1006);
    assertEquals(closeEventObj.reason, "Connection lost");
  }),
);

Deno.test(
  "Connection.connect should emit socketError event on authentication failure",
  mockGlobal(async () => {
    let authErrorOccurred = false;
    let errorEventEmitted = false;
    let authenticatingEmitted = false;

    global.fetch = () => {
      return Promise.resolve(new MockResponse(401, { error: "invalid_client" }) as unknown as Response);
    };

    // Mock WebSocket
    mockWebSocket();

    // Mock setTimeout to catch the error
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    global.setTimeout = (callback: TimerHandler, timeout?: number) => {
      const id = globalThis.setTimeout(() => {
        try {
          if (typeof callback === "function") {
            callback();
          }
        }
        catch (_e) {
          authErrorOccurred = true;
          // Swallow the error to prevent test failure
        }
      }, Math.min(timeout || 0, 10));
      timeouts.push(id);
      return id as unknown as ReturnType<typeof setTimeout>;
    };

    // Create connection - this should not throw immediately
    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    // Connection should be returned immediately
    assertExists(connection);

    // Listen for events
    connection.on("authenticationError", () => {
      errorEventEmitted = true;
    });

    connection.on("authenticating", () => {
      authenticatingEmitted = true;
    });

    // Wait for authentication attempt
    await delay(50);

    // Authentication attempted
    assertEquals(authenticatingEmitted, true);
    // Authentication error occurs and is now surfaced via socketError
    assertEquals(authErrorOccurred, false); // Error is caught by our error handler
    assertEquals(errorEventEmitted, true); // Error event is now emitted
    // @ts-ignore - Accessing private property for testing
    assertEquals(connection._socket, undefined); // Socket never created
    assertEquals(connection.access_token, ""); // Token never set

    // Clean up timers
    timeouts.forEach((id) => clearTimeout(id));
    connection.close();
  }),
);

// Tests for send method
Deno.test("send should add missing oauthToken and deviceID to data", async () => {
  mockFetch();
  const mockWs = mockWebSocket();

  using connection = Connection.connect(
    testBaseUrl,
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  await connection.waitFor("open");

  // Create test data without oauthToken and deviceID
  // @ts-ignore - Using simplified test data structure
  const testData = {
    meta: {
      requestID: "test-request-id",
      directive: PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST,
    },
    payload: { test: true },
  };

  // @ts-ignore - Testing with simplified data structure
  connection.send(testData);

  // Verify data was sent with added fields
  assertEquals(mockWs.sentMessages.length, 1);

  // Ensure we have a message before parsing
  const message = mockWs.sentMessages[0];
  if (!message) {
    throw new Error("Expected a message to be sent");
  }

  const sentData = JSON.parse(message);
  assertEquals(sentData.meta.oauthToken, testToken);
  assertEquals(sentData.meta.deviceID, testDeviceId);
  assertEquals(sentData.meta.requestID, "test-request-id");
  assertEquals(sentData.payload.test, true);

  // Clean up
  connection.close();
});

Deno.test("send should not override existing oauthToken and deviceID", async () => {
  // Create a mock WebSocket
  const mockWs = mockWebSocket();
  mockFetch();

  using connection = Connection.connect(
    testBaseUrl,
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  await connection.waitFor("open");

  // Set access token (this should not be used)
  connection.access_token = testToken;

  // Create test data with existing oauthToken and deviceID
  const customToken = "custom-token";
  const customDeviceId = "custom-device-id";
  // @ts-ignore - Using simplified test data structure
  const testData = {
    meta: {
      requestID: "test-request-id",
      directive: PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST,
      oauthToken: customToken,
      deviceID: customDeviceId,
    },
    payload: { test: true },
  };

  // Send the data
  // @ts-ignore - Testing with simplified data structure
  connection.send(testData);

  // Verify data was sent with original values
  assertEquals(mockWs.sentMessages.length, 1);

  // Ensure we have a message before parsing
  const message = mockWs.sentMessages[0];
  if (!message) {
    throw new Error("Expected a message to be sent");
  }

  const sentData = JSON.parse(message);
  assertEquals(sentData.meta.oauthToken, customToken);
  assertEquals(sentData.meta.deviceID, customDeviceId);

  // Clean up
  connection.close();
});

// Tests for sendAndGetResponse method
Deno.test("sendAndGetResponse should throw error if socket is not connected", async () => {
  const connection = new Connection(
    testBaseUrl,
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  // Set access token
  connection.access_token = testToken;

  // Create test data
  // @ts-ignore - Using simplified test data structure
  const testData = {
    meta: {
      requestID: "test-request-id",
      directive: PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST,
    },
    payload: { test: true },
  };

  // This should throw an error
  await assertRejects(
    async () => {
      // @ts-ignore - Testing with simplified data structure
      await connection.sendAndGetResponse(testData);
    },
    Error,
    "WebSocket connection not established",
  );
});

Deno.test("sendAndGetResponse should send data and wait for response", async () => {
  // Create a mocked waitFor function to track calls
  let waitForEvent = "";
  let waitForResolveValue: unknown = null;
  let waitForCalled = false;

  const connection = new Connection(
    testBaseUrl,
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  // Set access token
  connection.access_token = testToken;

  // Create a mock WebSocket
  const mockWs = mockWebSocket();
  // @ts-ignore - Accessing private property for testing
  connection._socket = mockWs;
  // Set the WebSocket to OPEN state
  mockWs.readyState = MockWebSocket.OPEN;

  // Mock the waitFor method
  connection.waitFor = (event: string) => {
    waitForCalled = true;
    waitForEvent = event;

    // Create response with OK message code
    const response = {
      meta: {
        requestID: event,
        messageCode: MessageCodes.OK,
      },
      payload: {
        result: "success",
      },
    };

    waitForResolveValue = response;
    return Promise.resolve(response);
  };

  // Create test data with a request ID
  const requestId = "test-request-id-" + Date.now();
  // @ts-ignore - Using simplified test data structure
  const testData = {
    meta: {
      requestID: requestId,
      directive: PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST,
    },
    payload: { test: true },
  };

  // Call sendAndGetResponse
  // @ts-ignore - Testing with simplified data structure
  const response = await connection.sendAndGetResponse(testData);

  // Verify waitFor was called with correct event
  assertEquals(waitForCalled, true);
  assertEquals(waitForEvent, requestId);

  // Verify data was sent to WebSocket
  assertEquals(mockWs.sentMessages.length, 1);

  // Ensure we have a message before parsing
  const message = mockWs.sentMessages[0];
  if (!message) {
    throw new Error("Expected a message to be sent");
  }

  const sentData = JSON.parse(message);
  assertEquals(sentData.meta.requestID, requestId);
  assertEquals(sentData.meta.oauthToken, testToken);

  // Verify response was returned
  assertEquals(response, waitForResolveValue);
});

Deno.test("sendAndGetResponse should throw PlatformResponseError for critical errors", async () => {
  mockWebSocket();
  mockFetch();

  using connection = Connection.connect(
    testBaseUrl,
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  await connection.waitFor("open");

  // Mock the waitFor method to return error
  connection.waitFor = () => {
    // Create response with critical error message code
    const response = {
      meta: {
        requestID: "test-request-id",
        messageCode: MessageCodes.HARDWARE_ERROR,
      },
      payload: {
        error: "Hardware failure",
      },
    };

    return Promise.resolve(response);
  };

  // Create test data
  // @ts-ignore - Using simplified test data structure
  const testData = {
    meta: {
      requestID: "test-request-id",
      directive: PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST,
    },
    payload: { test: true },
  };

  // Should throw PlatformResponseError
  await assertRejects(
    async () => {
      // @ts-ignore - Testing with simplified data structure
      await connection.sendAndGetResponse(testData);
    },
    PlatformResponseError,
    "Platform returned status code:",
  );

  // Clean up
  connection.close();
});

// Test error handling in message processing
Deno.test(
  "Connection should handle malformed JSON in onmessage handler",
  mockGlobal(async () => {
    mockFetch();
    const mockWs = mockWebSocket();

    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    await connection.waitFor("open");

    // Track if error event is emitted
    let errorEventFired = false;
    connection.once("messageError", () => {
      errorEventFired = true;
    });

    // Create a message event with invalid JSON
    const messageEvent = {
      type: "message",
      data: "This is not valid JSON",
      target: mockWs,
    } as unknown as MessageEvent;

    // Trigger the onmessage handler
    if (mockWs.onmessage) {
      mockWs.onmessage(messageEvent);
    }

    // Verify error event was emitted
    assertEquals(errorEventFired, true);
  }),
);

Deno.test("sendAndGetResponse should set deviceID if it's null or default", async () => {
  const connection = new Connection(
    testBaseUrl,
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  // Set access token
  connection.access_token = testToken;

  // Create a mock WebSocket
  const mockWs = mockWebSocket();
  // @ts-ignore - Accessing private property for testing
  connection._socket = mockWs;
  // Set the WebSocket to OPEN state
  mockWs.readyState = MockWebSocket.OPEN;

  // Mock the waitFor method
  connection.waitFor = () => {
    return Promise.resolve({
      meta: {
        requestID: "test-request-id",
        messageCode: MessageCodes.OK,
      },
    });
  };

  // Test with default UUID
  // @ts-ignore - Using simplified test data structure
  const testData1 = {
    meta: {
      requestID: "test-request-id",
      directive: PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST,
      deviceID: "00000000-0000-0000-0000-000000000000",
    },
    payload: { test: true },
  };

  // @ts-ignore - Testing with simplified data structure
  await connection.sendAndGetResponse(testData1);

  // Verify deviceID was set in sent data
  assertEquals(mockWs.sentMessages.length, 1);

  // Ensure we have a message before parsing
  const message = mockWs.sentMessages[0];
  if (!message) {
    throw new Error("Expected a message to be sent");
  }

  let sentData = JSON.parse(message);
  assertEquals(sentData.meta.deviceID, testDeviceId);

  // Clear sent messages
  mockWs.sentMessages.length = 0;

  // Test with null deviceID
  // @ts-ignore - Using simplified test data structure
  const testData2 = {
    meta: {
      requestID: "test-request-id-2",
      directive: PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST,
      deviceID: null,
    },
    payload: { test: true },
  };

  // @ts-ignore - Testing with simplified data structure
  await connection.sendAndGetResponse(testData2);

  // Verify deviceID was set in sent data
  assertEquals(mockWs.sentMessages.length, 1);

  // Ensure we have a message before parsing
  const message2 = mockWs.sentMessages[0];
  if (!message2) {
    throw new Error("Expected a message to be sent");
  }

  sentData = JSON.parse(message2);
  assertEquals(sentData.meta.deviceID, testDeviceId);
});

// Tests for close method
Deno.test(
  "close should clear refresher timeout and close socket",
  mockGlobal(async () => {
    let timeoutCleared = false;

    global.fetch = () => {
      return Promise.resolve(
        new MockResponse(200, {
          access_token: testToken,
          expires_in: 3600,
          token_type: "Bearer",
        }) as unknown as Response,
      );
    };

    // Create a mock WebSocket
    const mockWs = mockWebSocket();

    // Create connection
    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    await connection.waitFor("open");

    // Set a fake refresher
    // @ts-ignore - Accessing private property for testing
    const mockTimeoutId = connection._refresher;
    // Set up clearTimeout mock
    global.clearTimeout = ((id?: number) => {
      if (id === mockTimeoutId) {
        timeoutCleared = true;
      }
      clearTimeout(id);
    }) as typeof clearTimeout;

    let closeEventTriggered = false;
    connection.once("close", () => closeEventTriggered = true);

    // Call close
    connection.close();
    await delay(10); // Wait for close to complete

    // Verify timeout was cleared
    assertEquals(connection._refresher, null);

    assertEquals(timeoutCleared, true);

    // Verify socket close was called
    assertEquals(mockWs.readyState, MockWebSocket.CLOSED);

    // Verify once handler was registered
    assertEquals(closeEventTriggered, true);
  }),
);

Deno.test("close should handle missing socket gracefully", () => {
  // Create connection without socket
  const connection = new Connection(
    testBaseUrl,
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  // Verify no socket exists
  // @ts-ignore - Accessing private property for testing
  assertEquals(connection._socket, undefined);

  // This should not throw an error
  connection.close();
});

// Test Symbol.dispose
Deno.test("Symbol.dispose should clear refresher timeout", () => {
  let timeoutCleared = false;
  const mockTimeoutId = 12345;

  // Mock clearTimeout
  const originalClearTimeout = globalThis.clearTimeout;
  globalThis.clearTimeout = ((id?: number) => {
    if (id === mockTimeoutId) {
      timeoutCleared = true;
    }
    originalClearTimeout(id);
  }) as typeof clearTimeout;

  try {
    const connection = new Connection(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    // @ts-ignore - Accessing private property for testing
    connection._refresher = mockTimeoutId as unknown as ReturnType<typeof setTimeout>;

    // Call Symbol.dispose
    connection[Symbol.dispose]();

    assertEquals(timeoutCleared, true);
  }
  finally {
    // Restore original clearTimeout
    globalThis.clearTimeout = originalClearTimeout;
  }
});

// Test that connection events are emitted correctly
Deno.test(
  "Connection should emit connecting events with correct attempt numbers",
  mockGlobal(async () => {
    let attemptCount = 0;
    const connectingEvents: number[] = [];

    mockFetch();

    // Create a mock WebSocket that fails twice then succeeds
    mockWebSocket((ws) => {
      attemptCount++;
      if (attemptCount < 3) {
        return () => {
          ws.close(4001, "Testing Failure");
        };
      }
      return undefined; // Success on third attempt
    });

    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
      {
        minTimeout: 10,
        maxTimeout: 50,
      },
    );

    connection.on("connecting", (attempt) => {
      connectingEvents.push(attempt);
    });

    await connection.waitFor("open");

    assertEquals(connectingEvents, [1, 2, 3]);
    assertEquals(connection.isOpen, true);

    connection.close();
  }),
);

// Test retry options configuration
Deno.test(
  "Connection should use custom retry options",
  mockGlobal(async () => {
    let fetchAttempts = 0;
    const maxAttempts = 2;

    // Mock fetch to always fail
    global.fetch = () => {
      fetchAttempts++;
      return Promise.resolve(new MockResponse(500, { error: "server_error" }) as unknown as Response);
    };

    const connection = new Connection(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
      {
        maxAttempts: maxAttempts,
        minTimeout: 10,
      },
    );

    // Should fail after maxAttempts
    await assertRejects(
      async () => {
        // @ts-ignore - Accessing private method for testing
        await connection.authorize();
      },
      Error,
    );

    // Verify it respected maxAttempts
    assertEquals(fetchAttempts, maxAttempts);
  }),
);

// Test waitFor method functionality
Deno.test("waitFor should resolve when the expected event is emitted", async () => {
  const connection = new Connection(
    testBaseUrl,
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  const testEvent = "test-event";
  const testData = { data: "test-value" };

  // Start waiting for event
  const waitPromise = connection.waitFor(testEvent);

  // Emit the event
  connection.emit(testEvent, testData);

  // Should resolve with the event data
  const result = await waitPromise;
  assertEquals(result, testData);

  // Clean up
  connection.close();
});

Deno.test("waitFor should reject when close event is emitted before target event", async () => {
  const connection = new Connection(
    testBaseUrl,
    testClientId,
    testClientSecret,
    testDeviceId,
    testTokenUrl,
  );

  const testEvent = "test-event";
  const closeEvent = new CloseEvent("close", { code: 1006 });

  // Start waiting for event with close as an error event
  const waitPromise = connection.waitFor(testEvent, ["messageError", "socketError", "close"]);

  // Emit close event instead
  connection.emit("close", closeEvent);

  // Should reject
  await assertRejects(
    async () => await waitPromise,
  );

  // Clean up
  connection.close();
});

// Test complete connection flow with events
Deno.test(
  "Connection flow should emit events in correct order",
  mockGlobal(async () => {
    // deno-lint-ignore no-explicit-any
    const events: { event: string; data?: any }[] = [];
    let authAttempts = 0;
    let connectAttempts = 0;

    mockFetch({
      action: () => authAttempts++,
    });

    mockWebSocket((_ws) => {
      connectAttempts++;
      return undefined;
    });

    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    // Track all relevant events
    connection.on("authenticating", (attempt) => {
      events.push({ event: "authenticating", data: attempt });
    });

    connection.on("authenticated", (data) => {
      events.push({ event: "authenticated", data });
    });

    connection.on("connecting", (attempt) => {
      events.push({ event: "connecting", data: attempt });
    });

    connection.on("open", () => {
      events.push({ event: "open" });
    });

    // Wait for connection to be established
    await connection.waitFor("open");

    // Since authentication and websocket creation happen asynchronously,
    // the order might vary slightly. Let's verify all expected events occurred
    const eventNames = events.map((e) => e.event);

    // These events should all be present
    assertEquals(eventNames.includes("authenticating"), true);
    assertEquals(eventNames.includes("authenticated"), true);
    assertEquals(eventNames.includes("connecting"), true);
    assertEquals(eventNames.includes("open"), true);

    // Verify the authenticating event has attempt number
    const authenticatingEvent = events.find((e) => e.event === "authenticating");
    assertEquals(authenticatingEvent?.data, 1);

    // Verify authenticated event has token
    const authenticatedEvent = events.find((e) => e.event === "authenticated");
    assertExists(authenticatedEvent?.data);
    // deno-lint-ignore no-explicit-any
    assertExists((authenticatedEvent?.data as any).access_token);

    // Verify connecting event has attempt number
    const connectingEvent = events.find((e) => e.event === "connecting");
    assertEquals(connectingEvent?.data, 1);

    // Verify counts
    assertEquals(authAttempts, 1);
    assertEquals(connectAttempts, 1);

    connection.close();
  }),
);

// Test that authentication happens before websocket creation
Deno.test(
  "WebSocket should only be created after successful authentication",
  mockGlobal(async () => {
    let authCalled = false;
    let wsCreated = false;
    const callOrder: string[] = [];

    mockFetch({
      action: () => {
        authCalled = true;
        callOrder.push("auth");
      },
    });

    mockWebSocket(() => {
      wsCreated = true;
      callOrder.push("websocket");
      return undefined;
    });

    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    await connection.waitFor("open");

    assertEquals(authCalled, true);
    assertEquals(wsCreated, true);
    assertEquals(callOrder, ["auth", "websocket"]);

    connection.close();
  }),
);

// Test event emissions during retry scenarios
Deno.test(
  "Connection should emit multiple connecting events during WebSocket retries",
  mockGlobal(async () => {
    const connectingEvents: number[] = [];
    let wsAttempts = 0;

    mockFetch();

    mockWebSocket((ws) => {
      wsAttempts++;
      if (wsAttempts < 3) {
        return () => {
          // Simulate connection failure
          setTimeout(() => ws.close(4000, "Test failure"), 5);
        };
      }
      return undefined; // Success on 3rd attempt
    });

    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
      {
        minTimeout: 10,
        maxTimeout: 20,
      },
    );

    connection.on("connecting", (attempt) => {
      connectingEvents.push(attempt);
    });

    await connection.waitFor("open");

    assertEquals(connectingEvents, [1, 2, 3]);
    assertEquals(wsAttempts, 3);

    connection.close();
  }),
);

// Test that sendAndGetResponse uses waitFor internally
Deno.test(
  "sendAndGetResponse should use waitFor to wait for response",
  mockGlobal(async () => {
    mockFetch();
    const mockWs = mockWebSocket();

    using connection = Connection.connect(
      testBaseUrl,
      testClientId,
      testClientSecret,
      testDeviceId,
      testTokenUrl,
    );

    await connection.waitFor("open");

    const requestId = "test-request-123";
    const responseData = {
      meta: {
        requestID: requestId,
        messageCode: MessageCodes.OK,
      },
      payload: { result: "success" },
    };

    // Start sendAndGetResponse in background
    const responsePromise = connection.sendAndGetResponse({
      meta: {
        requestID: requestId,
        directive: PlatformDirectives.PLATFORM_COMPONENTS,
      },
      payload: {},
      // deno-lint-ignore no-explicit-any
    } as any);

    // Wait a bit for the message to be sent
    await delay(10);

    // Simulate receiving the response
    mockWs.simulateMessage(JSON.stringify(responseData));

    // Should resolve with the response
    const response = await responsePromise;
    assertEquals(response.meta.requestID, responseData.meta.requestID);
    assertEquals(response.meta.messageCode, responseData.meta.messageCode);
    // @ts-ignore - Testing with simplified data structure
    assertEquals(response.payload, responseData.payload);

    connection.close();
  }),
);
