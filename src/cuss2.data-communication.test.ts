import { assertEquals, assertRejects } from "@std/assert";
import { spy, stub } from "@std/testing/mock";
import { ApplicationStateCodes as AppState, MessageCodes, type PlatformData, PlatformDirectives } from "cuss2-typescript-models";
import { createMockCuss2, setCurrentState, simulateStateChange } from "./test-helpers.ts";

// Section 4: WebSocket Message Handling Tests

Deno.test("Section 4.1: Platform data message processing - should process platform messages correctly", async () => {
  const { cuss2 } = createMockCuss2();

  // Set initial state
  setCurrentState(cuss2, AppState.UNAVAILABLE);

  // Create spies for event emissions
  const stateChangeSpy = spy();
  const messageSpy = spy();

  cuss2.on("stateChange", stateChangeSpy);
  cuss2.on("message", messageSpy);

  // Simulate platform message with state change
  const platformData: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.AVAILABLE },
      platformDirective: PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST,
      messageCode: MessageCodes.OK,
    },
    payload: {},
  } as unknown as PlatformData;

  // @ts-ignore - accessing private method for testing
  await cuss2._handleWebSocketMessage(platformData);

  // Verify state was updated
  assertEquals(cuss2.state, AppState.AVAILABLE);

  // Verify events were emitted
  assertEquals(stateChangeSpy.calls.length, 1);
  const emittedStateChange = stateChangeSpy.calls[0].args[0];
  assertEquals(emittedStateChange.previous, AppState.UNAVAILABLE);
  assertEquals(emittedStateChange.current, AppState.AVAILABLE);

  assertEquals(messageSpy.calls.length, 1);
  assertEquals(messageSpy.calls[0].args[0], platformData);
});

Deno.test("Section 4.2: Session timeout handling - should emit sessionTimeout event on timeout message", async () => {
  const { cuss2 } = createMockCuss2();

  const sessionTimeoutSpy = spy();
  cuss2.on("sessionTimeout", sessionTimeoutSpy);

  // Send SESSION_TIMEOUT message
  const platformData: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      messageCode: MessageCodes.SESSION_TIMEOUT,
    },
    payload: {},
  } as unknown as PlatformData;

  // @ts-ignore - accessing private method for testing
  await cuss2._handleWebSocketMessage(platformData);

  // Verify sessionTimeout event was emitted with environment data
  assertEquals(sessionTimeoutSpy.calls.length, 1);
  // The event should emit the environment object, which contains killTimeout and sessionTimeout
  const emittedEnv = sessionTimeoutSpy.calls[0].args[0];
  assertEquals(typeof emittedEnv.killTimeout, "number");
  assertEquals(typeof emittedEnv.sessionTimeout, "number");
});

Deno.test("Section 4.3: Invalid state handling - should close connection on invalid platform state", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  // Create spy for socket close
  const closeSpy = spy(mockConnection._socket, "close");

  // Send message without currentApplicationState
  const platformData = {
    meta: {
      currentApplicationState: { applicationStateCode: null },
      messageCode: MessageCodes.OK,
    },
    payload: {},
  } as unknown as PlatformData;

  // Should throw error
  await assertRejects(
    // @ts-ignore - accessing private method for testing
    () => cuss2._handleWebSocketMessage(platformData),
    Error,
    "Platform in invalid state. Cannot continue.",
  );

  // Verify socket was closed
  assertEquals(closeSpy.calls.length, 1);
});

Deno.test("Section 4.4: Component state updates - should update component states from platform messages", async () => {
  const { cuss2 } = createMockCuss2();

  // Create a mock component that doesn't require dependencies
  const mockComponent = {
    componentID: 1,
    state: { statusCode: "NOTREADY" },
    stateIsDifferent: () => true,
    updateState: () => {},
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = { "1": mockComponent };

  // Create spy for component state change event
  const componentStateChangeSpy = spy();
  cuss2.on("componentStateChange", componentStateChangeSpy);

  // Mock component stateIsDifferent to return true
  const stateIsDifferentStub = stub(mockComponent, "stateIsDifferent", () => true);

  // Mock component updateState
  const updateStateSpy = spy(mockComponent, "updateState");

  // Send component state update message
  const platformData: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 1,
      messageCode: MessageCodes.OK,
    },
    payload: {
      componentStatus: {
        statusCode: "READY",
      },
    },
  } as unknown as PlatformData;

  // @ts-ignore - accessing private method for testing
  await cuss2._handleWebSocketMessage(platformData);

  // Verify component methods were called
  assertEquals(stateIsDifferentStub.calls.length, 1);
  assertEquals(updateStateSpy.calls.length, 1);
  // @ts-ignore - spy type issue
  assertEquals(updateStateSpy.calls[0]?.args?.[0], platformData);

  // Verify componentStateChange event was emitted
  assertEquals(componentStateChangeSpy.calls.length, 1);
  assertEquals(componentStateChangeSpy.calls[0].args[0], mockComponent);

  // Restore spies
  stateIsDifferentStub.restore();
  updateStateSpy.restore();
});

Deno.test("Section 4.5: Unsolicited messages - should handle unsolicited component updates", async () => {
  const { cuss2 } = createMockCuss2();

  // Set online status
  cuss2.applicationOnline = true;

  // Create a mock component
  const mockComponent = {
    componentID: 1,
    state: { statusCode: "NOTREADY" },
    stateIsDifferent: () => true,
    updateState: () => {},
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = { "1": mockComponent };

  // Mock component stateIsDifferent to return true
  const stateIsDifferentStub = stub(mockComponent, "stateIsDifferent", () => true);

  // Mock checkRequiredComponentsAndSyncState
  const checkSyncSpy = spy(cuss2, "checkRequiredComponentsAndSyncState");

  // Send unsolicited message (no platformDirective)
  const platformData: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 1,
      messageCode: MessageCodes.OK,
      // No platformDirective - making it unsolicited
    },
    payload: {
      componentStatus: {
        statusCode: "READY",
      },
    },
  } as unknown as PlatformData;

  // @ts-ignore - accessing private method for testing
  await cuss2._handleWebSocketMessage(platformData);

  // Verify checkRequiredComponentsAndSyncState was called for unsolicited message
  assertEquals(checkSyncSpy.calls.length, 1);

  // Restore spies
  stateIsDifferentStub.restore();
  checkSyncSpy.restore();
});

// Additional tests for specific state transitions and edge cases

Deno.test("Section 4.1: Platform data message - activated event on ACTIVE state", async () => {
  const { cuss2 } = createMockCuss2();
  setCurrentState(cuss2, AppState.AVAILABLE);

  const activatedSpy = spy();
  cuss2.on("activated", activatedSpy);

  // Send activation message with multi-tenant and accessibility info
  const platformData: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.ACTIVE },
      platformDirective: PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST,
      messageCode: MessageCodes.OK,
    },
    payload: {
      applicationActivation: {
        executionMode: "MAM",
        accessibleMode: true,
        languageID: "fr-FR",
      },
    },
  } as unknown as PlatformData;

  // @ts-ignore - accessing private method for testing
  await cuss2._handleWebSocketMessage(platformData);

  // Verify state and activation properties
  assertEquals(cuss2.state, AppState.ACTIVE);
  assertEquals(cuss2.multiTenant, true);
  assertEquals(cuss2.accessibleMode, true);
  assertEquals(cuss2.language, "fr-FR");

  // Verify activated event
  assertEquals(activatedSpy.calls.length, 1);
  assertEquals(activatedSpy.calls[0].args[0], platformData.payload?.applicationActivation);
});

Deno.test("Section 4.1: Platform data message - deactivated event when leaving ACTIVE state", async () => {
  const { cuss2 } = createMockCuss2();
  setCurrentState(cuss2, AppState.ACTIVE);

  const deactivatedSpy = spy();
  cuss2.on("deactivated", deactivatedSpy);

  await simulateStateChange(cuss2, AppState.AVAILABLE);

  // Verify deactivated event
  assertEquals(deactivatedSpy.calls.length, 1);
  assertEquals(deactivatedSpy.calls[0].args[0], AppState.AVAILABLE);
});

Deno.test("Section 4.1: Platform data message - query components on UNAVAILABLE state", async () => {
  const { cuss2 } = createMockCuss2();
  setCurrentState(cuss2, AppState.AVAILABLE);

  // Set online status to true
  cuss2.applicationOnline = true;

  // Mock queryComponents
  const queryComponentsStub = stub(cuss2, "queryComponents", () => Promise.resolve(true));

  // Mock checkRequiredComponentsAndSyncState
  const checkSyncSpy = spy(cuss2, "checkRequiredComponentsAndSyncState");

  await simulateStateChange(cuss2, AppState.UNAVAILABLE);

  // Verify queryComponents was called
  assertEquals(queryComponentsStub.calls.length, 1);

  // Verify checkRequiredComponentsAndSyncState was called (may be called multiple times)
  assertEquals(checkSyncSpy.calls.length >= 1, true);

  queryComponentsStub.restore();
  checkSyncSpy.restore();
});

Deno.test("Section 4.1: Platform data message - emit queryError on component query failure", async () => {
  const { cuss2 } = createMockCuss2();
  setCurrentState(cuss2, AppState.AVAILABLE);

  const queryErrorSpy = spy();
  cuss2.on("queryError", queryErrorSpy);

  // Mock queryComponents to throw error
  const testError = new Error("Query failed");
  const queryComponentsStub = stub(cuss2, "queryComponents", () => Promise.reject(testError));

  await simulateStateChange(cuss2, AppState.UNAVAILABLE);

  // Verify queryError event was emitted
  assertEquals(queryErrorSpy.calls.length, 1);
  assertEquals(queryErrorSpy.calls[0].args[0], testError);

  queryComponentsStub.restore();
});

Deno.test("Section 4.4: Component state updates - should check sync state for QUERY directive", async () => {
  const { cuss2 } = createMockCuss2();
  cuss2.applicationOnline = true;

  // Create a mock component
  const mockComponent = {
    componentID: 1,
    state: { statusCode: "NOTREADY" },
    stateIsDifferent: () => true,
    updateState: () => {},
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = { "1": mockComponent };

  // Mock component stateIsDifferent to return true
  const stateIsDifferentStub = stub(mockComponent, "stateIsDifferent", () => true);

  // Mock component updateState
  const _updateStateSpy = spy(mockComponent, "updateState");

  // Mock checkRequiredComponentsAndSyncState
  const checkSyncSpy = spy(cuss2, "checkRequiredComponentsAndSyncState");

  // Send message with QUERY directive
  const platformData: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 1,
      platformDirective: PlatformDirectives.PERIPHERALS_QUERY,
      messageCode: MessageCodes.OK,
    },
    payload: {
      componentStatus: {
        statusCode: "READY",
      },
    },
  } as unknown as PlatformData;

  // @ts-ignore - accessing private method for testing
  await cuss2._handleWebSocketMessage(platformData);

  // Verify checkRequiredComponentsAndSyncState was called
  assertEquals(checkSyncSpy.calls.length, 1);

  stateIsDifferentStub.restore();
  checkSyncSpy.restore();
});

Deno.test("Section 4: Edge case - handle null platform data gracefully", async () => {
  const { cuss2 } = createMockCuss2();

  const messageSpy = spy();
  cuss2.on("message", messageSpy);

  // Send null platform data
  // @ts-ignore - testing null input
  await cuss2._handleWebSocketMessage(null);

  // Should return early without emitting any events
  assertEquals(messageSpy.calls.length, 0);
});

Deno.test("Section 4: Edge case - handle missing component gracefully", async () => {
  const { cuss2 } = createMockCuss2();

  // @ts-ignore - accessing private property for testing
  cuss2.components = {};

  const componentStateChangeSpy = spy();
  cuss2.on("componentStateChange", componentStateChangeSpy);

  // Send component update for non-existent component
  const platformData: PlatformData = {
    meta: {
      currentApplicationState: { applicationStateCode: AppState.UNAVAILABLE },
      componentID: 999, // Non-existent component
      messageCode: MessageCodes.OK,
    },
    payload: {},
  } as unknown as PlatformData;

  // @ts-ignore - accessing private method for testing
  await cuss2._handleWebSocketMessage(platformData);

  // Should not emit componentStateChange for missing component
  assertEquals(componentStateChangeSpy.calls.length, 0);
});
