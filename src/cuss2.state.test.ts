import { assertEquals, assertRejects } from "@std/assert";
import { Cuss2 } from "./cuss2.ts";
import { StateChange } from "./models/stateChange.ts";
import { ApplicationStateCodes as AppState, type PlatformData } from "cuss2-typescript-models";
import {
  createMockCuss2,
  createMockCuss2WithStateTracking,
  MockConnection,
  setCurrentState,
  simulateStateChange,
  testInvalidStateTransition,
} from "./test-helpers.ts";

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
  // @ts-ignore - accessing private method for testing
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
  // @ts-ignore - accessing private method for testing
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

Deno.test("2.6 - State transitions should proceed even when individual component disable fails", async () => {
  const { cuss2, mockConnection } = createMockCuss2WithStateTracking();

  // Track if state request was made despite disable failure
  let stateRequestMade = false;
  mockConnection.sendAndGetResponse = () => {
    stateRequestMade = true;
    return Promise.resolve({ meta: { messageCode: "OK" }, payload: {} } as PlatformData);
  };

  // Create a mock component that will fail to disable
  const mockComponent = {
    enabled: true,
    id: 123,
    disable: () => Promise.reject(new Error("Component disable failed")),
  };

  // Add the mock component to the components list
  // @ts-ignore - accessing private property for testing
  cuss2.components = { "123": mockComponent };

  // Test ACTIVE → AVAILABLE with component disable failure
  setCurrentState(cuss2, AppState.ACTIVE);
  const result1 = await cuss2.requestAvailableState();

  // Verify state request was still made despite the component disable failure
  assertEquals(stateRequestMade, true);
  assertEquals(result1?.meta?.messageCode, "OK");

  // Reset tracker
  stateRequestMade = false;

  // Test ACTIVE → UNAVAILABLE with component disable failure
  setCurrentState(cuss2, AppState.ACTIVE);
  const result2 = await cuss2.requestUnavailableState();

  // Verify state request was still made despite the component disable failure
  assertEquals(stateRequestMade, true);
  assertEquals(result2?.meta?.messageCode, "OK");
});

// Test Category 2.7: Accessible Mode Acknowledgment Tests

Deno.test("2.7.1 - acknowledgeAccessibleMode should send correct directive and payload when in accessible mode and ACTIVE state", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  // Track the platform directive and payload sent
  let sentDirective: string | undefined;
  let sentPayload: unknown;
  mockConnection.sendAndGetResponse = (data: unknown) => {
    // @ts-ignore - accessing meta and payload for testing
    sentDirective = data?.meta?.directive;
    // @ts-ignore - accessing payload for testing
    sentPayload = data?.payload;
    return Promise.resolve({ meta: { messageCode: "OK" }, payload: {} } as PlatformData);
  };

  // Set state to ACTIVE with accessible mode
  setCurrentState(cuss2, AppState.ACTIVE);
  // @ts-ignore - accessing private property for testing
  cuss2.accessibleMode = true;

  // Call acknowledgeAccessibleMode
  const result = await cuss2.acknowledgeAccessibleMode();

  // Verify correct directive was sent
  assertEquals(sentDirective, "platform_applications_acknowledge_accessible");
  assertEquals(result?.meta?.messageCode, "OK");

  // Verify correct payload was sent with ApplicationState
  // @ts-ignore - accessing applicationState for testing
  assertEquals(sentPayload?.applicationState?.applicationStateCode, AppState.ACTIVE);
  // @ts-ignore - accessing applicationState for testing
  assertEquals(sentPayload?.applicationState?.accessibleMode, true);
  // @ts-ignore - accessing applicationState for testing
  assertEquals(sentPayload?.applicationState?.applicationStateChangeReasonCode, "NOT_APPLICABLE");
});

Deno.test("2.7.2 - acknowledgeAccessibleMode should throw error when accessibleMode is false", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  // Track if sendAndGetResponse was called
  let sendCalled = false;
  mockConnection.sendAndGetResponse = () => {
    sendCalled = true;
    return Promise.resolve({ meta: { messageCode: "OK" }, payload: {} } as PlatformData);
  };

  // Set state to ACTIVE but without accessible mode
  setCurrentState(cuss2, AppState.ACTIVE);
  // @ts-ignore - accessing private property for testing
  cuss2.accessibleMode = false;

  // Call acknowledgeAccessibleMode and expect it to throw
  await assertRejects(
    () => cuss2.acknowledgeAccessibleMode(),
    Error,
    "acknowledgeAccessibleMode called but accessibleMode is false",
  );

  // Verify no message was sent
  assertEquals(sendCalled, false);
});

Deno.test("2.7.3 - acknowledgeAccessibleMode should throw error when not in ACTIVE state", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  // Track if sendAndGetResponse was called
  let sendCalled = false;
  mockConnection.sendAndGetResponse = () => {
    sendCalled = true;
    return Promise.resolve({ meta: { messageCode: "OK" }, payload: {} } as PlatformData);
  };

  // Set state to AVAILABLE (not ACTIVE) with accessible mode
  setCurrentState(cuss2, AppState.AVAILABLE);
  // @ts-ignore - accessing private property for testing
  cuss2.accessibleMode = true;

  // Call acknowledgeAccessibleMode and expect it to throw
  await assertRejects(
    () => cuss2.acknowledgeAccessibleMode(),
    Error,
    "acknowledgeAccessibleMode called in wrong state: AVAILABLE",
  );

  // Verify no message was sent
  assertEquals(sendCalled, false);
});

Deno.test("2.7.4 - api.acknowledgeAccessible should send directive and payload regardless of state", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  // Track the platform directive and payload sent
  let sentDirective: string | undefined;
  let sentPayload: unknown;
  mockConnection.sendAndGetResponse = (data: unknown) => {
    // @ts-ignore - accessing meta and payload for testing
    sentDirective = data?.meta?.directive;
    // @ts-ignore - accessing payload for testing
    sentPayload = data?.payload;
    return Promise.resolve({ meta: { messageCode: "OK" }, payload: {} } as PlatformData);
  };

  // Test raw API call without state validation
  setCurrentState(cuss2, AppState.AVAILABLE); // Not ACTIVE
  // @ts-ignore - accessing private property for testing
  cuss2.accessibleMode = false; // Not in accessible mode

  // Call raw API directly
  const result = await cuss2.api.acknowledgeAccessible();

  // Verify directive was sent (no validation in raw API)
  assertEquals(sentDirective, "platform_applications_acknowledge_accessible");
  assertEquals(result?.meta?.messageCode, "OK");

  // Verify payload contains ApplicationState with current state values
  // @ts-ignore - accessing applicationState for testing
  assertEquals(sentPayload?.applicationState?.applicationStateCode, AppState.AVAILABLE);
  // @ts-ignore - accessing applicationState for testing
  assertEquals(sentPayload?.applicationState?.accessibleMode, false);
  // @ts-ignore - accessing applicationState for testing
  assertEquals(sentPayload?.applicationState?.applicationStateChangeReasonCode, "NOT_APPLICABLE");
});

Deno.test("2.7.5 - acknowledgeAccessibleMode should work in typical activation flow", async () => {
  const { cuss2 } = createMockCuss2();

  // Create a promise to wait for acknowledgment
  const acknowledgmentPromise = new Promise<PlatformData | undefined>((resolve) => {
    cuss2.on("activated", async (_activationData: unknown) => {
      if (cuss2.accessibleMode) {
        // Acknowledge accessible mode
        const result = await cuss2.acknowledgeAccessibleMode();
        resolve(result);
      }
    });
  });

  // Set state to AVAILABLE (required for ACTIVE transition)
  setCurrentState(cuss2, AppState.AVAILABLE);

  const activationPayload = {
    applicationActivation: {
      executionMode: "SAM",
      accessibleMode: true,
      languageID: "en-US",
    },
  };

  // Simulate transition to ACTIVE with accessible mode
  await simulateStateChange(cuss2, AppState.ACTIVE, activationPayload);

  // Verify properties were set
  assertEquals(cuss2.accessibleMode, true);
  assertEquals(cuss2.state, AppState.ACTIVE);

  // Wait for acknowledgment and verify it was sent
  const acknowledgeResult = await acknowledgmentPromise;
  assertEquals(acknowledgeResult?.meta?.messageCode, "OK");
});
