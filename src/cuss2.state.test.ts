import { assertEquals } from "jsr:@std/assert";
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
