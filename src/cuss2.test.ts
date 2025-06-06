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

// Test constants
const DEFAULT_DEVICE_ID = "00000000-0000-0000-0000-000000000000";
const TEST_DEVICE_ID = "test-device-123";
const CONNECTION_ERROR = "Connection not established. Please await cuss2.connected before making API calls.";

// Mock Connection class
class MockConnection extends EventEmitter {
  isOpen = true;
  deviceID = DEFAULT_DEVICE_ID;
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
function createMockEnvironment(overrides?: Partial<EnvironmentLevel>): EnvironmentLevel {
  return {
    deviceID: TEST_DEVICE_ID,
    platformVersionNumber: "2.0",
    sessionTimeout: 300,
    killTimeout: 60,
    deviceLocation: "TEST",
    cussVersions: ["2.0"],
    platformID: "test-platform",
    ...overrides,
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

// Helper to create a Cuss2 instance with mocked dependencies
function createMockCuss2(connection?: MockConnection) {
  const mockConnection = connection || new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Mock the api methods
  cuss2.api.getEnvironment = () => Promise.resolve(createMockEnvironment());
  cuss2.api.getComponents = () => Promise.resolve(createMockComponentList());
  cuss2.queryComponents = () => Promise.resolve(true);

  // Set initial state
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(AppState.UNAVAILABLE, AppState.UNAVAILABLE);

  return { cuss2, mockConnection };
}

// Helper to test API method rejection when connection is closed
async function testApiMethodRejectsWhenDisconnected(_cuss2: Cuss2, methodCall: () => Promise<unknown>) {
  await assertRejects(
    methodCall,
    Error,
    CONNECTION_ERROR,
  );
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
  let getEnvironmentCalled = false;
  let getComponentsCalled = false;
  let queryComponentsCalled = false;

  const { cuss2, mockConnection } = createMockCuss2();

  // Override mocks to track calls
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
  const apiMethods = [
    () => cuss2.api.getEnvironment(),
    () => cuss2.api.getComponents(),
    () => cuss2.api.getStatus(1),
    () => cuss2.api.send(1, []),
    () => cuss2.api.setup(1, []),
    () => cuss2.api.cancel(1),
    () => cuss2.api.enable(1),
    () => cuss2.api.disable(1),
    () => cuss2.api.offer(1),
    () => cuss2.api.staterequest(AppState.AVAILABLE),
    () => cuss2.requestInitializeState(),
    () => cuss2.requestUnavailableState(),
    () => cuss2.requestAvailableState(),
    () => cuss2.requestActiveState(),
    () => cuss2.requestStoppedState(),
    () => cuss2.requestReload(),
  ];

  for (const method of apiMethods) {
    await testApiMethodRejectsWhenDisconnected(cuss2, method);
  }
});

Deno.test("1.4 - Device ID hydration should update deviceID from environment when default ID is used", async () => {
  const mockConnection = new MockConnection();
  mockConnection.deviceID = DEFAULT_DEVICE_ID;
  const { cuss2 } = createMockCuss2(mockConnection);

  const testDeviceId = "actual-device-id-123";

  // Mock getEnvironment to return specific device ID
  cuss2.api.getEnvironment = () => Promise.resolve(createMockEnvironment({ deviceID: testDeviceId }));

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
  const { cuss2 } = createMockCuss2(mockConnection);

  // Mock getEnvironment to return different device ID
  cuss2.api.getEnvironment = () => Promise.resolve(createMockEnvironment({ deviceID: "platform-device-id-789" }));

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
  const { cuss2 } = createMockCuss2(mockConnection);

  const testDeviceId = "actual-device-id-123";

  // Mock getEnvironment to return specific device ID
  cuss2.api.getEnvironment = () => Promise.resolve(createMockEnvironment({ deviceID: testDeviceId }));

  // Trigger initialization
  // @ts-ignore - accessing private method for testing
  await cuss2._initialize();

  // Verify device ID was updated
  assertEquals(mockConnection.deviceID, testDeviceId);
});

Deno.test("1.2 - Initialization should throw error when platform is in abnormal state", async () => {
  const { cuss2 } = createMockCuss2();

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

async function testInitializationThrowsForState(state: AppState) {
  const { cuss2 } = createMockCuss2();

  // Set state
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(state, state);

  // Trigger initialization and expect error
  await assertRejects(
    // @ts-ignore - accessing private method for testing
    () => cuss2._initialize(),
    Error,
    `Platform has ${state} the application`,
  );
}

Deno.test("1.2 - Initialization should throw error when platform has SUSPENDED the application", async () => {
  await testInitializationThrowsForState(AppState.SUSPENDED);
});

Deno.test("1.2 - Initialization should throw error when platform has DISABLED the application", async () => {
  await testInitializationThrowsForState(AppState.DISABLED);
});

Deno.test("1.2 - Initialization should emit queryError when component query fails", async () => {
  const { cuss2 } = createMockCuss2();

  let queryErrorEmitted = false;
  let emittedError: unknown;

  // Listen for queryError event
  cuss2.on("queryError", (error: unknown) => {
    queryErrorEmitted = true;
    emittedError = error;
  });

  // Mock queryComponents to fail
  const testError = new Error("Query failed");
  cuss2.queryComponents = () => Promise.reject(testError);

  // Trigger initialization
  // @ts-ignore - accessing private method for testing
  await cuss2._initialize();

  // Verify queryError was emitted
  assertEquals(queryErrorEmitted, true);
  assertEquals(emittedError, testError);
});

Deno.test("1.2 - Initialization should emit connected event after successful initialization", async () => {
  const { cuss2 } = createMockCuss2();

  let connectedEmitted = false;
  let emittedInstance: unknown;

  // Listen for connected event
  cuss2.on("connected", (instance: unknown) => {
    connectedEmitted = true;
    emittedInstance = instance;
  });

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

// Test Category 2: State Management Tests

// Helper to simulate state change via platform message
async function simulateStateChange(
  cuss2: Cuss2, 
  newState: AppState, 
  payload?: unknown
): Promise<void> {
  await cuss2._handleWebSocketMessage({
    meta: {
      currentApplicationState: { applicationStateCode: newState },
      platformDirective: "PLATFORM_APPLICATIONS_STATEREQUEST"
    },
    payload: payload || {}
  } as unknown as PlatformData);
}

// Helper to set current state
function setCurrentState(cuss2: Cuss2, state: AppState): void {
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(state, state);
}

// Helper to create mock cuss2 with state request tracking
function createMockCuss2WithStateTracking() {
  const { cuss2, mockConnection } = createMockCuss2();
  
  // Mock sendAndGetResponse for state requests
  mockConnection.sendAndGetResponse = (_data: unknown) => {
    return Promise.resolve({
      meta: { messageCode: "OK" },
      payload: {}
    } as PlatformData);
  };
  
  return { cuss2, mockConnection };
}

// Helper to test invalid state transition
async function testInvalidStateTransition(
  cuss2: Cuss2, 
  fromState: AppState, 
  requestMethod: () => Promise<PlatformData | undefined>
): Promise<void> {
  setCurrentState(cuss2, fromState);
  const result = await requestMethod();
  assertEquals(result, undefined);
  assertEquals(cuss2.state, fromState);
}

Deno.test("2.1 - Initial state should be STOPPED", () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Verify initial state
  assertEquals(cuss2.state, AppState.STOPPED);
});

Deno.test("2.2 - State transitions should handle valid state transitions correctly", async () => {
  const { cuss2 } = createMockCuss2WithStateTracking();

  // Track state change events
  const stateChanges: StateChange[] = [];
  cuss2.on("stateChange", (change: StateChange) => {
    stateChanges.push(change);
  });

  // Helper to test a state transition
  async function testStateTransition(
    fromState: AppState,
    toState: AppState,
    requestMethod: () => Promise<PlatformData | undefined>,
    expectedIndex: number,
    payload?: unknown
  ) {
    setCurrentState(cuss2, fromState);
    await requestMethod();
    await simulateStateChange(cuss2, toState, payload);
    
    assertEquals(cuss2.state, toState);
    assertEquals(stateChanges.length, expectedIndex + 1);
    assertEquals(stateChanges[expectedIndex].previous, fromState);
    assertEquals(stateChanges[expectedIndex].current, toState);
  }

  // Mock disable for components
  cuss2._disableAllComponents = () => Promise.resolve();

  // Test STOPPED → INITIALIZE
  await testStateTransition(
    AppState.STOPPED,
    AppState.INITIALIZE,
    () => cuss2.requestInitializeState(),
    0
  );

  // Test INITIALIZE → UNAVAILABLE
  await testStateTransition(
    AppState.INITIALIZE,
    AppState.UNAVAILABLE,
    () => cuss2.requestUnavailableState(),
    1
  );

  // Test UNAVAILABLE → AVAILABLE
  await testStateTransition(
    AppState.UNAVAILABLE,
    AppState.AVAILABLE,
    () => cuss2.requestAvailableState(),
    2
  );

  // Test AVAILABLE → ACTIVE
  await testStateTransition(
    AppState.AVAILABLE,
    AppState.ACTIVE,
    () => cuss2.requestActiveState(),
    3,
    {
      applicationActivation: {
        executionMode: "SAM",
        accessibleMode: false,
        languageID: "en-US"
      }
    }
  );

  // Test ACTIVE → AVAILABLE
  await testStateTransition(
    AppState.ACTIVE,
    AppState.AVAILABLE,
    () => cuss2.requestAvailableState(),
    4
  );
});

Deno.test("2.3 - Invalid state transitions should not allow invalid state transitions", async () => {
  const { cuss2 } = createMockCuss2WithStateTracking();

  // Test STOPPED → AVAILABLE (invalid, should return undefined)
  await testInvalidStateTransition(
    cuss2,
    AppState.STOPPED,
    () => cuss2.requestAvailableState()
  );

  // Test INITIALIZE → ACTIVE (invalid)
  await testInvalidStateTransition(
    cuss2,
    AppState.INITIALIZE,
    () => cuss2.requestActiveState()
  );

  // Test UNAVAILABLE → ACTIVE (invalid, must go through AVAILABLE)
  await testInvalidStateTransition(
    cuss2,
    AppState.UNAVAILABLE,
    () => cuss2.requestActiveState()
  );
});

Deno.test("2.4 - State change events should emit stateChange events with proper StateChange objects", async () => {
  const { cuss2 } = createMockCuss2();

  const emittedChanges: StateChange[] = [];

  // Listen for state changes
  cuss2.on("stateChange", (change: StateChange) => {
    emittedChanges.push(change);
  });

  // Simulate state change from UNAVAILABLE to AVAILABLE
  await simulateStateChange(cuss2, AppState.AVAILABLE);

  // Verify event was emitted
  assertEquals(emittedChanges.length, 1);
  assertEquals(emittedChanges[0].previous, AppState.UNAVAILABLE);
  assertEquals(emittedChanges[0].current, AppState.AVAILABLE);
  assertEquals(emittedChanges[0] instanceof StateChange, true);
});

Deno.test("2.5 - Pending state changes should prevent concurrent state change requests", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  let requestCount = 0;

  // Mock sendAndGetResponse with delay
  mockConnection.sendAndGetResponse = () => {
    requestCount++;
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          meta: { messageCode: "OK" },
          payload: {}
        } as PlatformData);
      }, 50);
    });
  };

  // Set state to allow transition
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(AppState.UNAVAILABLE, AppState.UNAVAILABLE);

  // Make two concurrent requests
  const promise1 = cuss2.requestAvailableState();
  const promise2 = cuss2.requestAvailableState();

  // Second request should return undefined immediately
  const result2 = await promise2;
  assertEquals(result2, undefined);

  // First request should complete
  const result1 = await promise1;
  assertEquals(result1?.meta?.messageCode, "OK");

  // Only one request should have been made
  assertEquals(requestCount, 1);
});

Deno.test("2.2 - State transitions should emit activated event when entering ACTIVE state", async () => {
  const { cuss2 } = createMockCuss2();

  let activatedEmitted = false;
  let activationData: unknown = null;

  // Listen for activated event
  cuss2.on("activated", (data: unknown) => {
    activatedEmitted = true;
    activationData = data;
  });

  // Set state to AVAILABLE (required for ACTIVE transition)
  setCurrentState(cuss2, AppState.AVAILABLE);

  const activationPayload = {
    applicationActivation: {
      executionMode: "MAM",
      accessibleMode: true,
      languageID: "fr-FR"
    }
  };

  // Simulate transition to ACTIVE
  await simulateStateChange(cuss2, AppState.ACTIVE, activationPayload);

  // Verify activated event was emitted
  assertEquals(activatedEmitted, true);
  assertEquals(activationData, activationPayload.applicationActivation);

  // Verify instance properties were set
  assertEquals(cuss2.multiTenant, true);
  assertEquals(cuss2.accessibleMode, true);
  assertEquals(cuss2.language, "fr-FR");
});

Deno.test("2.2 - State transitions should emit deactivated event when leaving ACTIVE state", async () => {
  const { cuss2 } = createMockCuss2();

  let deactivatedEmitted = false;
  let newState: AppState | null = null;

  // Listen for deactivated event
  cuss2.on("deactivated", (state: AppState) => {
    deactivatedEmitted = true;
    newState = state;
  });

  // Set state to ACTIVE
  setCurrentState(cuss2, AppState.ACTIVE);

  // Simulate transition from ACTIVE to AVAILABLE
  await simulateStateChange(cuss2, AppState.AVAILABLE);

  // Verify deactivated event was emitted
  assertEquals(deactivatedEmitted, true);
  assertEquals(newState, AppState.AVAILABLE);
});

Deno.test("2.2 - State transitions should disable all components when transitioning from ACTIVE", async () => {
  const { cuss2 } = createMockCuss2WithStateTracking();

  // Track if _disableAllComponents was called
  let disableAllCalled = false;
  cuss2._disableAllComponents = () => {
    disableAllCalled = true;
    return Promise.resolve();
  };

  // Set state to ACTIVE
  setCurrentState(cuss2, AppState.ACTIVE);

  // Request transition to AVAILABLE
  await cuss2.requestAvailableState();

  // Verify components were disabled
  assertEquals(disableAllCalled, true);
});
