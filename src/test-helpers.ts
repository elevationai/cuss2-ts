import { assertEquals, assertRejects } from "jsr:@std/assert";
import { EventEmitter } from "./models/EventEmitter.ts";
import { Cuss2 } from "./cuss2.ts";
import { StateChange } from "./models/stateChange.ts";
import {
  ApplicationStateCodes as AppState,
  type ComponentList,
  type EnvironmentLevel,
  type PlatformData,
} from "cuss2-typescript-models";
import {
  type ComponentCharacteristics,
  ComponentTypes,
  CussDataTypes,
  DeviceTypes,
  type EnvironmentComponent,
  MediaTypes,
} from "./types/modelExtensions.ts";

// Test constants
export const DEFAULT_DEVICE_ID = "00000000-0000-0000-0000-000000000000";
export const TEST_DEVICE_ID = "test-device-123";
export const CONNECTION_ERROR = "Connection not established. Please await cuss2.connected before making API calls.";

// Mock Connection class
export class MockConnection extends EventEmitter {
  isOpen = true;
  deviceID = DEFAULT_DEVICE_ID;
  _socket = {
    close: (_code?: number, _reason?: string) => {},
  };

  sendAndGetResponse(_data: unknown): Promise<PlatformData> {
    return Promise.resolve({
      meta: { messageCode: "OK" },
      payload: {},
    } as unknown as PlatformData);
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
export function createMockEnvironment(overrides?: Partial<EnvironmentLevel>): EnvironmentLevel {
  return {
    deviceID: TEST_DEVICE_ID,
    platformVersionNumber: "2.0",
    sessionTimeout: 300,
    killTimeout: 60,
    deviceLocation: "TEST",
    cussVersions: ["2.0"],
    ...overrides,
  } as EnvironmentLevel;
}

// Helper function to create mock ComponentCharacteristics
export function createMockCharacteristics(overrides: Partial<ComponentCharacteristics> = {}): ComponentCharacteristics {
  return {
    dsTypesList: [],
    mediaTypesList: [] as MediaTypes[],
    deviceTypesList: [] as DeviceTypes[],
    ...overrides,
  } as ComponentCharacteristics;
}

// Helper function to create a mock EnvironmentComponent
export function createMockComponent(overrides: Partial<EnvironmentComponent> = {}): EnvironmentComponent {
  return {
    componentID: 1,
    componentType: ComponentTypes.DATA_INPUT,
    componentDescription: "Test Component",
    componentCharacteristics: [],
    linkedComponentIDs: overrides.linkedComponentIDs || [],
    ...overrides,
  } as EnvironmentComponent;
}

// Helper to create mock component list
export function createMockComponentList(): ComponentList {
  return [
    createMockComponent({
      componentID: 1,
      componentCharacteristics: [
        createMockCharacteristics({
          deviceTypesList: [DeviceTypes.PRINT],
          mediaTypesList: [MediaTypes.BAGGAGETAG],
        }),
      ],
    }),
    createMockComponent({
      componentID: 2,
      componentCharacteristics: [
        createMockCharacteristics({
          deviceTypesList: [DeviceTypes.PRINT],
          mediaTypesList: [MediaTypes.BOARDINGPASS],
        }),
      ],
    }),
  ] as unknown as ComponentList;
}

// Helper to create a Cuss2 instance with mocked dependencies
export function createMockCuss2(connection?: MockConnection) {
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

// Helper to simulate state change via platform message
export async function simulateStateChange(
  cuss2: Cuss2,
  newState: AppState,
  payload?: unknown,
): Promise<void> {
  await cuss2._handleWebSocketMessage({
    meta: {
      currentApplicationState: { applicationStateCode: newState },
      platformDirective: "PLATFORM_APPLICATIONS_STATEREQUEST",
    },
    payload: payload || {},
  } as unknown as PlatformData);
}

// Helper to set current state
export function setCurrentState(cuss2: Cuss2, state: AppState): void {
  // @ts-ignore - accessing private property for testing
  cuss2._currentState = new StateChange(state, state);
}

// Helper to create mock cuss2 with state request tracking
export function createMockCuss2WithStateTracking() {
  const { cuss2, mockConnection } = createMockCuss2();

  // Mock sendAndGetResponse for state requests
  mockConnection.sendAndGetResponse = (_data: unknown) => {
    return Promise.resolve({
      meta: { messageCode: "OK" },
      payload: {},
    } as PlatformData);
  };

  return { cuss2, mockConnection };
}

// Helper to test API method rejection when connection is closed
export async function testApiMethodRejectsWhenDisconnected(_cuss2: Cuss2, methodCall: () => Promise<unknown>) {
  await assertRejects(
    methodCall,
    Error,
    CONNECTION_ERROR,
  );
}

// Helper to test invalid state transition
export async function testInvalidStateTransition(
  cuss2: Cuss2,
  fromState: AppState,
  requestMethod: () => Promise<PlatformData | undefined>,
): Promise<void> {
  setCurrentState(cuss2, fromState);
  const result = await requestMethod();
  assertEquals(result, undefined);
  assertEquals(cuss2.state, fromState);
}

// Helper to test initialization throws for specific state
export async function testInitializationThrowsForState(state: AppState) {
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

// Device-specific helper functions under mockDevice namespace
export const mockDevice = {
  createFeeder(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.FEEDER,
    });
  },

  createDispenser(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.DISPENSER,
    });
  },

  createBagTagPrinter(componentID: number, linkedComponentIDs: number[]): EnvironmentComponent {
    return createMockComponent({
      componentID,
      linkedComponentIDs,
      componentCharacteristics: [
        createMockCharacteristics({
          deviceTypesList: [DeviceTypes.PRINT],
          mediaTypesList: [MediaTypes.BAGGAGETAG],
        }),
      ],
    });
  },

  createBoardingPassPrinter(componentID: number, linkedComponentIDs: number[]): EnvironmentComponent {
    return createMockComponent({
      componentID,
      linkedComponentIDs,
      componentCharacteristics: [
        createMockCharacteristics({
          deviceTypesList: [DeviceTypes.PRINT],
          mediaTypesList: [MediaTypes.BOARDINGPASS],
        }),
      ],
    });
  },

  createBarcodeReader(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentCharacteristics: [
        createMockCharacteristics({
          dsTypesList: [CussDataTypes.DS_TYPES_BARCODE],
        }),
      ],
    });
  },

  createCardReader(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentCharacteristics: [{
        dsTypesList: [],
        mediaTypesList: ["MAGCARD"],
        deviceTypesList: [],
      } as unknown as ComponentCharacteristics],
    });
  },

  createAnnouncement(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.ANNOUNCEMENT,
    });
  },

  createDocumentReader(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentCharacteristics: [
        createMockCharacteristics({
          mediaTypesList: [MediaTypes.PASSPORT],
        }),
      ],
    });
  },

  createBiometric(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentCharacteristics: [
        createMockCharacteristics({
          dsTypesList: [CussDataTypes.DS_TYPES_BIOMETRIC],
        }),
      ],
    });
  },

  createScale(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.DATA_INPUT,
      componentCharacteristics: [
        createMockCharacteristics({
          deviceTypesList: [DeviceTypes.SCALE],
        }),
      ],
    });
  },

  createCamera(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.DATA_INPUT,
      componentCharacteristics: [
        createMockCharacteristics({
          deviceTypesList: [DeviceTypes.CAMERA],
          mediaTypesList: [MediaTypes.IMAGE],
        }),
      ],
    });
  },

  createKeypad(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentCharacteristics: [
        createMockCharacteristics({
          dsTypesList: [CussDataTypes.DS_TYPES_KEY],
        }),
      ],
    });
  },

  createIllumination(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentCharacteristics: [
        createMockCharacteristics({
          deviceTypesList: [DeviceTypes.ILLUMINATION],
        }),
      ],
    });
  },

  createHeadset(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.MEDIA_INPUT,
      componentCharacteristics: [
        createMockCharacteristics({
          deviceTypesList: [DeviceTypes.ASSISTIVE],
          mediaTypesList: [MediaTypes.AUDIO],
        }),
      ],
    });
  },

  createInsertionBelt(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.INSERTION_BELT,
      componentCharacteristics: [createMockCharacteristics()],
    });
  },

  createParkingBelt(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.PARKING_BELT,
      componentCharacteristics: [createMockCharacteristics()],
    });
  },

  createVerificationBelt(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.VERIFICATION_BELT,
      componentCharacteristics: [createMockCharacteristics()],
    });
  },

  createRFID(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.DATA_INPUT,
      componentCharacteristics: [
        createMockCharacteristics({
          deviceTypesList: [DeviceTypes.CONTACTLESS],
          mediaTypesList: [MediaTypes.RFID],
        }),
      ],
    });
  },

  createBHS(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.DATA_OUTPUT,
      componentCharacteristics: [
        createMockCharacteristics({
          dsTypesList: [CussDataTypes.DS_TYPES_RP1745],
        }),
      ],
    });
  },

  createAEASBD(componentID: number): EnvironmentComponent {
    return createMockComponent({
      componentID,
      componentType: ComponentTypes.USER_OUTPUT,
      componentCharacteristics: [{
        dsTypesList: ["SBDAEA"],
        mediaTypesList: [],
        deviceTypesList: [],
      } as unknown as ComponentCharacteristics],
    });
  },
};
