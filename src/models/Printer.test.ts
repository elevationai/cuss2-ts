import { assert, assertEquals, assertExists, assertRejects, assertThrows } from "jsr:@std/assert";
import { EventEmitter } from "events";
import { Printer } from "./Printer.ts";
import { Feeder } from "./Feeder.ts";
import { Dispenser } from "./Dispenser.ts";
import type { Component } from "./Component.ts";
import type { Cuss2 } from "../cuss2.ts";
import type { ComponentAPI } from "./ComponentAPI.ts";
import { DeviceType } from "./deviceType.ts";
import { PlatformResponseError } from "./platformResponseError.ts";
import {
  type ApplicationState,
  ApplicationStateChangeReasonCodes,
  ApplicationStateCodes,
  type ComponentList,
  ComponentState,
  CussDataTypes,
  type DataRecordList,
  type EnvironmentComponent,
  type EnvironmentLevel,
  MessageCodes,
  type PlatformData,
  type PlatformDataMeta,
  PlatformDirectives,
} from "cuss2-typescript-models";

const createMeta = (
  componentID: number,
  messageCode = MessageCodes.OK,
  componentState = ComponentState.READY,
  platformDirective?: PlatformDirectives,
) => ({
  deviceID: "test-device",
  requestID: "test-request",
  timeStamp: new Date().toISOString(),
  passengerSessionID: "test-passengerSession",
  applicationID: "test-application",
  componentID,
  componentState,
  currentApplicationState: ({
    applicationStateCode: ApplicationStateCodes.ACTIVE,
    accessibleMode: false,
    applicationStateChangeReasonCode: ApplicationStateChangeReasonCodes.NOT_APPLICABLE,
  } as ApplicationState),
  messageCode,
  platformDirective,
} as PlatformDataMeta);

// Mock classes for testing
class MockCuss2 extends EventEmitter {
  api: MockComponentAPI;
  components: Record<number, Component> = {};

  constructor() {
    super();
    this.api = new MockComponentAPI();
  }
}

class MockComponentAPI implements ComponentAPI {
  // Track API calls for testing
  calls: { method: string; componentID: number; args?: unknown }[] = [];

  // Setup responses for testing
  setupResponse?: PlatformData;
  sendResponse?: PlatformData;

  getEnvironment(): Promise<EnvironmentLevel> {
    this.calls.push({ method: "getEnvironment", componentID: -1 });
    return Promise.resolve({} as EnvironmentLevel);
  }

  getComponents(): Promise<ComponentList> {
    this.calls.push({ method: "getComponents", componentID: -1 });
    return Promise.resolve({} as ComponentList);
  }

  enable(componentID: number): Promise<PlatformData> {
    this.calls.push({ method: "enable", componentID });
    return Promise.resolve({
      meta: createMeta(componentID),
    } as PlatformData);
  }

  disable(componentID: number): Promise<PlatformData> {
    this.calls.push({ method: "disable", componentID });
    return Promise.resolve({
      meta: createMeta(componentID),
    } as PlatformData);
  }

  cancel(componentID: number): Promise<PlatformData> {
    this.calls.push({ method: "cancel", componentID });
    return Promise.resolve({
      meta: createMeta(componentID),
    } as PlatformData);
  }

  getStatus(componentID: number): Promise<PlatformData> {
    this.calls.push({ method: "getStatus", componentID });
    return Promise.resolve({
      meta: createMeta(componentID),
    } as PlatformData);
  }

  setup(componentID: number, dataObj: unknown): Promise<PlatformData> {
    this.calls.push({ method: "setup", componentID, args: dataObj });
    return Promise.resolve(
      this.setupResponse || {
        meta: createMeta(componentID),
        payload: [{ data: "ESOK;FW=1.0;HW=2.0;SN=12345" }] as DataRecordList,
      } as PlatformData,
    );
  }

  send(componentID: number, dataObj: unknown): Promise<PlatformData> {
    this.calls.push({ method: "send", componentID, args: dataObj });
    return Promise.resolve(
      this.sendResponse || {
        meta: createMeta(componentID),
        payload: [{ data: "OK" }] as DataRecordList,
      } as PlatformData,
    );
  }

  offer(componentID: number): Promise<PlatformData> {
    this.calls.push({ method: "offer", componentID });
    return Promise.resolve({
      meta: createMeta(componentID),
    } as PlatformData);
  }

  staterequest(): Promise<PlatformData | undefined> {
    this.calls.push({ method: "staterequest", componentID: -1 });
    return Promise.resolve({} as PlatformData);
  }

  announcement = {
    play: (componentID: number, rawData: string): Promise<PlatformData> => {
      this.calls.push({ method: "announcement.play", componentID, args: rawData });
      return Promise.resolve({} as PlatformData);
    },
    stop: (componentID: number): Promise<PlatformData> => {
      this.calls.push({ method: "announcement.stop", componentID });
      return Promise.resolve({} as PlatformData);
    },
    pause: (componentID: number): Promise<PlatformData> => {
      this.calls.push({ method: "announcement.pause", componentID });
      return Promise.resolve({} as PlatformData);
    },
    resume: (componentID: number): Promise<PlatformData> => {
      this.calls.push({ method: "announcement.resume", componentID });
      return Promise.resolve({} as PlatformData);
    },
  };
}

// Helper function to create a test printer with linked components
function createTestPrinter(
  printerID = 1,
  feederID = 2,
  dispenserID = 3,
): { printer: Printer; feeder: Feeder; dispenser: Dispenser; cuss2: MockCuss2 } {
  const cuss2 = new MockCuss2() as unknown as MockCuss2 & Cuss2;

  // Create feeder component
  const feederEnvComponent: EnvironmentComponent = {
    componentID: feederID,
  } as EnvironmentComponent;
  const feeder = new Feeder(feederEnvComponent, cuss2);
  cuss2.components[feederID] = feeder;

  // Create dispenser component
  const dispenserEnvComponent: EnvironmentComponent = {
    componentID: dispenserID,
  } as EnvironmentComponent;
  const dispenser = new Dispenser(dispenserEnvComponent, cuss2);
  cuss2.components[dispenserID] = dispenser;

  // Create printer component with linked components
  const printerEnvComponent: EnvironmentComponent = {
    componentID: printerID,
    linkedComponentIDs: [feederID, dispenserID],
  } as EnvironmentComponent;
  const printer = new Printer(printerEnvComponent, cuss2, DeviceType.BAG_TAG_PRINTER);
  cuss2.components[printerID] = printer;

  return { printer, feeder, dispenser, cuss2 };
}

// Tests for Printer class
Deno.test("Printer constructor should initialize properties correctly", () => {
  const { printer, feeder, dispenser } = createTestPrinter();

  // Check basic properties
  assertEquals(printer.id, 1);
  assertEquals(printer.deviceType, DeviceType.BAG_TAG_PRINTER);

  // Check linked components
  assertExists(printer.feeder);
  assertExists(printer.dispenser);
  assertEquals(printer.feeder, feeder);
  assertEquals(printer.dispenser, dispenser);

  // Check subcomponents array
  assertEquals(printer.subcomponents.length, 2);
  assert(printer.subcomponents.includes(feeder));
  assert(printer.subcomponents.includes(dispenser));
});

Deno.test("Printer constructor should throw error if feeder is missing", () => {
  const cuss2 = new MockCuss2() as unknown as MockCuss2 & Cuss2;

  // Create printer without linked feeder
  const printerEnvComponent: EnvironmentComponent = {
    componentID: 1,
    linkedComponentIDs: [3], // Only dispenser, no feeder
  } as EnvironmentComponent;

  // Create dispenser
  const dispenserEnvComponent: EnvironmentComponent = {
    componentID: 3,
  } as EnvironmentComponent;
  cuss2.components[3] = new Dispenser(dispenserEnvComponent, cuss2);

  assertThrows(
    () => new Printer(printerEnvComponent, cuss2, DeviceType.BAG_TAG_PRINTER),
    Error,
    "Feeder not found for Printer 1",
  );
});

Deno.test("Printer constructor should throw error if dispenser is missing", () => {
  const cuss2 = new MockCuss2() as unknown as MockCuss2 & Cuss2;

  // Create printer without linked dispenser
  const printerEnvComponent: EnvironmentComponent = {
    componentID: 1,
    linkedComponentIDs: [2], // Only feeder, no dispenser
  } as EnvironmentComponent;

  // Create feeder
  const feederEnvComponent: EnvironmentComponent = {
    componentID: 2,
  } as EnvironmentComponent;
  cuss2.components[2] = new Feeder(feederEnvComponent, cuss2);

  assertThrows(
    () => new Printer(printerEnvComponent, cuss2, DeviceType.BAG_TAG_PRINTER),
    Error,
    "Dispenser not found for Printer 1",
  );
});

Deno.test("Printer mediaPresent should delegate to dispenser", () => {
  const { printer, dispenser } = createTestPrinter();

  // Initially no media present
  assert(!printer.mediaPresent);

  // Simulate media present in dispenser
  // @ts-expect-error accessing private property for testing
  dispenser._mediaPresent = true;

  // Printer should report media present
  assert(printer.mediaPresent);
});

Deno.test("Printer updateState should handle CUT n HOLD timeout correctly", () => {
  const { printer } = createTestPrinter();

  // Create a timeout message from CUT n HOLD
  const timeoutMessage: PlatformData = {
    meta: createMeta(
      1,
      MessageCodes.TIMEOUT,
      ComponentState.UNAVAILABLE,
      PlatformDirectives.PERIPHERALS_SEND,
    ),
  } as PlatformData;

  let readyStateChangeEmitted = false;
  printer.on("readyStateChange", () => {
    readyStateChangeEmitted = true;
  });

  // Update state with timeout message
  printer.updateState(timeoutMessage);

  // Component state should be READY, not UNAVAILABLE
  assertEquals(printer._componentState, ComponentState.READY);
  assert(readyStateChangeEmitted);
});

Deno.test("Printer updateState should query linked components when becoming ready", async () => {
  const { printer, feeder, dispenser, cuss2 } = createTestPrinter();

  // Track query calls
  let feederQueried = false;
  let dispenserQueried = false;

  feeder.query = async () => {
    feederQueried = true;
    return await (cuss2.api as MockComponentAPI).getStatus(feeder.id);
  };

  dispenser.query = async () => {
    dispenserQueried = true;
    return await (cuss2.api as MockComponentAPI).getStatus(dispenser.id);
  };

  // Start with printer not ready
  printer._componentState = ComponentState.UNAVAILABLE;

  // Update to ready state
  const readyMessage: PlatformData = {
    meta: createMeta(1, MessageCodes.OK, ComponentState.READY),
  } as PlatformData;

  printer.updateState(readyMessage);

  // Wait a bit for async operations
  await new Promise((resolve) => setTimeout(resolve, 10));

  // Both linked components should have been queried
  assert(feederQueried);
  assert(dispenserQueried);
});

Deno.test("Printer updateState should handle MEDIA_PRESENT message", async () => {
  const { printer, dispenser, cuss2 } = createTestPrinter();

  let dispenserQueried = false;

  dispenser.on("mediaPresent", (present: boolean) => {
    assertEquals(present, true);
  });

  dispenser.query = async () => {
    dispenserQueried = true;
    return await (cuss2.api as MockComponentAPI).getStatus(dispenser.id);
  };

  // Send MEDIA_PRESENT message
  const mediaPresentMessage: PlatformData = {
    meta: createMeta(1, MessageCodes.MEDIA_PRESENT),
  } as PlatformData;

  printer.updateState(mediaPresentMessage);

  // Wait a bit for async operations
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Check that dispenser was queried (mediaPresent event is emitted by dispenser itself)
  assert(dispenserQueried);
});

Deno.test("Printer setupITPS should format commands correctly", async () => {
  const { printer, cuss2 } = createTestPrinter();

  const commands = ["ES", "LS", "PS"];
  await printer.setupITPS(commands);

  // Check API was called with correct parameters
  const api = cuss2.api as MockComponentAPI;
  const lastCall = api.calls[api.calls.length - 1];

  assertEquals(lastCall.method, "setup");
  assertEquals(lastCall.componentID, 1);

  const dataRecords = lastCall.args as Array<{ data: string; dsTypes: CussDataTypes[] }>;
  assertEquals(dataRecords.length, 3);
  assertEquals(dataRecords[0].data, "ES");
  assertEquals(dataRecords[0].dsTypes, [CussDataTypes.DS_TYPES_ITPS]);
  assertEquals(dataRecords[1].data, "LS");
  assertEquals(dataRecords[2].data, "PS");
});

Deno.test("Printer sendITPS should format commands correctly", async () => {
  const { printer, cuss2 } = createTestPrinter();

  const commands = ["CMD1", "CMD2"];
  await printer.sendITPS(commands);

  // Check API was called with correct parameters
  const api = cuss2.api as MockComponentAPI;
  const lastCall = api.calls[api.calls.length - 1];

  assertEquals(lastCall.method, "send");
  assertEquals(lastCall.componentID, 1);

  const dataRecords = lastCall.args as Array<{ data: string; dsTypes: CussDataTypes[] }>;
  assertEquals(dataRecords.length, 2);
  assertEquals(dataRecords[0].data, "CMD1");
  assertEquals(dataRecords[0].dsTypes, [CussDataTypes.DS_TYPES_ITPS]);
});

Deno.test("Printer sendITPSCommand should return parsed response", async () => {
  const { printer, cuss2 } = createTestPrinter();

  // Set up mock response
  (cuss2.api as MockComponentAPI).setupResponse = {
    meta: createMeta(1),
    payload: [{ data: "ESOK;FW=1.0;HW=2.0" }] as DataRecordList,
  } as PlatformData;

  const response = await printer.sendITPSCommand("ES");

  assertEquals(response, "ESOK;FW=1.0;HW=2.0");
});

Deno.test("Printer sendITPSCommand should throw error on empty response", async () => {
  const { printer, cuss2 } = createTestPrinter();

  // Set up mock response with no payload
  (cuss2.api as MockComponentAPI).setupResponse = {
    meta: createMeta(1),
    payload: [] as DataRecordList,
  } as PlatformData;

  await assertRejects(
    async () => await printer.sendITPSCommand("ES"),
    PlatformResponseError,
  );
});

Deno.test("Printer getEnvironment should parse response correctly", async () => {
  const { printer, cuss2 } = createTestPrinter();

  // Set up mock response
  (cuss2.api as MockComponentAPI).setupResponse = {
    meta: createMeta(1),
    payload: [{ data: "ESOK#FW=1.0#HW=2.0#SN=12345" }] as DataRecordList,
  } as PlatformData;

  const env = await printer.getEnvironment();

  // Check parsed environment
  assertEquals(env.FW, "1.0");
  assertEquals(env.HW, "2.0");
  assertEquals(env.SN, "12345");
});

Deno.test("Printer _getPairedResponse should split response correctly", async () => {
  const { printer, cuss2 } = createTestPrinter();

  // Set up mock response
  (cuss2.api as MockComponentAPI).setupResponse = {
    meta: createMeta(1),
    payload: [{ data: "LSOK123456789ABC" }] as DataRecordList,
  } as PlatformData;

  const pairs = await printer._getPairedResponse("LS", 2);

  // Should split after "OK" into pairs of 2
  assertEquals(pairs, ["12", "34", "56", "78", "9A", "BC"]);
});

Deno.test("Printer logos.clear should send correct command and return success", async () => {
  const { printer, cuss2 } = createTestPrinter();

  // Set up mock response
  (cuss2.api as MockComponentAPI).setupResponse = {
    meta: createMeta(1),
    payload: [{ data: "LCOK" }] as DataRecordList,
  } as PlatformData;

  const success = await printer.logos.clear("01");

  // Check command sent
  const api = cuss2.api as MockComponentAPI;
  const lastCall = api.calls[api.calls.length - 1];
  const dataRecords = lastCall.args as Array<{ data: string; dsTypes: CussDataTypes[] }>;
  assertEquals(dataRecords[0].data, "LC01");

  // Check return value
  assert(success);
});

Deno.test("Printer logos.clear should return false on error", async () => {
  const { printer, cuss2 } = createTestPrinter();

  // Set up mock response without OK
  (cuss2.api as MockComponentAPI).setupResponse = {
    meta: createMeta(1),
    payload: [{ data: "LCERROR" }] as DataRecordList,
  } as PlatformData;

  const success = await printer.logos.clear("01");

  assert(!success);
});

Deno.test("Printer logos.query should return logo list", async () => {
  const { printer, cuss2 } = createTestPrinter();

  // Set up mock response
  (cuss2.api as MockComponentAPI).setupResponse = {
    meta: createMeta(1),
    payload: [{ data: "LSOK010203" }] as DataRecordList,
  } as PlatformData;

  const logos = await printer.logos.query();

  assertEquals(logos, ["01", "02", "03"]);
});

Deno.test("Printer pectabs.clear should send correct command", async () => {
  const { printer, cuss2 } = createTestPrinter();

  // Set up mock response
  (cuss2.api as MockComponentAPI).setupResponse = {
    meta: createMeta(1),
    payload: [{ data: "PCOK" }] as DataRecordList,
  } as PlatformData;

  const success = await printer.pectabs.clear("A1");

  // Check command sent
  const api = cuss2.api as MockComponentAPI;
  const lastCall = api.calls[api.calls.length - 1];
  const dataRecords = lastCall.args as Array<{ data: string; dsTypes: CussDataTypes[] }>;
  assertEquals(dataRecords[0].data, "PCA1");

  assert(success);
});

Deno.test("Printer pectabs.query should return pectab list", async () => {
  const { printer, cuss2 } = createTestPrinter();

  // Set up mock response
  (cuss2.api as MockComponentAPI).setupResponse = {
    meta: createMeta(1),
    payload: [{ data: "PSOKA1B2C3" }] as DataRecordList,
  } as PlatformData;

  const pectabs = await printer.pectabs.query();

  assertEquals(pectabs, ["A1", "B2", "C3"]);
});

Deno.test("Printer should emit all necessary events on state changes", () => {
  const { printer } = createTestPrinter();

  const events: string[] = [];

  // Listen to various events
  printer.on("readyStateChange", () => events.push("readyStateChange"));
  printer.on("statusChange", () => events.push("statusChange"));

  // Trigger state change
  const stateChangeMessage: PlatformData = {
    meta: createMeta(1, MessageCodes.SOFTWARE_ERROR, ComponentState.READY),
  } as PlatformData;

  printer.updateState(stateChangeMessage);

  // Check that appropriate events were emitted
  assert(events.includes("readyStateChange"));
  assert(events.includes("statusChange"));
});
