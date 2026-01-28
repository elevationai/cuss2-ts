import { assertEquals } from "@std/assert";
import { spy } from "@std/testing/mock";
import {
  ApplicationStateCodes as AppState,
  ComponentState,
  MessageCodes,
  type PlatformData,
  PlatformDirectives,
} from "cuss2-typescript-models";
import { createMockCuss2, mockDevice, setCurrentState, simulateStateChange } from "./test-helpers.ts";
import { BarcodeReader } from "./models/BarcodeReader.ts";
import { COMPONENT_UPDATE, type CurrentComponentState } from "./types/modelExtensions.ts";

// Helper: build a PlatformData with currentComponentState
// Defaults to ACTIVE app state since ccs is used during active operation
function buildCCSMessage(
  componentID: number,
  ccs: CurrentComponentState,
  overrides: Record<string, unknown> = {},
): PlatformData {
  return {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.ACTIVE },
      componentID,
      messageCode: MessageCodes.OK,
      ...overrides,
      currentComponentState: ccs,
    },
    payload: {},
  } as unknown as PlatformData;
}

// Helper: build a legacy PlatformData (no currentComponentState)
function buildLegacyMessage(
  componentID: number,
  overrides: Record<string, unknown> = {},
): PlatformData {
  return {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID,
      messageCode: MessageCodes.OK,
      ...overrides,
    },
    payload: {},
  } as unknown as PlatformData;
}

// Helper: set a component to READY/OK via a legacy query response
function setComponentReady(component: BarcodeReader) {
  component.updateState(buildLegacyMessage(component.id, {
    componentState: ComponentState.READY,
    messageCode: MessageCodes.OK,
    platformDirective: PlatformDirectives.PERIPHERALS_QUERY,
  }));
}

// ─── stateIsDifferent ────────────────────────────────────────────────

Deno.test("currentComponentState - stateIsDifferent detects status change via ccs", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  const msg = buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.HARDWARE_ERROR,
    enabled: false,
  });

  assertEquals(component.stateIsDifferent(msg), true);
});

Deno.test("currentComponentState - stateIsDifferent detects componentState change via ccs", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  const msg = buildCCSMessage(100, {
    componentState: ComponentState.UNAVAILABLE,
    status: MessageCodes.OK,
    enabled: false,
  });

  assertEquals(component.stateIsDifferent(msg), true);
});

Deno.test("currentComponentState - stateIsDifferent detects enabled change via ccs", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);
  component.enabled = false;

  const msg = buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.OK,
    enabled: true,
  });

  assertEquals(component.stateIsDifferent(msg), true);
});

Deno.test("currentComponentState - stateIsDifferent returns false when nothing changed", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);
  component.enabled = true;

  const msg = buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.OK,
    enabled: true,
  });

  assertEquals(component.stateIsDifferent(msg), false);
});

// ─── updateState: status always applied (even for command responses) ─

Deno.test("currentComponentState - updateState applies status from ccs on ENABLE response", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.MEDIA_PRESENT,
    enabled: true,
  }, {
    platformDirective: PlatformDirectives.PERIPHERALS_USERPRESENT_ENABLE,
  }));

  assertEquals(statusChangeSpy.calls.length, 1);
  assertEquals(component.status, MessageCodes.MEDIA_PRESENT);
});

Deno.test("currentComponentState - updateState applies status from ccs on DISABLE response", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.MEDIA_ABSENT,
    enabled: false,
  }, {
    platformDirective: PlatformDirectives.PERIPHERALS_USERPRESENT_DISABLE,
  }));

  assertEquals(statusChangeSpy.calls.length, 1);
  assertEquals(component.status, MessageCodes.MEDIA_ABSENT);
});

Deno.test("currentComponentState - updateState applies status from ccs on SETUP response", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.HARDWARE_ERROR,
    enabled: true,
  }, {
    platformDirective: PlatformDirectives.PERIPHERALS_SETUP,
  }));

  assertEquals(statusChangeSpy.calls.length, 1);
  assertEquals(component.status, MessageCodes.HARDWARE_ERROR);
});

Deno.test("currentComponentState - updateState applies status from ccs on SEND response", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.TIMEOUT,
    enabled: true,
  }, {
    platformDirective: PlatformDirectives.PERIPHERALS_SEND,
  }));

  assertEquals(statusChangeSpy.calls.length, 1);
  assertEquals(component.status, MessageCodes.TIMEOUT);
});

// ─── updateState: componentState from ccs ────────────────────────────

Deno.test("currentComponentState - updateState sets componentState from ccs", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  // starts UNAVAILABLE by default

  const readyChangeSpy = spy();
  component.on("readyStateChange", readyChangeSpy);

  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.OK,
    enabled: false,
  }));

  assertEquals(component.componentState, ComponentState.READY);
  assertEquals(readyChangeSpy.calls.length, 1);
  assertEquals(readyChangeSpy.calls[0].args[0], true);
});

// ─── updateState: enabled from ccs ───────────────────────────────────

Deno.test("currentComponentState - updateState sets enabled true from ccs", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);
  component.enabled = false;

  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.OK,
    enabled: true,
  }));

  assertEquals(component.enabled, true);
});

Deno.test("currentComponentState - updateState sets enabled false from ccs", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);
  component.enabled = true;

  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.OK,
    enabled: false,
  }));

  assertEquals(component.enabled, false);
});

// ─── UNAVAILABLE forces enabled=false ────────────────────────────────

Deno.test("currentComponentState - UNAVAILABLE componentState forces enabled false", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);
  component.enabled = true;

  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.UNAVAILABLE,
    status: MessageCodes.HARDWARE_ERROR,
    enabled: true, // Even if ccs says enabled, UNAVAILABLE overrides
  }));

  assertEquals(component.enabled, false);
  assertEquals(component.componentState, ComponentState.UNAVAILABLE);
});

// ─── COMPONENT_UPDATE unsolicited message ────────────────────────────

Deno.test("currentComponentState - COMPONENT_UPDATE unsolicited message updates all state", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  // starts UNAVAILABLE, status OK, enabled false

  const statusChangeSpy = spy();
  const readyChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);
  component.on("readyStateChange", readyChangeSpy);

  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.MEDIA_PRESENT,
    enabled: true,
  }, {
    messageCode: COMPONENT_UPDATE,
  }));

  assertEquals(component.componentState, ComponentState.READY);
  assertEquals(component.status, MessageCodes.MEDIA_PRESENT);
  assertEquals(component.enabled, true);
  assertEquals(readyChangeSpy.calls.length, 1);
  assertEquals(statusChangeSpy.calls.length, 1);
});

// ─── Legacy path: existing behavior preserved ────────────────────────

Deno.test("currentComponentState - legacy path: status NOT updated on ENABLE response", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  // No currentComponentState — legacy message
  component.updateState(buildLegacyMessage(100, {
    componentState: ComponentState.BUSY,
    messageCode: MessageCodes.DATA_PRESENT,
    platformDirective: PlatformDirectives.PERIPHERALS_USERPRESENT_ENABLE,
  }));

  assertEquals(statusChangeSpy.calls.length, 0);
  assertEquals(component.status, MessageCodes.OK);
});

Deno.test("currentComponentState - legacy path: status updated on unsolicited message", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  component.updateState(buildLegacyMessage(100, {
    messageCode: MessageCodes.HARDWARE_ERROR,
  }));

  assertEquals(statusChangeSpy.calls.length, 1);
  assertEquals(component.status, MessageCodes.HARDWARE_ERROR);
});

Deno.test("currentComponentState - legacy path: status updated on QUERY response", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  const statusChangeSpy = spy();
  component.on("statusChange", statusChangeSpy);

  component.updateState(buildLegacyMessage(100, {
    messageCode: MessageCodes.HARDWARE_ERROR,
    platformDirective: PlatformDirectives.PERIPHERALS_QUERY,
  }));

  assertEquals(statusChangeSpy.calls.length, 1);
  assertEquals(component.status, MessageCodes.HARDWARE_ERROR);
});

// ─── stateIsDifferent: legacy fallback ───────────────────────────────

Deno.test("currentComponentState - stateIsDifferent uses legacy path when no ccs", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  // Different messageCode → true
  const msg1 = buildLegacyMessage(100, {
    componentState: ComponentState.READY,
    messageCode: MessageCodes.HARDWARE_ERROR,
  });
  assertEquals(component.stateIsDifferent(msg1), true);

  // Same state → false
  const msg2 = buildLegacyMessage(100, {
    componentState: ComponentState.READY,
    messageCode: MessageCodes.OK,
  });
  assertEquals(component.stateIsDifferent(msg2), false);
});

// ─── Deactivation: enabled forced false + componentStateChange ───────

Deno.test("currentComponentState - deactivated event sets enabled false and emits componentStateChange", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  // Set state to ACTIVE and enable the component
  setCurrentState(cuss2, AppState.ACTIVE);
  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.OK,
    enabled: true,
  }));
  assertEquals(component.enabled, true);

  // Track componentStateChange events on cuss2
  const stateChangeSpy = spy();
  cuss2.on("componentStateChange", stateChangeSpy);

  // Simulate leaving ACTIVE → AVAILABLE
  simulateStateChange(cuss2, AppState.AVAILABLE);

  assertEquals(component.enabled, false);
  assertEquals(stateChangeSpy.calls.length, 1);
  assertEquals(stateChangeSpy.calls[0].args[0], component);
});

Deno.test("currentComponentState - deactivated does not emit componentStateChange if already disabled", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);
  setCurrentState(cuss2, AppState.ACTIVE);

  // Component is already disabled
  component.enabled = false;

  const stateChangeSpy = spy();
  cuss2.on("componentStateChange", stateChangeSpy);

  simulateStateChange(cuss2, AppState.AVAILABLE);

  assertEquals(component.enabled, false);
  assertEquals(stateChangeSpy.calls.length, 0);
});

// ─── Non-ACTIVE app state forces enabled=false ──────────────────────

Deno.test("currentComponentState - updateState forces enabled false when app is not ACTIVE", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);

  // Enable the component during ACTIVE state
  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.OK,
    enabled: true,
  }));
  assertEquals(component.enabled, true);

  // Receive a message with ccs.enabled: true but app state is AVAILABLE
  component.updateState({
    meta: {
      currentApplicationState: { applicationStateCode: AppState.AVAILABLE },
      componentID: 100,
      messageCode: MessageCodes.OK,
      currentComponentState: {
        componentState: ComponentState.READY,
        status: MessageCodes.OK,
        enabled: true,
      },
    },
    payload: {},
  } as unknown as PlatformData);

  // Should be forced to false because app is not ACTIVE
  assertEquals(component.enabled, false);
});

Deno.test("currentComponentState - updateState allows enabled true when app is ACTIVE", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);
  component.enabled = false;

  // Message with ACTIVE app state and ccs.enabled: true → allowed
  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.OK,
    enabled: true,
  }));

  assertEquals(component.enabled, true);
});

Deno.test("currentComponentState - stale COMPONENT_UPDATE after deactivation does not re-enable", () => {
  const { cuss2 } = createMockCuss2();
  const component = new BarcodeReader(mockDevice.createBarcodeReader(100), cuss2);
  setComponentReady(component);
  setCurrentState(cuss2, AppState.ACTIVE);

  // Enable during ACTIVE
  component.updateState(buildCCSMessage(100, {
    componentState: ComponentState.READY,
    status: MessageCodes.OK,
    enabled: true,
  }));
  assertEquals(component.enabled, true);

  // Deactivate
  simulateStateChange(cuss2, AppState.AVAILABLE);
  assertEquals(component.enabled, false);

  // A stale COMPONENT_UPDATE arrives with enabled: true but AVAILABLE app state
  component.updateState({
    meta: {
      currentApplicationState: { applicationStateCode: AppState.AVAILABLE },
      componentID: 100,
      messageCode: COMPONENT_UPDATE,
      currentComponentState: {
        componentState: ComponentState.READY,
        status: MessageCodes.OK,
        enabled: true,
      },
    },
    payload: {},
  } as unknown as PlatformData);

  // Should still be false — app is not ACTIVE
  assertEquals(component.enabled, false);
});
