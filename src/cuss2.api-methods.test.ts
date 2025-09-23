import { assertEquals, assertRejects } from "@std/assert";
import { stub } from "@std/testing/mock";
import {
  type ApplicationData,
  ApplicationStateCodes as AppState,
  type ComponentList,
  type DataRecordList,
  type PlatformData,
  PlatformDirectives,
} from "cuss2-typescript-models";
import {
  CONNECTION_ERROR,
  createMockComponentList,
  createMockCuss2,
  createMockEnvironment,
  MockConnection,
  mockDevice,
} from "./test-helpers.ts";
import { CussDataTypes } from "./types/modelExtensions.ts";
import { Cuss2 } from "./cuss2.ts";

// Section 5: API Method Tests

Deno.test("Section 5.1: getEnvironment - should fetch and store environment data", async () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Mock environment response
  const mockEnvironment = createMockEnvironment();
  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () =>
    Promise.resolve({
      meta: { messageCode: "OK" },
      payload: { environmentLevel: mockEnvironment },
    } as unknown as PlatformData));

  const result = await cuss2.api.getEnvironment();

  // Verify correct directive was sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PLATFORM_ENVIRONMENT);

  // Verify environment was stored
  assertEquals(cuss2.environment, mockEnvironment);
  assertEquals(result, mockEnvironment);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.1: getEnvironment - should throw when not connected", async () => {
  const mockConnection = new MockConnection();
  mockConnection.isOpen = false;
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  await assertRejects(
    () => cuss2.api.getEnvironment(),
    Error,
    CONNECTION_ERROR,
  );
});

Deno.test("Section 5.2: getComponents - should fetch component list and create instances", async () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Create mock component list with various types
  const mockComponentList: ComponentList = [
    mockDevice.createFeeder(10),
    mockDevice.createDispenser(11),
    mockDevice.createFeeder(12), // Feeder for boarding pass printer
    mockDevice.createDispenser(13), // Dispenser for boarding pass printer
    mockDevice.createBagTagPrinter(1, [10, 11]),
    mockDevice.createBoardingPassPrinter(2, [12, 13]),
    mockDevice.createBarcodeReader(3),
    mockDevice.createCardReader(4),
    mockDevice.createAnnouncement(5),
  ] as unknown as ComponentList;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () =>
    Promise.resolve({
      meta: { messageCode: "OK" },
      payload: { componentList: mockComponentList },
    } as unknown as PlatformData));

  const result = await cuss2.api.getComponents();

  // Verify correct directive was sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PLATFORM_COMPONENTS);

  // Verify component list was returned
  assertEquals(result, mockComponentList);

  // Verify components were created and stored
  assertEquals(Object.keys(cuss2.components!).length, 9);
  assertEquals(cuss2.components!["1"].constructor.name, "BagTagPrinter");
  assertEquals(cuss2.components!["2"].constructor.name, "BoardingPassPrinter");
  assertEquals(cuss2.components!["3"].constructor.name, "BarcodeReader");
  assertEquals(cuss2.components!["4"].constructor.name, "CardReader");
  assertEquals(cuss2.components!["5"].constructor.name, "Announcement");
  assertEquals(cuss2.components!["10"].constructor.name, "Feeder");
  assertEquals(cuss2.components!["11"].constructor.name, "Dispenser");
  assertEquals(cuss2.components!["12"].constructor.name, "Feeder");
  assertEquals(cuss2.components!["13"].constructor.name, "Dispenser");

  // Verify that components exist in the components map with correct types
  // Note: The assignment to cuss2.bagTagPrinter etc. depends on component interrogation
  // which may require more specific mock setup

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.2: getComponents - should return existing list if components already loaded", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  // Pre-populate components
  // @ts-ignore - mocking components for testing
  cuss2.components = { "1": {} };

  const mockComponentList = createMockComponentList();
  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () =>
    Promise.resolve({
      meta: { messageCode: "OK" },
      payload: { componentList: mockComponentList },
    } as unknown as PlatformData));

  const result = await cuss2.api.getComponents();

  // Should return list but not recreate components
  assertEquals(result, mockComponentList);
  assertEquals(Object.keys(cuss2.components).length, 1); // Still just the pre-populated one

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.3: getStatus - should query specific component status", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: {
      messageCode: "OK",
      componentID: 123,
    },
    payload: {
      componentStatus: {
        statusCode: "READY",
      },
    },
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  const result = await cuss2.api.getStatus(123);

  // Verify correct directive and componentID were sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PERIPHERALS_QUERY);
  assertEquals(sentData.meta.componentID, 123);

  // Verify response was returned
  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.4: send - should send data to component", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  // Test with DataRecordList
  const testData: DataRecordList = [
    {
      data: "test data",
      encoding: "TEXT" as const,
      dsTypes: [CussDataTypes.DS_TYPES_BARCODE],
    },
  ];

  const result = await cuss2.api.send(456, testData);

  // Verify correct directive and data were sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PERIPHERALS_SEND);
  assertEquals(sentData.meta.componentID, 456);
  assertEquals(sentData.payload?.dataRecords, testData);

  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.5: setup - should setup component with data", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  const setupData: DataRecordList = [
    {
      data: "setup data",
      encoding: "TEXT" as const,
      dsTypes: [CussDataTypes.DS_TYPES_KEY],
    },
  ];

  const result = await cuss2.api.setup(789, setupData);

  // Verify correct directive and data were sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PERIPHERALS_SETUP);
  assertEquals(sentData.meta.componentID, 789);
  assertEquals(sentData.payload?.dataRecords, setupData);

  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.5: setup - should validate componentID", async () => {
  const { cuss2 } = createMockCuss2();

  await assertRejects(
    // @ts-ignore - testing invalid input
    () => cuss2.api.setup("invalid", []),
    TypeError,
    "Invalid componentID: invalid",
  );
});

Deno.test("Section 5.6: cancel - should cancel component operation", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  const result = await cuss2.api.cancel(321);

  // Verify correct directive was sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PERIPHERALS_CANCEL);
  assertEquals(sentData.meta.componentID, 321);

  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.6: cancel - should validate componentID", async () => {
  const { cuss2 } = createMockCuss2();

  await assertRejects(
    // @ts-ignore - testing invalid input
    () => cuss2.api.cancel(null),
    TypeError,
    "Invalid componentID: null",
  );
});

Deno.test("Section 5.7: enable - should enable component", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  const result = await cuss2.api.enable(111);

  // Verify correct directive was sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PERIPHERALS_USERPRESENT_ENABLE);
  assertEquals(sentData.meta.componentID, 111);

  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.7: disable - should disable component", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  const result = await cuss2.api.disable(222);

  // Verify correct directive was sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PERIPHERALS_USERPRESENT_DISABLE);
  assertEquals(sentData.meta.componentID, 222);

  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.7: offer - should offer component", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  const result = await cuss2.api.offer(333);

  // Verify correct directive was sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PERIPHERALS_USERPRESENT_OFFER);
  assertEquals(sentData.meta.componentID, 333);

  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.8: announcement.play - should play announcement", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  const ssmlData = "<speak>Hello world</speak>";
  const result = await cuss2.api.announcement.play(555, ssmlData);

  // Verify correct directive and data were sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PERIPHERALS_ANNOUNCEMENT_PLAY);
  assertEquals(sentData.meta.componentID, 555);
  assertEquals(sentData.payload?.dataRecords, [{
    data: ssmlData,
    dsTypes: [CussDataTypes.DS_TYPES_SSML],
  }]);

  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.8: announcement.pause - should pause announcement", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  const result = await cuss2.api.announcement.pause(666);

  // Verify correct directive was sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PERIPHERALS_ANNOUNCEMENT_PAUSE);
  assertEquals(sentData.meta.componentID, 666);

  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.8: announcement.resume - should resume announcement", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  const result = await cuss2.api.announcement.resume(777);

  // Verify correct directive was sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PERIPHERALS_ANNOUNCEMENT_RESUME);
  assertEquals(sentData.meta.componentID, 777);

  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.8: announcement.stop - should stop announcement", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  const result = await cuss2.api.announcement.stop(888);

  // Verify correct directive was sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PERIPHERALS_ANNOUNCEMENT_STOP);
  assertEquals(sentData.meta.componentID, 888);

  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5.8: announcement methods - should validate componentID", async () => {
  const { cuss2 } = createMockCuss2();

  await assertRejects(
    // @ts-ignore - testing invalid input
    () => cuss2.api.announcement.play(undefined, "data"),
    TypeError,
    "Invalid componentID: undefined",
  );

  await assertRejects(
    // @ts-ignore - testing invalid input
    () => cuss2.api.announcement.pause("123"),
    TypeError,
    "Invalid componentID: 123",
  );

  await assertRejects(
    // @ts-ignore - testing invalid input
    () => cuss2.api.announcement.resume(false),
    TypeError,
    "Invalid componentID: false",
  );

  await assertRejects(
    // @ts-ignore - testing invalid input
    () => cuss2.api.announcement.stop({}),
    TypeError,
    "Invalid componentID: [object Object]",
  );
});

// Additional test for staterequest method (not explicitly in section 5 but part of API)
Deno.test("Section 5: staterequest - should handle state change requests", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const mockResponse: PlatformData = {
    meta: {
      messageCode: "OK",
      currentApplicationState: { applicationStateCode: AppState.AVAILABLE },
    },
    payload: {},
  } as unknown as PlatformData;

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () => Promise.resolve(mockResponse));

  const result = await cuss2.api.staterequest(AppState.AVAILABLE);

  // Verify state change was sent
  assertEquals(sendAndGetResponseStub.calls.length, 1);
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.meta.directive, PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST);
  assertEquals(sentData.payload?.applicationState?.applicationStateCode, AppState.AVAILABLE);

  assertEquals(result, mockResponse);

  sendAndGetResponseStub.restore();
});

Deno.test("Section 5: staterequest - should return undefined if pending state change", async () => {
  const { cuss2 } = createMockCuss2();

  // Set pending state change
  // @ts-ignore - accessing private property for testing
  cuss2.pendingStateChange = AppState.AVAILABLE;

  const result = await cuss2.api.staterequest(AppState.ACTIVE);

  assertEquals(result, undefined);
});

// Test different data types for send method
Deno.test("Section 5.4: send - should handle different data types", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const sendAndGetResponseStub = stub(mockConnection, "sendAndGetResponse", () =>
    Promise.resolve({
      meta: { messageCode: "OK" },
      payload: {},
    } as unknown as PlatformData));

  // Test with ScreenResolution
  await cuss2.api.send(1, { vertical: 1080, horizontal: 1920 });
  const sentData = sendAndGetResponseStub.calls[0].args[0] as ApplicationData;
  assertEquals(sentData.payload?.screenResolution, { vertical: 1080, horizontal: 1920 });

  // Test validates that different data types can be sent
  // Additional type-specific tests would require exact type definitions

  sendAndGetResponseStub.restore();
});
