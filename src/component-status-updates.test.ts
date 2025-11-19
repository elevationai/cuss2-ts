import { assertEquals } from "@std/assert";
import { spy } from "@std/testing/mock";
import {
  ApplicationStateCodes as AppState,
  ComponentState,
  MessageCodes,
  type PlatformData,
  PlatformDirectives,
} from "cuss2-typescript-models";
import { createMockCuss2, mockDevice } from "./test-helpers.ts";
import { BarcodeReader } from "./models/BarcodeReader.ts";

// Test suite for the changes in bugfix/preventComponentStateChangeOnEnableDisable
// This branch prevents component status updates from enable/disable/setup commands
// Status should only update from unsolicited messages or query responses

Deno.test("Component status updates - should NOT update status on ENABLE command response", () => {
  const { cuss2 } = createMockCuss2();

  // Create and add a mock barcode reader component
  const componentData = mockDevice.createBarcodeReader(100);
  const component = new BarcodeReader(componentData, cuss2);

  // Set initial status
  // @ts-ignore - accessing private property for testing
  component._status = MessageCodes.OK;

  // Create spy for statusChange event
  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  // Simulate ENABLE command response (with platformDirective)
  const enableResponse: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 100,
      componentState: ComponentState.BUSY,
      messageCode: MessageCodes.DATA_PRESENT, // Different status
      platformDirective: PlatformDirectives.PERIPHERALS_USERPRESENT_ENABLE,
    },
    payload: {},
  } as unknown as PlatformData;

  component.updateState(enableResponse);

  // Status should NOT have changed (no statusChange event emitted)
  assertEquals(statusChangeSpy.calls.length, 0);
  assertEquals(component.status, MessageCodes.OK); // Still original status
});

Deno.test("Component status updates - should NOT update status on DISABLE command response", () => {
  const { cuss2 } = createMockCuss2();

  const componentData = mockDevice.createBarcodeReader(100);
  const component = new BarcodeReader(componentData, cuss2);

  // Set initial status
  // @ts-ignore - accessing private property for testing
  component._status = MessageCodes.OK;

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  // Simulate DISABLE command response
  const disableResponse: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 100,
      componentState: ComponentState.READY,
      messageCode: MessageCodes.TIMEOUT,
      platformDirective: PlatformDirectives.PERIPHERALS_USERPRESENT_DISABLE,
    },
    payload: {},
  } as unknown as PlatformData;

  component.updateState(disableResponse);

  // Status should NOT have changed
  assertEquals(statusChangeSpy.calls.length, 0);
  assertEquals(component.status, MessageCodes.OK);
});

Deno.test("Component status updates - should NOT update status on SETUP command response", () => {
  const { cuss2 } = createMockCuss2();

  const componentData = mockDevice.createBarcodeReader(100);
  const component = new BarcodeReader(componentData, cuss2);

  // @ts-ignore - accessing private property for testing
  component._status = MessageCodes.OK;

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  // Simulate SETUP command response
  const setupResponse: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 100,
      messageCode: MessageCodes.DATA_MISSING,
      platformDirective: PlatformDirectives.PERIPHERALS_SETUP,
    },
    payload: {},
  } as unknown as PlatformData;

  component.updateState(setupResponse);

  // Status should NOT have changed
  assertEquals(statusChangeSpy.calls.length, 0);
  assertEquals(component.status, MessageCodes.OK);
});

Deno.test("Component status updates - should NOT update status on SEND command response", () => {
  const { cuss2 } = createMockCuss2();

  const componentData = mockDevice.createBarcodeReader(100);
  const component = new BarcodeReader(componentData, cuss2);

  // @ts-ignore - accessing private property for testing
  component._status = MessageCodes.OK;

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  // Simulate SEND command response
  const sendResponse: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 100,
      messageCode: MessageCodes.HARDWARE_ERROR,
      platformDirective: PlatformDirectives.PERIPHERALS_SEND,
    },
    payload: {},
  } as unknown as PlatformData;

  component.updateState(sendResponse);

  // Status should NOT have changed
  assertEquals(statusChangeSpy.calls.length, 0);
  assertEquals(component.status, MessageCodes.OK);
});

Deno.test("Component status updates - SHOULD update status on QUERY response", () => {
  const { cuss2 } = createMockCuss2();

  const componentData = mockDevice.createBarcodeReader(100);
  const component = new BarcodeReader(componentData, cuss2);

  // @ts-ignore - accessing private property for testing
  component._status = MessageCodes.OK;

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  // Simulate QUERY response
  const queryResponse: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 100,
      messageCode: MessageCodes.HARDWARE_ERROR,
      platformDirective: PlatformDirectives.PERIPHERALS_QUERY,
    },
    payload: {
      componentStatus: {
        statusCode: MessageCodes.HARDWARE_ERROR,
      },
    },
  } as unknown as PlatformData;

  component.updateState(queryResponse);

  // Status SHOULD have changed
  assertEquals(statusChangeSpy.calls.length, 1);
  assertEquals(statusChangeSpy.calls[0].args[0], MessageCodes.HARDWARE_ERROR);
  assertEquals(component.status, MessageCodes.HARDWARE_ERROR);
});

Deno.test("Component status updates - SHOULD update status on unsolicited message (no platformDirective)", () => {
  const { cuss2 } = createMockCuss2();

  const componentData = mockDevice.createBarcodeReader(100);
  const component = new BarcodeReader(componentData, cuss2);

  // @ts-ignore - accessing private property for testing
  component._status = MessageCodes.OK;

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  // Simulate unsolicited message (no platformDirective)
  const unsolicitedMessage: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 100,
      messageCode: MessageCodes.HARDWARE_ERROR,
      // No platformDirective - this is unsolicited
    },
    payload: {},
  } as unknown as PlatformData;

  component.updateState(unsolicitedMessage);

  // Status SHOULD have changed
  assertEquals(statusChangeSpy.calls.length, 1);
  assertEquals(statusChangeSpy.calls[0].args[0], MessageCodes.HARDWARE_ERROR);
  assertEquals(component.status, MessageCodes.HARDWARE_ERROR);
});

Deno.test("Component status updates - component state changes should still work normally", () => {
  const { cuss2 } = createMockCuss2();

  const componentData = mockDevice.createBarcodeReader(100);
  const component = new BarcodeReader(componentData, cuss2);

  // @ts-ignore - accessing private property for testing
  component._componentState = ComponentState.READY;

  const readyStateChangeSpy = spy();
  component.on("readyStateChange", readyStateChangeSpy);

  // Simulate message changing component state (even with platformDirective)
  const stateChangeMessage: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 100,
      componentState: ComponentState.BUSY,
      messageCode: MessageCodes.OK,
      platformDirective: PlatformDirectives.PERIPHERALS_USERPRESENT_ENABLE,
    },
    payload: {},
  } as unknown as PlatformData;

  component.updateState(stateChangeMessage);

  // Component state SHOULD have changed (readyStateChange event emitted)
  assertEquals(readyStateChangeSpy.calls.length, 1);
  assertEquals(readyStateChangeSpy.calls[0].args[0], false); // BUSY != READY
  assertEquals(component.componentState, ComponentState.BUSY);
});

Deno.test("Component status updates - multiple unsolicited messages should update status each time", () => {
  const { cuss2 } = createMockCuss2();

  const componentData = mockDevice.createBarcodeReader(100);
  const component = new BarcodeReader(componentData, cuss2);

  // @ts-ignore - accessing private property for testing
  component._status = MessageCodes.OK;

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  // First unsolicited message
  component.updateState({
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 100,
      messageCode: MessageCodes.TIMEOUT,
    },
    payload: {},
  } as unknown as PlatformData);

  // Second unsolicited message
  component.updateState({
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 100,
      messageCode: MessageCodes.HARDWARE_ERROR,
    },
    payload: {},
  } as unknown as PlatformData);

  // Third unsolicited message (back to OK)
  component.updateState({
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 100,
      messageCode: MessageCodes.OK,
    },
    payload: {},
  } as unknown as PlatformData);

  // All three status changes should have been recorded
  assertEquals(statusChangeSpy.calls.length, 3);
  assertEquals(statusChangeSpy.calls[0].args[0], MessageCodes.TIMEOUT);
  assertEquals(statusChangeSpy.calls[1].args[0], MessageCodes.HARDWARE_ERROR);
  assertEquals(statusChangeSpy.calls[2].args[0], MessageCodes.OK);
  assertEquals(component.status, MessageCodes.OK);
});
