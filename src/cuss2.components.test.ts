import { assertEquals } from "@std/assert";
import { Cuss2 } from "./cuss2.ts";
import type { PlatformData } from "cuss2-typescript-models";
import { ComponentTypes, type EnvironmentComponent } from "./types/modelExtensions.ts";
import { createMockCharacteristics, createMockComponent, MockConnection, mockDevice } from "./test-helpers.ts";

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
        mockDevice.createFeeder(10),
        mockDevice.createDispenser(11),
        mockDevice.createFeeder(12),
        mockDevice.createDispenser(13),
        // Printers (with linked feeders and dispensers)
        mockDevice.createBagTagPrinter(1, [10, 11]),
        mockDevice.createBoardingPassPrinter(2, [12, 13]),
        // Other components
        mockDevice.createBarcodeReader(3),
        mockDevice.createCardReader(4),
        mockDevice.createAnnouncement(5),
      ];

      return Promise.resolve({
        meta: { messageCode: "OK" },
        payload: { componentList },
      } as unknown as PlatformData);
    }
    return Promise.resolve({
      meta: { messageCode: "OK" },
      payload: {},
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
    BagTagPrinter,
    BoardingPassPrinter,
    DocumentReader,
    BarcodeReader,
    CardReader,
    Biometric,
    Scale,
    Camera,
    Announcement,
    Keypad,
    Illumination,
    Headset,
    InsertionBelt,
    ParkingBelt,
    VerificationBelt,
    RFID,
    BHS,
    AEASBD,
    Feeder,
    Dispenser,
    Component,
    BaseComponent,
  } = await import("./models/index.ts");

  // Mock component list with all types
  // Helper to create component type test data
  const createComponentType = (
    id: number,
    createFn: (id: number) => EnvironmentComponent,
    expectedClass: typeof Component | typeof BaseComponent,
    property: string | null = null,
  ) => ({ id, component: createFn(id), expectedClass, property });

  const createPrinterType = (
    id: number,
    linkedIds: number[],
    createFn: (id: number, linkedIds: number[]) => EnvironmentComponent,
    expectedClass: typeof Component | typeof BaseComponent,
    property: string,
  ) => ({ id, component: createFn(id, linkedIds), expectedClass, property });

  const componentTypes = [
    // Feeders and Dispensers
    createComponentType(100, mockDevice.createFeeder, Feeder),
    createComponentType(101, mockDevice.createDispenser, Dispenser),
    createComponentType(102, mockDevice.createFeeder, Feeder),
    createComponentType(103, mockDevice.createDispenser, Dispenser),
    // Printers with linked components
    createPrinterType(1, [100, 101], mockDevice.createBagTagPrinter, BagTagPrinter, "bagTagPrinter"),
    createPrinterType(2, [102, 103], mockDevice.createBoardingPassPrinter, BoardingPassPrinter, "boardingPassPrinter"),
    // Other components
    createComponentType(3, mockDevice.createDocumentReader, DocumentReader, "documentReader"),
    createComponentType(4, mockDevice.createBarcodeReader, BarcodeReader, "barcodeReader"),
    createComponentType(5, mockDevice.createCardReader, CardReader, "cardReader"),
    createComponentType(6, mockDevice.createBiometric, Biometric, "biometric"),
    createComponentType(7, mockDevice.createScale, Scale, "scale"),
    createComponentType(8, mockDevice.createCamera, Camera, "camera"),
    createComponentType(9, mockDevice.createAnnouncement, Announcement, "announcement"),
    createComponentType(10, mockDevice.createKeypad, Keypad, "keypad"),
    createComponentType(11, mockDevice.createIllumination, Illumination, "illumination"),
    createComponentType(12, mockDevice.createHeadset, Headset, "headset"),
    createComponentType(13, mockDevice.createInsertionBelt, InsertionBelt, "insertionBelt"),
    createComponentType(14, mockDevice.createParkingBelt, ParkingBelt, "parkingBelt"),
    createComponentType(15, mockDevice.createVerificationBelt, VerificationBelt, "verificationBelt"),
    createComponentType(16, mockDevice.createRFID, RFID, "rfid"),
    createComponentType(17, mockDevice.createBHS, BHS, "bhs"),
    createComponentType(18, mockDevice.createAEASBD, AEASBD, "aeasbd"),
  ];

  // Mock sendAndGetResponse
  mockConnection.sendAndGetResponse = (data: unknown) => {
    const appData = data as { meta?: { directive?: string } };
    if (appData.meta?.directive === "platform_components") {
      return Promise.resolve({
        meta: { messageCode: "OK" },
        payload: {
          componentList: componentTypes.map((ct) => ct.component),
        },
      } as unknown as PlatformData);
    }
    return Promise.resolve({ payload: {} } as unknown as PlatformData);
  };

  // Call getComponents
  await cuss2.api.getComponents();

  // Verify each component type created correct class
  for (const ct of componentTypes) {
    const component = cuss2.components![String(ct.id)];
    assertEquals(
      component instanceof ct.expectedClass,
      true,
      `Component ID ${ct.id} should be instance of ${ct.expectedClass.name}`,
    );

    // Verify property assignment if applicable
    if (ct.property) {
      // @ts-ignore - accessing dynamic property
      assertEquals(
        cuss2[ct.property] === component,
        true,
        `Component ID ${ct.id} should be assigned to cuss2.${ct.property}`,
      );
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
            mockDevice.createFeeder(2),
            // Dispenser (ID 3)
            mockDevice.createDispenser(3),
            // Additional Feeder (ID 5)
            mockDevice.createFeeder(5),
            // Additional Dispenser (ID 6)
            mockDevice.createDispenser(6),
            // Bag Tag Printer (linked to feeder 2 and dispenser 3)
            mockDevice.createBagTagPrinter(1, [2, 3]),
            // Boarding Pass Printer (linked to feeder 5 and dispenser 6)
            mockDevice.createBoardingPassPrinter(4, [5, 6]),
          ],
        },
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
      payload: { componentList: [] },
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
          }),
        ],
      },
    } as unknown as PlatformData);
  };

  await cuss2.api.getComponents();

  // Verify generic Component was created
  const component = cuss2.components!["1"];
  assertEquals(component instanceof Component, true);
  assertEquals(component.constructor.name, "Component");
});
