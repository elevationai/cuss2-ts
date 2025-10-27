import { assertEquals } from "@std/assert";
import { ComponentInterrogation } from "./componentInterrogation.ts";
import {
  type ComponentCharacteristics,
  ComponentTypes,
  CussDataTypes,
  DeviceTypes,
  type EnvironmentComponent,
  MediaTypes,
} from "cuss2-typescript-models";

// Helper function to create a mock EnvironmentComponent
function createMockComponent(overrides: Partial<EnvironmentComponent> = {}): EnvironmentComponent {
  return {
    componentID: 1,
    componentType: ComponentTypes.DATA_INPUT,
    componentDescription: "Test Component",
    componentCharacteristics: [],
    ...overrides,
  } as EnvironmentComponent;
}

// Helper function to create mock ComponentCharacteristics
function createMockCharacteristics(overrides: Partial<ComponentCharacteristics> = {}): ComponentCharacteristics {
  return {
    dsTypesList: [],
    mediaTypesList: [],
    deviceTypesList: [],
    ...overrides,
  } as ComponentCharacteristics;
}

// Tests for utility functions (these are not exported, so we test them through the static methods)
Deno.test("ComponentInterrogation - isAnnouncement", () => {
  const announcementComponent = createMockComponent({
    componentType: ComponentTypes.ANNOUNCEMENT,
  });
  const otherComponent = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
  });

  assertEquals(ComponentInterrogation.isAnnouncement(announcementComponent), true);
  assertEquals(ComponentInterrogation.isAnnouncement(otherComponent), false);
});

Deno.test("ComponentInterrogation - isFeeder", () => {
  const feederComponent = createMockComponent({
    componentType: ComponentTypes.FEEDER,
  });
  const otherComponent = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
  });

  assertEquals(ComponentInterrogation.isFeeder(feederComponent), true);
  assertEquals(ComponentInterrogation.isFeeder(otherComponent), false);
});

Deno.test("ComponentInterrogation - isDispenser", () => {
  const dispenserComponent = createMockComponent({
    componentType: ComponentTypes.DISPENSER,
  });
  const otherComponent = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
  });

  assertEquals(ComponentInterrogation.isDispenser(dispenserComponent), true);
  assertEquals(ComponentInterrogation.isDispenser(otherComponent), false);
});

Deno.test("ComponentInterrogation - isBagTagPrinter", () => {
  const bagTagPrinter = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.PRINT],
        mediaTypesList: [MediaTypes.BAGGAGETAG],
      }),
    ],
  });

  const boardingPassPrinter = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.PRINT],
        mediaTypesList: [MediaTypes.BOARDINGPASS],
      }),
    ],
  });

  const nonPrinter = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.SCALE],
        mediaTypesList: [MediaTypes.BAGGAGETAG],
      }),
    ],
  });

  const noCharacteristics = createMockComponent();

  assertEquals(!!ComponentInterrogation.isBagTagPrinter(bagTagPrinter), true);
  assertEquals(!!ComponentInterrogation.isBagTagPrinter(boardingPassPrinter), false);
  assertEquals(!!ComponentInterrogation.isBagTagPrinter(nonPrinter), false);
  assertEquals(ComponentInterrogation.isBagTagPrinter(noCharacteristics), undefined);
});

Deno.test("ComponentInterrogation - isBoardingPassPrinter", () => {
  const boardingPassPrinter = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.PRINT],
        mediaTypesList: [MediaTypes.BOARDINGPASS],
      }),
    ],
  });

  const bagTagPrinter = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.PRINT],
        mediaTypesList: [MediaTypes.BAGGAGETAG],
      }),
    ],
  });

  const nonPrinter = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.SCALE],
        mediaTypesList: [MediaTypes.BOARDINGPASS],
      }),
    ],
  });

  const noCharacteristics = createMockComponent();

  assertEquals(!!ComponentInterrogation.isBoardingPassPrinter(boardingPassPrinter), true);
  assertEquals(!!ComponentInterrogation.isBoardingPassPrinter(bagTagPrinter), false);
  assertEquals(!!ComponentInterrogation.isBoardingPassPrinter(nonPrinter), false);
  assertEquals(ComponentInterrogation.isBoardingPassPrinter(noCharacteristics), undefined);
});

Deno.test("ComponentInterrogation - isDocumentReader", () => {
  const documentReader = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        mediaTypesList: [MediaTypes.PASSPORT],
      }),
    ],
  });

  const nonDocumentReader = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        mediaTypesList: [MediaTypes.BOARDINGPASS],
      }),
    ],
  });

  const noCharacteristics = createMockComponent();

  assertEquals(!!ComponentInterrogation.isDocumentReader(documentReader), true);
  assertEquals(!!ComponentInterrogation.isDocumentReader(nonDocumentReader), false);
  assertEquals(ComponentInterrogation.isDocumentReader(noCharacteristics), undefined);
});

Deno.test("ComponentInterrogation - isBarcodeReader", () => {
  const barcodeReader = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_BARCODE],
      }),
    ],
  });

  const nonBarcodeReader = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_KEY],
      }),
    ],
  });

  const noCharacteristics = createMockComponent();

  assertEquals(!!ComponentInterrogation.isBarcodeReader(barcodeReader), true);
  assertEquals(!!ComponentInterrogation.isBarcodeReader(nonBarcodeReader), false);
  assertEquals(ComponentInterrogation.isBarcodeReader(noCharacteristics), undefined);
});

Deno.test("ComponentInterrogation - isCardReader", () => {
  const cardReader = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        mediaTypesList: ["MAGCARD" as MediaTypes],
      }),
    ],
  });

  const nonCardReader = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        mediaTypesList: [MediaTypes.PASSPORT],
      }),
    ],
  });

  const noCharacteristics = createMockComponent();

  assertEquals(!!ComponentInterrogation.isCardReader(cardReader), true);
  assertEquals(!!ComponentInterrogation.isCardReader(nonCardReader), false);
  assertEquals(ComponentInterrogation.isCardReader(noCharacteristics), undefined);
});

Deno.test("ComponentInterrogation - isKeypad", () => {
  const keypadWithKey = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_KEY],
      }),
    ],
  });

  const keypadWithKeyUp = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_KEY_UP],
      }),
    ],
  });

  const keypadWithKeyDown = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_KEY_DOWN],
      }),
    ],
  });

  const keypadWithMultiple = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_KEY, CussDataTypes.DS_TYPES_KEY_UP],
      }),
    ],
  });

  const nonKeypad = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_BARCODE],
      }),
    ],
  });

  const noCharacteristics = createMockComponent();

  assertEquals(!!ComponentInterrogation.isKeypad(keypadWithKey), true);
  assertEquals(!!ComponentInterrogation.isKeypad(keypadWithKeyUp), true);
  assertEquals(!!ComponentInterrogation.isKeypad(keypadWithKeyDown), true);
  assertEquals(!!ComponentInterrogation.isKeypad(keypadWithMultiple), true);
  assertEquals(!!ComponentInterrogation.isKeypad(nonKeypad), false);
  assertEquals(ComponentInterrogation.isKeypad(noCharacteristics), undefined);
});

Deno.test("ComponentInterrogation - isIllumination", () => {
  const illumination = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.ILLUMINATION],
      }),
    ],
  });

  const nonIllumination = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.PRINT],
      }),
    ],
  });

  const noCharacteristics = createMockComponent();

  assertEquals(!!ComponentInterrogation.isIllumination(illumination), true);
  assertEquals(!!ComponentInterrogation.isIllumination(nonIllumination), false);
  assertEquals(ComponentInterrogation.isIllumination(noCharacteristics), undefined);
});

Deno.test("ComponentInterrogation - isHeadset", () => {
  const headset = createMockComponent({
    componentType: ComponentTypes.MEDIA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.ASSISTIVE],
        mediaTypesList: [MediaTypes.AUDIO],
      }),
    ],
  });

  const wrongComponentType = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.ASSISTIVE],
        mediaTypesList: [MediaTypes.AUDIO],
      }),
    ],
  });

  const missingAssistive = createMockComponent({
    componentType: ComponentTypes.MEDIA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.PRINT],
        mediaTypesList: [MediaTypes.AUDIO],
      }),
    ],
  });

  const missingAudio = createMockComponent({
    componentType: ComponentTypes.MEDIA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.ASSISTIVE],
        mediaTypesList: [MediaTypes.IMAGE],
      }),
    ],
  });

  const noCharacteristics = createMockComponent({
    componentType: ComponentTypes.MEDIA_INPUT,
  });

  assertEquals(!!ComponentInterrogation.isHeadset(headset), true);
  assertEquals(ComponentInterrogation.isHeadset(wrongComponentType), undefined);
  assertEquals(!!ComponentInterrogation.isHeadset(missingAssistive), false);
  assertEquals(!!ComponentInterrogation.isHeadset(missingAudio), false);
  assertEquals(ComponentInterrogation.isHeadset(noCharacteristics), undefined);
});

Deno.test("ComponentInterrogation - isScale", () => {
  const scale = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.SCALE],
      }),
    ],
  });

  const wrongComponentType = createMockComponent({
    componentType: ComponentTypes.MEDIA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.SCALE],
      }),
    ],
  });

  const nonScale = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.PRINT],
      }),
    ],
  });

  const noCharacteristics = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
  });

  assertEquals(!!ComponentInterrogation.isScale(scale), true);
  assertEquals(ComponentInterrogation.isScale(wrongComponentType), undefined);
  assertEquals(!!ComponentInterrogation.isScale(nonScale), false);
  assertEquals(ComponentInterrogation.isScale(noCharacteristics), undefined);
});

Deno.test("ComponentInterrogation - isBiometric", () => {
  const biometric = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_BIOMETRIC],
      }),
    ],
  });

  const nonBiometric = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_BARCODE],
      }),
    ],
  });

  const noCharacteristics = createMockComponent();

  assertEquals(!!ComponentInterrogation.isBiometric(biometric), true);
  assertEquals(!!ComponentInterrogation.isBiometric(nonBiometric), false);
  assertEquals(ComponentInterrogation.isBiometric(noCharacteristics), undefined);
});

Deno.test("ComponentInterrogation - isCamera", () => {
  const camera = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.CAMERA],
        mediaTypesList: [MediaTypes.IMAGE],
      }),
    ],
  });

  const wrongComponentType = createMockComponent({
    componentType: ComponentTypes.MEDIA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.CAMERA],
        mediaTypesList: [MediaTypes.IMAGE],
      }),
    ],
  });

  const missingCamera = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.PRINT],
        mediaTypesList: [MediaTypes.IMAGE],
      }),
    ],
  });

  const missingImage = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.CAMERA],
        mediaTypesList: [MediaTypes.AUDIO],
      }),
    ],
  });

  const noCharacteristics = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
  });

  assertEquals(!!ComponentInterrogation.isCamera(camera), true);
  assertEquals(ComponentInterrogation.isCamera(wrongComponentType), undefined);
  assertEquals(!!ComponentInterrogation.isCamera(missingCamera), false);
  assertEquals(!!ComponentInterrogation.isCamera(missingImage), false);
  assertEquals(ComponentInterrogation.isCamera(noCharacteristics), undefined);
});

Deno.test("ComponentInterrogation - isRFIDReader", () => {
  const rfidReader = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.CONTACTLESS],
        mediaTypesList: [MediaTypes.RFID],
      }),
    ],
  });

  const wrongComponentType = createMockComponent({
    componentType: ComponentTypes.MEDIA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.CONTACTLESS],
        mediaTypesList: [MediaTypes.RFID],
      }),
    ],
  });

  const missingContactless = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.PRINT],
        mediaTypesList: [MediaTypes.RFID],
      }),
    ],
  });

  const missingRFID = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.CONTACTLESS],
        mediaTypesList: [MediaTypes.IMAGE],
      }),
    ],
  });

  const noCharacteristics = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
  });

  assertEquals(ComponentInterrogation.isRFIDReader(rfidReader), true);
  assertEquals(ComponentInterrogation.isRFIDReader(wrongComponentType), false);
  assertEquals(ComponentInterrogation.isRFIDReader(missingContactless), false);
  assertEquals(ComponentInterrogation.isRFIDReader(missingRFID), false);
  assertEquals(ComponentInterrogation.isRFIDReader(noCharacteristics), false);
});

Deno.test("ComponentInterrogation - isInsertionBelt", () => {
  const insertionBelt = createMockComponent({
    componentType: ComponentTypes.INSERTION_BELT,
    componentCharacteristics: [createMockCharacteristics()],
  });

  const otherComponent = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [createMockCharacteristics()],
  });

  const noCharacteristics = createMockComponent({
    componentType: ComponentTypes.INSERTION_BELT,
  });

  assertEquals(ComponentInterrogation.isInsertionBelt(insertionBelt), true);
  assertEquals(ComponentInterrogation.isInsertionBelt(otherComponent), false);
  assertEquals(ComponentInterrogation.isInsertionBelt(noCharacteristics), false);
});

Deno.test("ComponentInterrogation - isVerificationBelt", () => {
  const verificationBelt = createMockComponent({
    componentType: ComponentTypes.VERIFICATION_BELT,
    componentCharacteristics: [createMockCharacteristics()],
  });

  const otherComponent = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [createMockCharacteristics()],
  });

  const noCharacteristics = createMockComponent({
    componentType: ComponentTypes.VERIFICATION_BELT,
  });

  assertEquals(ComponentInterrogation.isVerificationBelt(verificationBelt), true);
  assertEquals(ComponentInterrogation.isVerificationBelt(otherComponent), false);
  assertEquals(ComponentInterrogation.isVerificationBelt(noCharacteristics), false);
});

Deno.test("ComponentInterrogation - isParkingBelt", () => {
  const parkingBelt = createMockComponent({
    componentType: ComponentTypes.PARKING_BELT,
    componentCharacteristics: [createMockCharacteristics()],
  });

  const otherComponent = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [createMockCharacteristics()],
  });

  const noCharacteristics = createMockComponent({
    componentType: ComponentTypes.PARKING_BELT,
  });

  assertEquals(ComponentInterrogation.isParkingBelt(parkingBelt), true);
  assertEquals(ComponentInterrogation.isParkingBelt(otherComponent), false);
  assertEquals(ComponentInterrogation.isParkingBelt(noCharacteristics), false);
});

Deno.test("ComponentInterrogation - isAEASBD", () => {
  const aeasbd = createMockComponent({
    componentType: ComponentTypes.USER_OUTPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: ["SBDAEA" as CussDataTypes],
      }),
    ],
  });

  const wrongComponentType = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: ["SBDAEA" as CussDataTypes],
      }),
    ],
  });

  const wrongDsType = createMockComponent({
    componentType: ComponentTypes.USER_OUTPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_BARCODE],
      }),
    ],
  });

  const noCharacteristics = createMockComponent({
    componentType: ComponentTypes.USER_OUTPUT,
  });

  assertEquals(ComponentInterrogation.isAEASBD(aeasbd), true);
  assertEquals(ComponentInterrogation.isAEASBD(wrongComponentType), false);
  assertEquals(ComponentInterrogation.isAEASBD(wrongDsType), false);
  assertEquals(ComponentInterrogation.isAEASBD(noCharacteristics), false);
});

Deno.test("ComponentInterrogation - isBHS", () => {
  const bhs = createMockComponent({
    componentType: ComponentTypes.DATA_OUTPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_RP1745],
      }),
    ],
  });

  const wrongComponentType = createMockComponent({
    componentType: ComponentTypes.DATA_INPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_RP1745],
      }),
    ],
  });

  const wrongDsType = createMockComponent({
    componentType: ComponentTypes.DATA_OUTPUT,
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [CussDataTypes.DS_TYPES_BARCODE],
      }),
    ],
  });

  const noCharacteristics = createMockComponent({
    componentType: ComponentTypes.DATA_OUTPUT,
  });

  assertEquals(ComponentInterrogation.isBHS(bhs), true);
  assertEquals(ComponentInterrogation.isBHS(wrongComponentType), false);
  assertEquals(ComponentInterrogation.isBHS(wrongDsType), false);
  assertEquals(ComponentInterrogation.isBHS(noCharacteristics), false);
});

// Test edge cases and multiple values in lists
Deno.test("ComponentInterrogation - handles multiple values in lists", () => {
  const multipleDeviceTypes = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        deviceTypesList: [DeviceTypes.PRINT, DeviceTypes.SCALE, DeviceTypes.CAMERA],
        mediaTypesList: [MediaTypes.BAGGAGETAG, MediaTypes.BOARDINGPASS],
      }),
    ],
  });

  // Should still detect bag tag printer even with multiple device types
  assertEquals(!!ComponentInterrogation.isBagTagPrinter(multipleDeviceTypes), true);
  // Should also detect boarding pass printer
  assertEquals(!!ComponentInterrogation.isBoardingPassPrinter(multipleDeviceTypes), true);

  const multipleDsTypes = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [
          CussDataTypes.DS_TYPES_BARCODE,
          CussDataTypes.DS_TYPES_KEY,
          CussDataTypes.DS_TYPES_BIOMETRIC,
        ],
      }),
    ],
  });

  // Should detect all types present
  assertEquals(!!ComponentInterrogation.isBarcodeReader(multipleDsTypes), true);
  assertEquals(!!ComponentInterrogation.isKeypad(multipleDsTypes), true);
  assertEquals(!!ComponentInterrogation.isBiometric(multipleDsTypes), true);
});

// Test handling of empty arrays and null/undefined values
Deno.test("ComponentInterrogation - handles empty and undefined values gracefully", () => {
  const emptyLists = createMockComponent({
    componentCharacteristics: [
      createMockCharacteristics({
        dsTypesList: [],
        mediaTypesList: [],
        deviceTypesList: [],
      }),
    ],
  });

  // All type checks should return false/undefined for empty lists
  assertEquals(!!ComponentInterrogation.isBagTagPrinter(emptyLists), false);
  assertEquals(!!ComponentInterrogation.isBarcodeReader(emptyLists), false);
  assertEquals(!!ComponentInterrogation.isKeypad(emptyLists), false);

  const undefinedLists = createMockComponent({
    componentCharacteristics: [
      {
        // Intentionally not setting any lists to test undefined handling
      } as ComponentCharacteristics,
    ],
  });

  // Should handle undefined lists gracefully
  assertEquals(!!ComponentInterrogation.isBagTagPrinter(undefinedLists), false);
  assertEquals(!!ComponentInterrogation.isBarcodeReader(undefinedLists), false);
  assertEquals(!!ComponentInterrogation.isCardReader(undefinedLists), false);
});
