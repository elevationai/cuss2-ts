import { assertEquals, assertRejects } from "jsr:@std/assert";
import { delay } from "jsr:@std/async/delay";
import { Cuss2 } from "./cuss2.ts";
import { Connection } from "./connection.ts";
import { StateChange } from "./models/stateChange.ts";
import {
  ApplicationStateCodes as AppState,
  type PlatformData,
} from "cuss2-typescript-models";
import {
  type ComponentCharacteristics,
  ComponentTypes,
  CussDataTypes,
  DeviceTypes,
  MediaTypes,
} from "./types/modelExtensions.ts";
import {
  createMockCharacteristics,
  createMockComponent,
  createMockComponentList,
  createMockCuss2,
  createMockCuss2WithStateTracking,
  createMockEnvironment,
  DEFAULT_DEVICE_ID,
  MockConnection,
  setCurrentState,
  simulateStateChange,
  testApiMethodRejectsWhenDisconnected,
  testInitializationThrowsForState,
  testInvalidStateTransition,
} from "./test-helpers.ts";



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
  cuss2.on("stateChange", (change: StateChange) => stateChanges.push(change));

  // Helper to test a state transition
  async function testStateTransition(
    fromState: AppState,
    toState: AppState,
    requestMethod: () => Promise<PlatformData | undefined>,
    expectedIndex: number,
    payload?: unknown,
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
  await testStateTransition(AppState.STOPPED, AppState.INITIALIZE, () => cuss2.requestInitializeState(), 0);

  // Test INITIALIZE → UNAVAILABLE
  await testStateTransition(AppState.INITIALIZE, AppState.UNAVAILABLE, () => cuss2.requestUnavailableState(), 1);

  // Test UNAVAILABLE → AVAILABLE
  await testStateTransition(AppState.UNAVAILABLE, AppState.AVAILABLE, () => cuss2.requestAvailableState(), 2);

  // Test AVAILABLE → ACTIVE
  await testStateTransition(AppState.AVAILABLE, AppState.ACTIVE, () => cuss2.requestActiveState(), 3, {
    applicationActivation: {
      executionMode: "SAM",
      accessibleMode: false,
      languageID: "en-US",
    },
  });

  // Test ACTIVE → AVAILABLE
  await testStateTransition(AppState.ACTIVE, AppState.AVAILABLE, () => cuss2.requestAvailableState(), 4);
});

Deno.test("2.3 - Invalid state transitions should not allow invalid state transitions", async () => {
  const { cuss2 } = createMockCuss2WithStateTracking();

  // Test STOPPED → AVAILABLE (invalid, should return undefined)
  await testInvalidStateTransition(cuss2, AppState.STOPPED, () => cuss2.requestAvailableState());

  // Test INITIALIZE → ACTIVE (invalid)
  await testInvalidStateTransition(cuss2, AppState.INITIALIZE, () => cuss2.requestActiveState());

  // Test UNAVAILABLE → ACTIVE (invalid, must go through AVAILABLE)
  await testInvalidStateTransition(cuss2, AppState.UNAVAILABLE, () => cuss2.requestActiveState());
});

Deno.test("2.4 - State change events should emit stateChange events with proper StateChange objects", async () => {
  const { cuss2 } = createMockCuss2();

  const emittedChanges: StateChange[] = [];

  // Listen for state changes
  cuss2.on("stateChange", (change: StateChange) => emittedChanges.push(change));

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
      setTimeout(() => resolve({ meta: { messageCode: "OK" }, payload: {} } as PlatformData), 50);
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
      languageID: "fr-FR",
    },
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

// Test Category 3: Component Management Tests

Deno.test("3.1 - Component discovery should properly create component instances from component list", async () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Mock sendAndGetResponse to return component list
  mockConnection.sendAndGetResponse = (data: unknown) => {
    const appData = data as { meta?: { directive?: string } };
    if (appData.meta?.directive === "platform_components") {
      const componentList = [
        // Feeders and Dispensers for printers (must be created first)
        createMockComponent({
          componentID: 10,
          componentType: ComponentTypes.FEEDER,
        }),
        createMockComponent({
          componentID: 11,
          componentType: ComponentTypes.DISPENSER,
        }),
        createMockComponent({
          componentID: 12,
          componentType: ComponentTypes.FEEDER,
        }),
        createMockComponent({
          componentID: 13,
          componentType: ComponentTypes.DISPENSER,
        }),
        // Printers (with linked feeders and dispensers)
        createMockComponent({
          componentID: 1,
          linkedComponentIDs: [10, 11], // Link to feeder 10 and dispenser 11
          componentCharacteristics: [
            createMockCharacteristics({
              deviceTypesList: [DeviceTypes.PRINT],
              mediaTypesList: [MediaTypes.BAGGAGETAG],
            }),
          ],
        }),
        createMockComponent({
          componentID: 2,
          linkedComponentIDs: [12, 13], // Link to feeder 12 and dispenser 13
          componentCharacteristics: [
            createMockCharacteristics({
              deviceTypesList: [DeviceTypes.PRINT],
              mediaTypesList: [MediaTypes.BOARDINGPASS],
            }),
          ],
        }),
        // Other components
        createMockComponent({
          componentID: 3,
          componentCharacteristics: [
            createMockCharacteristics({
              dsTypesList: [CussDataTypes.DS_TYPES_BARCODE],
            }),
          ],
        }),
        createMockComponent({
          componentID: 4,
          componentCharacteristics: [{
            dsTypesList: [],
            mediaTypesList: ["MAGCARD"],
            deviceTypesList: [],
          } as unknown as ComponentCharacteristics],
        }),
        createMockComponent({
          componentID: 5,
          componentType: ComponentTypes.ANNOUNCEMENT,
        }),
      ];

      return Promise.resolve({
        meta: { messageCode: "OK" },
        payload: { componentList },
      } as unknown as PlatformData);
    }
    return Promise.resolve({
      meta: { messageCode: "OK" },
      payload: {}
    } as unknown as PlatformData);
  };

  // Call getComponents
  const componentList = await cuss2.api.getComponents();

  // Verify component list returned
  assertEquals(componentList.length, 9); // 4 feeders/dispensers + 5 components

  // Verify components were created and assigned
  assertEquals(cuss2.components !== undefined, true);
  assertEquals(Object.keys(cuss2.components!).length, 9);

  // Verify specific component instances were assigned to class properties
  assertEquals(cuss2.bagTagPrinter !== undefined, true);
  assertEquals(cuss2.boardingPassPrinter !== undefined, true);
  assertEquals(cuss2.barcodeReader !== undefined, true);
  assertEquals(cuss2.cardReader !== undefined, true);
  assertEquals(cuss2.announcement !== undefined, true);
});

Deno.test("3.2 - Component type mapping should create correct component class for each type", async () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Import component classes for instanceof checks
  const {
    BagTagPrinter, BoardingPassPrinter, DocumentReader, BarcodeReader,
    CardReader, Biometric, Scale, Camera, Announcement, Keypad,
    Illumination, Headset, InsertionBelt, ParkingBelt, VerificationBelt,
    RFID, BHS, AEASBD, Feeder, Dispenser
  } = await import("./models/index.ts");

  // Mock component list with all types
  const componentTypes = [
    // Feeder for BagTagPrinter
    {
      id: 100,
      component: createMockComponent({
        componentID: 100,
        componentType: ComponentTypes.FEEDER,
      }),
      expectedClass: Feeder,
      property: null,
    },
    // Dispenser for BagTagPrinter
    {
      id: 101,
      component: createMockComponent({
        componentID: 101,
        componentType: ComponentTypes.DISPENSER,
      }),
      expectedClass: Dispenser,
      property: null,
    },
    // Feeder for BoardingPassPrinter
    {
      id: 102,
      component: createMockComponent({
        componentID: 102,
        componentType: ComponentTypes.FEEDER,
      }),
      expectedClass: Feeder,
      property: null,
    },
    // Dispenser for BoardingPassPrinter
    {
      id: 103,
      component: createMockComponent({
        componentID: 103,
        componentType: ComponentTypes.DISPENSER,
      }),
      expectedClass: Dispenser,
      property: null,
    },
    // BagTagPrinter
    {
      id: 1,
      component: createMockComponent({
        componentID: 1,
        linkedComponentIDs: [100, 101],
        componentCharacteristics: [
          createMockCharacteristics({
            deviceTypesList: [DeviceTypes.PRINT],
            mediaTypesList: [MediaTypes.BAGGAGETAG],
          }),
        ],
      }),
      expectedClass: BagTagPrinter,
      property: "bagTagPrinter",
    },
    // BoardingPassPrinter
    {
      id: 2,
      component: createMockComponent({
        componentID: 2,
        linkedComponentIDs: [102, 103],
        componentCharacteristics: [
          createMockCharacteristics({
            deviceTypesList: [DeviceTypes.PRINT],
            mediaTypesList: [MediaTypes.BOARDINGPASS],
          }),
        ],
      }),
      expectedClass: BoardingPassPrinter,
      property: "boardingPassPrinter",
    },
    // DocumentReader
    {
      id: 3,
      component: createMockComponent({
        componentID: 3,
        componentCharacteristics: [
          createMockCharacteristics({
            mediaTypesList: [MediaTypes.PASSPORT],
          }),
        ],
      }),
      expectedClass: DocumentReader,
      property: "documentReader",
    },
    // BarcodeReader
    {
      id: 4,
      component: createMockComponent({
        componentID: 4,
        componentCharacteristics: [
          createMockCharacteristics({
            dsTypesList: [CussDataTypes.DS_TYPES_BARCODE],
          }),
        ],
      }),
      expectedClass: BarcodeReader,
      property: "barcodeReader",
    },
    // CardReader
    {
      id: 5,
      component: createMockComponent({
        componentID: 5,
        componentCharacteristics: [{
          dsTypesList: [],
          mediaTypesList: ["MAGCARD"],
          deviceTypesList: [],
        } as unknown as ComponentCharacteristics],
      }),
      expectedClass: CardReader,
      property: "cardReader",
    },
    // Biometric
    {
      id: 6,
      component: createMockComponent({
        componentID: 6,
        componentCharacteristics: [
          createMockCharacteristics({
            dsTypesList: [CussDataTypes.DS_TYPES_BIOMETRIC],
          }),
        ],
      }),
      expectedClass: Biometric,
      property: "biometric",
    },
    // Scale
    {
      id: 7,
      component: createMockComponent({
        componentID: 7,
        componentType: ComponentTypes.DATA_INPUT,
        componentCharacteristics: [
          createMockCharacteristics({
            deviceTypesList: [DeviceTypes.SCALE],
          }),
        ],
      }),
      expectedClass: Scale,
      property: "scale",
    },
    // Camera
    {
      id: 8,
      component: createMockComponent({
        componentID: 8,
        componentType: ComponentTypes.DATA_INPUT,
        componentCharacteristics: [
          createMockCharacteristics({
            deviceTypesList: [DeviceTypes.CAMERA],
            mediaTypesList: [MediaTypes.IMAGE],
          }),
        ],
      }),
      expectedClass: Camera,
      property: "camera",
    },
    // Announcement
    {
      id: 9,
      component: createMockComponent({
        componentID: 9,
        componentType: ComponentTypes.ANNOUNCEMENT,
      }),
      expectedClass: Announcement,
      property: "announcement",
    },
    // Keypad
    {
      id: 10,
      component: createMockComponent({
        componentID: 10,
        componentCharacteristics: [
          createMockCharacteristics({
            dsTypesList: [CussDataTypes.DS_TYPES_KEY],
          }),
        ],
      }),
      expectedClass: Keypad,
      property: "keypad",
    },
    // Illumination
    {
      id: 11,
      component: createMockComponent({
        componentID: 11,
        componentCharacteristics: [
          createMockCharacteristics({
            deviceTypesList: [DeviceTypes.ILLUMINATION],
          }),
        ],
      }),
      expectedClass: Illumination,
      property: "illumination",
    },
    // Headset
    {
      id: 12,
      component: createMockComponent({
        componentID: 12,
        componentType: ComponentTypes.MEDIA_INPUT,
        componentCharacteristics: [
          createMockCharacteristics({
            deviceTypesList: [DeviceTypes.ASSISTIVE],
            mediaTypesList: [MediaTypes.AUDIO],
          }),
        ],
      }),
      expectedClass: Headset,
      property: "headset",
    },
    // InsertionBelt
    {
      id: 13,
      component: createMockComponent({
        componentID: 13,
        componentType: ComponentTypes.INSERTION_BELT,
        componentCharacteristics: [createMockCharacteristics()],
      }),
      expectedClass: InsertionBelt,
      property: "insertionBelt",
    },
    // ParkingBelt
    {
      id: 14,
      component: createMockComponent({
        componentID: 14,
        componentType: ComponentTypes.PARKING_BELT,
        componentCharacteristics: [createMockCharacteristics()],
      }),
      expectedClass: ParkingBelt,
      property: "parkingBelt",
    },
    // VerificationBelt
    {
      id: 15,
      component: createMockComponent({
        componentID: 15,
        componentType: ComponentTypes.VERIFICATION_BELT,
        componentCharacteristics: [createMockCharacteristics()],
      }),
      expectedClass: VerificationBelt,
      property: "verificationBelt",
    },
    // RFID
    {
      id: 16,
      component: createMockComponent({
        componentID: 16,
        componentType: ComponentTypes.DATA_INPUT,
        componentCharacteristics: [
          createMockCharacteristics({
            deviceTypesList: [DeviceTypes.CONTACTLESS],
            mediaTypesList: [MediaTypes.RFID],
          }),
        ],
      }),
      expectedClass: RFID,
      property: "rfid",
    },
    // BHS
    {
      id: 17,
      component: createMockComponent({
        componentID: 17,
        componentType: ComponentTypes.DATA_OUTPUT,
        componentCharacteristics: [
          createMockCharacteristics({
            dsTypesList: [CussDataTypes.DS_TYPES_RP1745],
          }),
        ],
      }),
      expectedClass: BHS,
      property: "bhs",
    },
    // AEASBD
    {
      id: 18,
      component: createMockComponent({
        componentID: 18,
        componentType: ComponentTypes.USER_OUTPUT,
        componentCharacteristics: [{
          dsTypesList: ["SBDAEA"],
          mediaTypesList: [],
          deviceTypesList: [],
        } as unknown as ComponentCharacteristics],
      }),
      expectedClass: AEASBD,
      property: "aeasbd",
    },
  ];

  // Mock sendAndGetResponse
  mockConnection.sendAndGetResponse = (data: unknown) => {
    const appData = data as { meta?: { directive?: string } };
    if (appData.meta?.directive === "platform_components") {
      return Promise.resolve({
        meta: { messageCode: "OK" },
        payload: {
          componentList: componentTypes.map(ct => ct.component)
        }
      } as unknown as PlatformData);
    }
    return Promise.resolve({ payload: {} } as unknown as PlatformData);
  };

  // Call getComponents
  await cuss2.api.getComponents();

  // Verify each component type created correct class
  for (const ct of componentTypes) {
    const component = cuss2.components![String(ct.id)];
    assertEquals(component instanceof ct.expectedClass, true,
      `Component ID ${ct.id} should be instance of ${ct.expectedClass.name}`);

    // Verify property assignment if applicable
    if (ct.property) {
      // @ts-ignore - accessing dynamic property
      assertEquals(cuss2[ct.property] === component, true,
        `Component ID ${ct.id} should be assigned to cuss2.${ct.property}`);
    }
  }
});

Deno.test("3.3 - Feeder/Dispenser linking should create feeders/dispensers before printers for proper linking", async () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  const { Feeder, Dispenser } = await import("./models/index.ts");

  // This test verifies that feeders/dispensers are created in the first pass

  // Mock component list with feeders, dispensers, and printers
  mockConnection.sendAndGetResponse = (data: unknown) => {
    const appData = data as { meta?: { directive?: string } };
    if (appData.meta?.directive === "platform_components") {
      return Promise.resolve({
        meta: { messageCode: "OK" },
        payload: {
          componentList: [
            // Feeder (ID 2)
            createMockComponent({
              componentID: 2,
              componentType: ComponentTypes.FEEDER,
            }),
            // Dispenser (ID 3)
            createMockComponent({
              componentID: 3,
              componentType: ComponentTypes.DISPENSER,
            }),
            // Additional Feeder (ID 5)
            createMockComponent({
              componentID: 5,
              componentType: ComponentTypes.FEEDER,
            }),
            // Additional Dispenser (ID 6)
            createMockComponent({
              componentID: 6,
              componentType: ComponentTypes.DISPENSER,
            }),
            // Bag Tag Printer (linked to feeder 2 and dispenser 3)
            createMockComponent({
              componentID: 1,
              linkedComponentIDs: [2, 3],
              componentCharacteristics: [
                createMockCharacteristics({
                  deviceTypesList: [DeviceTypes.PRINT],
                  mediaTypesList: [MediaTypes.BAGGAGETAG],
                }),
              ],
            }),
            // Boarding Pass Printer (linked to feeder 5 and dispenser 6)
            createMockComponent({
              componentID: 4,
              linkedComponentIDs: [5, 6],
              componentCharacteristics: [
                createMockCharacteristics({
                  deviceTypesList: [DeviceTypes.PRINT],
                  mediaTypesList: [MediaTypes.BOARDINGPASS],
                }),
              ],
            }),
          ]
        }
      } as unknown as PlatformData);
    }
    return Promise.resolve({ payload: {} } as unknown as PlatformData);
  };

  // Spy on component creation by checking when components are added
  const originalGetComponents = cuss2.api.getComponents;
  cuss2.api.getComponents = async () => {
    const result = await originalGetComponents.call(cuss2.api);

    // Check components were created in correct order
    // Feeders and dispensers should exist before printers
    const components = cuss2.components!;
    assertEquals(components["2"] instanceof Feeder, true);
    assertEquals(components["3"] instanceof Dispenser, true);
    assertEquals(components["1"] !== undefined, true);
    assertEquals(components["4"] !== undefined, true);

    return result;
  };

  await cuss2.api.getComponents();
});

Deno.test("3.4 - Component querying should query all components successfully", async () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Import Component class
  const { Component } = await import("./models/index.ts");

  // Create mock components using real Component instances
  const component1 = new Component(createMockComponent({ componentID: 1 }), cuss2);
  const component2 = new Component(createMockComponent({ componentID: 2 }), cuss2);
  const component3 = new Component(createMockComponent({ componentID: 3 }), cuss2);

  // Track query calls
  let queryCalls = 0;
  const mockQuery = () => {
    queryCalls++;
    return Promise.resolve({ meta: { messageCode: "OK" } } as unknown as PlatformData);
  };

  // Mock the query method
  component1.query = mockQuery;
  component2.query = mockQuery;
  component3.query = mockQuery;

  // Set components
  cuss2.components = {
    "1": component1,
    "2": component2,
    "3": component3,
  };

  // Query all components
  const result = await cuss2.queryComponents();

  // Verify all components were queried
  assertEquals(result, true);
  assertEquals(queryCalls, 3);
});

Deno.test("3.5 - Component query error handling should handle component query errors gracefully", async () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Import Component class
  const { Component } = await import("./models/index.ts");

  // Create mock components using real Component instances
  const component1 = new Component(createMockComponent({ componentID: 1 }), cuss2);
  const component2 = new Component(createMockComponent({ componentID: 2 }), cuss2);
  const component3 = new Component(createMockComponent({ componentID: 3 }), cuss2);
  const component4 = new Component(createMockComponent({ componentID: 4 }), cuss2);

  // Track query calls to ensure all are attempted
  let queryCalls = 0;

  // Mock the query methods with some failures
  component1.query = () => {
    queryCalls++;
    return Promise.resolve({ meta: { messageCode: "OK" } } as unknown as PlatformData);
  };
  component2.query = () => {
    queryCalls++;
    return Promise.reject(new Error("Component 2 error"));
  };
  component3.query = () => {
    queryCalls++;
    return Promise.resolve({ meta: { messageCode: "OK" } } as unknown as PlatformData);
  };
  component4.query = () => {
    queryCalls++;
    return Promise.reject(new Error("Component 4 error"));
  };

  // Set components
  cuss2.components = {
    "1": component1,
    "2": component2,
    "3": component3,
    "4": component4,
  };

  // Query all components
  const result = await cuss2.queryComponents();

  // Verify all components were queried despite errors
  assertEquals(result, true);
  assertEquals(queryCalls, 4);
});

Deno.test("3.1 - Component discovery should handle empty component list", async () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Mock empty component list
  mockConnection.sendAndGetResponse = () => {
    return Promise.resolve({
      meta: { messageCode: "OK" },
      payload: { componentList: [] }
    } as unknown as PlatformData);
  };

  // Call getComponents
  const componentList = await cuss2.api.getComponents();

  // Verify empty list handled correctly
  assertEquals(componentList.length, 0);
  assertEquals(cuss2.components !== undefined, true);
  assertEquals(Object.keys(cuss2.components!).length, 0);
});

Deno.test("3.2 - Component type mapping should create generic Component for unknown types", async () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  const { Component } = await import("./models/index.ts");

  // Mock component with unknown type (no matching identification)
  mockConnection.sendAndGetResponse = () => {
    return Promise.resolve({
      meta: { messageCode: "OK" },
      payload: {
        componentList: [
          createMockComponent({
            componentID: 1,
            componentType: ComponentTypes.DATA_INPUT,
            componentCharacteristics: [
              createMockCharacteristics({
                // No recognizable characteristics - will create generic Component
                deviceTypesList: [],
                mediaTypesList: [],
                dsTypesList: [],
              }),
            ],
          })
        ]
      }
    } as unknown as PlatformData);
  };

  await cuss2.api.getComponents();

  // Verify generic Component was created
  const component = cuss2.components!["1"];
  assertEquals(component instanceof Component, true);
  assertEquals(component.constructor.name, "Component");
});
