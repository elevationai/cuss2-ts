/**
 * End-to-end tests for DATA_PRESENT unsolicited messages
 * Tests the full pipeline: _handleWebSocketMessage → component listener → handleMessage → "data" event
 */

import { assertEquals } from "@std/assert";
import { spy } from "@std/testing/mock";
import {
  ApplicationStateCodes as AppState,
  ComponentState,
  type DataRecord,
  MessageCodes,
  type PlatformData,
  PlatformDirectives,
} from "cuss2-typescript-models";
import { createMockCuss2, mockDevice } from "./test-helpers.ts";
import { BarcodeReader } from "./models/BarcodeReader.ts";
import { Keypad } from "./models/Keypad.ts";
import { StateChange } from "./models/stateChange.ts";

// Helper: build an unsolicited DATA_PRESENT message (no platformDirective)
function buildDataPresentMessage(
  componentID: number,
  dataRecords: DataRecord[],
  appState: AppState = AppState.ACTIVE,
): PlatformData {
  return {
    meta: {
      currentApplicationState: { applicationStateCode: appState },
      componentID,
      messageCode: MessageCodes.DATA_PRESENT,
      componentState: ComponentState.READY,
    },
    payload: {
      dataRecords,
    },
  } as unknown as PlatformData;
}

// Helper: set up a component in a mock cuss2 for end-to-end testing
function setupComponent(cuss2: ReturnType<typeof createMockCuss2>["cuss2"], component: { id: number }) {
  // @ts-ignore: accessing private for testing
  if (!cuss2.components) cuss2.components = {};
  // @ts-ignore: accessing private for testing
  cuss2.components[String(component.id)] = component;
  // @ts-ignore: accessing private for testing
  cuss2._currentState = new StateChange(AppState.ACTIVE, AppState.ACTIVE);
}

// Helper: set component to READY/OK state
function setComponentReady(component: BarcodeReader | Keypad) {
  component.updateState({
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: component.id,
      componentState: ComponentState.READY,
      messageCode: MessageCodes.OK,
      platformDirective: PlatformDirectives.PERIPHERALS_QUERY,
    },
    payload: {},
  } as unknown as PlatformData);
}

Deno.test("DATA_PRESENT - component.handleMessage emits 'data' event directly", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  const dataSpy = spy();
  component.on("data", dataSpy);

  const records: DataRecord[] = [
    { data: "ABC123", dsTypes: ["DS_TYPES_BARCODE"] },
  ] as unknown as DataRecord[];

  component.handleMessage(buildDataPresentMessage(100, records));

  assertEquals(dataSpy.calls.length, 1, "data event should have fired once");
  assertEquals(dataSpy.calls[0].args[0], records);
});

Deno.test("DATA_PRESENT - full pipeline via _handleWebSocketMessage", () => {
  const { cuss2 } = createMockCuss2();

  const componentData = mockDevice.createBarcodeReader(5);
  const component = new BarcodeReader(componentData, cuss2);
  setupComponent(cuss2, component);
  setComponentReady(component);

  const dataSpy = spy();
  component.on("data", dataSpy);

  const messageSpy = spy();
  cuss2.on("message", messageSpy);

  const records: DataRecord[] = [
    { data: "BOARDING_PASS_123", dsTypes: ["DS_TYPES_BARCODE"] },
  ] as unknown as DataRecord[];

  const msg = buildDataPresentMessage(5, records, AppState.ACTIVE);

  // @ts-ignore: accessing private method for testing
  cuss2._handleWebSocketMessage(msg);

  assertEquals(messageSpy.calls.length >= 1, true, "cuss2 'message' event should have fired");
  assertEquals(dataSpy.calls.length, 1, "component 'data' event should have fired once");
  assertEquals(dataSpy.calls[0].args[0], records, "data event should contain the dataRecords");
});

Deno.test("DATA_PRESENT - second scan also triggers data event", () => {
  const { cuss2 } = createMockCuss2();

  const componentData = mockDevice.createBarcodeReader(5);
  const component = new BarcodeReader(componentData, cuss2);
  setupComponent(cuss2, component);
  setComponentReady(component);

  const dataSpy = spy();
  component.on("data", dataSpy);

  const records1: DataRecord[] = [
    { data: "SCAN_1", dsTypes: ["DS_TYPES_BARCODE"] },
  ] as unknown as DataRecord[];

  const records2: DataRecord[] = [
    { data: "SCAN_2", dsTypes: ["DS_TYPES_BARCODE"] },
  ] as unknown as DataRecord[];

  // @ts-ignore: accessing private method for testing
  cuss2._handleWebSocketMessage(buildDataPresentMessage(5, records1, AppState.ACTIVE));
  // @ts-ignore: accessing private method for testing
  cuss2._handleWebSocketMessage(buildDataPresentMessage(5, records2, AppState.ACTIVE));

  assertEquals(dataSpy.calls.length, 2, "data event should have fired twice (once per scan)");
  assertEquals(dataSpy.calls[0].args[0], records1);
  assertEquals(dataSpy.calls[1].args[0], records2);
});

Deno.test("DATA_PRESENT - does NOT emit data event without dataRecords", () => {
  const { cuss2 } = createMockCuss2();

  const componentData = mockDevice.createBarcodeReader(5);
  const component = new BarcodeReader(componentData, cuss2);
  setupComponent(cuss2, component);
  setComponentReady(component);

  const dataSpy = spy();
  component.on("data", dataSpy);

  const msg: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.ACTIVE },
      componentID: 5,
      messageCode: MessageCodes.DATA_PRESENT,
      componentState: ComponentState.READY,
    },
    payload: {},
  } as unknown as PlatformData;

  // @ts-ignore: accessing private method for testing
  cuss2._handleWebSocketMessage(msg);

  assertEquals(dataSpy.calls.length, 0, "data event should NOT fire without dataRecords");
});

Deno.test("DATA_PRESENT - Keypad emits 'data' event with parsed key data", () => {
  const { cuss2 } = createMockCuss2();

  const componentData = mockDevice.createKeypad(0);
  const component = new Keypad(componentData, cuss2);
  setupComponent(cuss2, component);
  setComponentReady(component);

  const dataSpy = spy();
  component.on("data", dataSpy);

  const records: DataRecord[] = [
    { data: "NAVNEXT", dsTypes: ["DS_TYPES_KEY"], dataStatus: "DS_OK" },
  ] as unknown as DataRecord[];

  // @ts-ignore: accessing private method for testing
  cuss2._handleWebSocketMessage(buildDataPresentMessage(0, records, AppState.ACTIVE));

  assertEquals(dataSpy.calls.length, 1, "Keypad 'data' event should have fired");
  assertEquals(dataSpy.calls[0].args[0].NEXT, true);
  assertEquals(dataSpy.calls[0].args[0].UP, false);
});
