import { assertEquals, assertRejects } from "jsr:@std/assert";
import { delay } from "jsr:@std/async/delay";
import { Cuss2 } from "./cuss2.ts";
import { Connection } from "./connection.ts";
import { StateChange } from "./models/stateChange.ts";
import { EventEmitter } from "./models/EventEmitter.ts";
import {
  ApplicationStateCodes as AppState,
  type ComponentList,
  type EnvironmentLevel,
  type PlatformData,
} from "cuss2-typescript-models";

// Mock Connection class
class MockConnection extends EventEmitter {
  isOpen = true;
  deviceID = "00000000-0000-0000-0000-000000000000";
  _socket = {
    close: (_code?: number, _reason?: string) => {},
  };

  sendAndGetResponse(_data: unknown): Promise<PlatformData> {
    return Promise.resolve({} as PlatformData);
  }

  static connect(
    _wss: string,
    _client_id: string,
    _client_secret: string,
    _deviceID: string,
    _tokenURL?: string,
  ): MockConnection {
    return new MockConnection();
  }
}


// Helper to create mock environment
function createMockEnvironment(): EnvironmentLevel {
  return {
    deviceID: "test-device-123",
    platformVersionNumber: "2.0",
    sessionTimeout: 300,
    killTimeout: 60,
    deviceLocation: "TEST",
    cussVersions: ["2.0"],
    platformID: "test-platform",
  } as unknown as EnvironmentLevel;
}

// Helper to create mock component list
function createMockComponentList(): ComponentList {
  return [
    {
      componentID: 1,
      componentType: { componentCode: "BTP" },
    },
    {
      componentID: 2,
      componentType: { componentCode: "BPP" },
    },
  ] as unknown as ComponentList;
}

// Test Category 1: Connection and Initialization Tests

Deno.test("1.1 - Static connect() method should create a new Cuss2 instance with proper connection", () => {
  // Mock Connection.connect
  const originalConnect = Connection.connect;
  const mockConnection = new MockConnection();
  // Add Symbol.dispose to mock connection
  // @ts-ignore - adding dispose for test
  mockConnection[Symbol.dispose] = () => {};
  // @ts-ignore - mocking for test
  Connection.connect = () => mockConnection;

  try {
    // Create Cuss2 instance
    const cuss2 = Cuss2.connect(
      "wss://test.com",
      "client_id",
      "client_secret",
      "device_id",
      "token_url",
    );

    // Verify instance created
    assertEquals(cuss2 instanceof Cuss2, true);

    // @ts-ignore - accessing private property for testing
    assertEquals(cuss2.connection, mockConnection);

    // Verify event listeners attached
    // @ts-ignore - accessing private property for testing
    assertEquals(mockConnection.listenerCount("message"), 1);
    // @ts-ignore - accessing private property for testing
    assertEquals(mockConnection.listenerCount("open"), 1);
  }
  finally {
    Connection.connect = originalConnect;
  }
});

Deno.test("1.2 - Connection event handling should handle 'open' event and initialize properly", async () => {
  const mockConnection = new MockConnection();
  let getEnvironmentCalled = false;
  let getComponentsCalled = false;
  let queryComponentsCalled = false;

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Mock the api methods
  cuss2.api.getEnvironment = () => {
    getEnvironmentCalled = true;
    return Promise.resolve(createMockEnvironment());
  };

  cuss2.api.getComponents = () => {
    getComponentsCalled = true;
    return Promise.resolve(createMockComponentList());
  };

  cuss2.queryComponents = () => {
    queryComponentsCalled = true;
    return Promise.resolve(true);
  };

  // Set initial state
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(AppState.UNAVAILABLE, AppState.UNAVAILABLE);

  // Trigger open event
  mockConnection.emit("open");

  // Wait for initialization to complete
  await delay(10);

  // Verify initialization methods were called
  assertEquals(getEnvironmentCalled, true);
  assertEquals(getComponentsCalled, true);
  assertEquals(queryComponentsCalled, true);
});

Deno.test("1.3 - Connection not established error should throw when API calls made before connection is open", async () => {
  const mockConnection = new MockConnection();
  mockConnection.isOpen = false;

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Test various API methods
  await assertRejects(
    () => cuss2.api.getEnvironment(),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.api.getComponents(),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.api.getStatus(1),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.api.send(1, []),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.api.setup(1, []),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.api.cancel(1),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.api.enable(1),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.api.disable(1),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.api.offer(1),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.api.staterequest(AppState.AVAILABLE),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.requestInitializeState(),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.requestUnavailableState(),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.requestAvailableState(),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.requestActiveState(),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.requestStoppedState(),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );

  await assertRejects(
    () => cuss2.requestReload(),
    Error,
    "Connection not established. Please await cuss2.connected before making API calls.",
  );
});

Deno.test("1.4 - Device ID hydration should update deviceID from environment when default ID is used", async () => {
  const mockConnection = new MockConnection();
  mockConnection.deviceID = "00000000-0000-0000-0000-000000000000";

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  const testDeviceId = "actual-device-id-123";

  // Mock getEnvironment to return specific device ID
  cuss2.api.getEnvironment = () => {
    return Promise.resolve({
      deviceID: testDeviceId,
      platformVersionNumber: "2.0",
      sessionTimeout: 300,
      killTimeout: 60,
      deviceLocation: "TEST",
      cussVersions: ["2.0"],
      platformID: "test-platform",
    } as unknown as EnvironmentLevel);
  };

  // Mock getComponents
  cuss2.api.getComponents = () => {
    return Promise.resolve(createMockComponentList());
  };

  // Mock queryComponents
  cuss2.queryComponents = () => Promise.resolve(true);

  // Set initial state
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(AppState.UNAVAILABLE, AppState.UNAVAILABLE);

  // Trigger initialization
  // @ts-ignore - accessing private method for testing
  await cuss2._initialize();

  // Verify device ID was updated
  assertEquals(mockConnection.deviceID, testDeviceId);
});

Deno.test("1.4 - Device ID hydration should not update deviceID when non-default ID is provided", async () => {
  const customDeviceId = "custom-device-id-456";
  const mockConnection = new MockConnection();
  mockConnection.deviceID = customDeviceId;

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Mock getEnvironment to return different device ID
  cuss2.api.getEnvironment = () => {
    return Promise.resolve({
      deviceID: "platform-device-id-789",
      platformVersionNumber: "2.0",
      sessionTimeout: 300,
      killTimeout: 60,
      deviceLocation: "TEST",
      cussVersions: ["2.0"],
      platformID: "test-platform",
    } as unknown as EnvironmentLevel);
  };

  // Mock getComponents
  cuss2.api.getComponents = () => {
    return Promise.resolve(createMockComponentList());
  };

  // Mock queryComponents
  cuss2.queryComponents = () => Promise.resolve(true);

  // Set initial state
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(AppState.UNAVAILABLE, AppState.UNAVAILABLE);

  // Trigger initialization
  // @ts-ignore - accessing private method for testing
  await cuss2._initialize();

  // Verify device ID was NOT updated
  assertEquals(mockConnection.deviceID, customDeviceId);
});

Deno.test("1.4 - Device ID hydration should handle null deviceID", async () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - setting to null for testing
  mockConnection.deviceID = null;

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  const testDeviceId = "actual-device-id-123";

  // Mock getEnvironment to return specific device ID
  cuss2.api.getEnvironment = () => {
    return Promise.resolve({
      deviceID: testDeviceId,
      platformVersionNumber: "2.0",
      sessionTimeout: 300,
      killTimeout: 60,
      deviceLocation: "TEST",
      cussVersions: ["2.0"],
      platformID: "test-platform",
    } as unknown as EnvironmentLevel);
  };

  // Mock getComponents
  cuss2.api.getComponents = () => {
    return Promise.resolve(createMockComponentList());
  };

  // Mock queryComponents
  cuss2.queryComponents = () => Promise.resolve(true);

  // Set initial state
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(AppState.UNAVAILABLE, AppState.UNAVAILABLE);

  // Trigger initialization
  // @ts-ignore - accessing private method for testing
  await cuss2._initialize();

  // Verify device ID was updated
  assertEquals(mockConnection.deviceID, testDeviceId);
});

Deno.test("1.2 - Initialization should throw error when platform is in abnormal state", async () => {
  const mockConnection = new MockConnection();

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Mock getEnvironment
  cuss2.api.getEnvironment = () => {
    return Promise.resolve(createMockEnvironment());
  };

  // Set state to undefined to simulate abnormal state
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = undefined;

  // Trigger initialization and expect error
  await assertRejects(
    // @ts-ignore - accessing private method for testing
    () => cuss2._initialize(),
    Error,
    "Cannot read properties of undefined",
  );
});

Deno.test("1.2 - Initialization should throw error when platform has SUSPENDED the application", async () => {
  const mockConnection = new MockConnection();

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Mock getEnvironment
  cuss2.api.getEnvironment = () => {
    return Promise.resolve(createMockEnvironment());
  };

  // Set state to SUSPENDED
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(AppState.SUSPENDED, AppState.SUSPENDED);

  // Trigger initialization and expect error
  await assertRejects(
    // @ts-ignore - accessing private method for testing
    () => cuss2._initialize(),
    Error,
    `Platform has ${AppState.SUSPENDED} the application`,
  );
});

Deno.test("1.2 - Initialization should throw error when platform has DISABLED the application", async () => {
  const mockConnection = new MockConnection();

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Mock getEnvironment
  cuss2.api.getEnvironment = () => {
    return Promise.resolve(createMockEnvironment());
  };

  // Set state to DISABLED
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(AppState.DISABLED, AppState.DISABLED);

  // Trigger initialization and expect error
  await assertRejects(
    // @ts-ignore - accessing private method for testing
    () => cuss2._initialize(),
    Error,
    `Platform has ${AppState.DISABLED} the application`,
  );
});

Deno.test("1.2 - Initialization should emit queryError when component query fails", async () => {
  const mockConnection = new MockConnection();

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  let queryErrorEmitted = false;
  let emittedError: unknown;

  // Listen for queryError event
  cuss2.on("queryError", (error: unknown) => {
    queryErrorEmitted = true;
    emittedError = error;
  });

  // Mock getEnvironment
  cuss2.api.getEnvironment = () => {
    return Promise.resolve(createMockEnvironment());
  };

  // Mock getComponents
  cuss2.api.getComponents = () => {
    return Promise.resolve(createMockComponentList());
  };

  // Mock queryComponents to fail
  const testError = new Error("Query failed");
  cuss2.queryComponents = () => {
    return Promise.reject(testError);
  };

  // Set initial state
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(AppState.UNAVAILABLE, AppState.UNAVAILABLE);

  // Trigger initialization
  // @ts-ignore - accessing private method for testing
  await cuss2._initialize();

  // Verify queryError was emitted
  assertEquals(queryErrorEmitted, true);
  assertEquals(emittedError, testError);
});

Deno.test("1.2 - Initialization should emit connected event after successful initialization", async () => {
  const mockConnection = new MockConnection();

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  let connectedEmitted = false;
  let emittedInstance: unknown;

  // Listen for connected event
  cuss2.on("connected", (instance: unknown) => {
    connectedEmitted = true;
    emittedInstance = instance;
  });

  // Mock getEnvironment
  cuss2.api.getEnvironment = () => {
    return Promise.resolve(createMockEnvironment());
  };

  // Mock getComponents
  cuss2.api.getComponents = () => {
    return Promise.resolve(createMockComponentList());
  };

  // Mock queryComponents
  cuss2.queryComponents = () => Promise.resolve(true);

  // Set initial state
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(AppState.UNAVAILABLE, AppState.UNAVAILABLE);

  // Trigger initialization
  // @ts-ignore - accessing private method for testing
  await cuss2._initialize();

  // Verify connected event was emitted with cuss2 instance
  assertEquals(connectedEmitted, true);
  assertEquals(emittedInstance, cuss2);
});

Deno.test("1.1 - Connected getter should resolve immediately when connection is open and components exist", async () => {
  const mockConnection = new MockConnection();
  mockConnection.isOpen = true;

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Set components to indicate initialization is complete
  // @ts-ignore - accessing private property for testing
  cuss2.components = { "1": {} };

  // Should resolve immediately
  const start = Date.now();
  await cuss2.connected;
  const duration = Date.now() - start;

  // Should resolve almost immediately (less than 10ms)
  assertEquals(duration < 10, true);
});

Deno.test("1.1 - Connected getter should wait for connected event when connection not ready", async () => {
  const mockConnection = new MockConnection();
  mockConnection.isOpen = false;

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  let resolved = false;

  // Start waiting for connected
  const connectedPromise = cuss2.connected.then(() => {
    resolved = true;
  });

  // Should not be resolved yet
  await delay(10);
  assertEquals(resolved, false);

  // Emit connected event
  cuss2.emit("connected", cuss2);

  // Now it should resolve
  await connectedPromise;
  assertEquals(resolved, true);
});

Deno.test("1.1 - Connected getter should reject on authentication error", async () => {
  const mockConnection = new MockConnection();
  mockConnection.isOpen = false;

  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Start waiting for connected
  const connectedPromise = cuss2.connected;

  // Emit authentication error
  const authError = { message: "Authentication failed" };
  mockConnection.emit("authenticationError", authError);

  // Should reject with authentication error
  await assertRejects(
    () => connectedPromise,
  );
});
