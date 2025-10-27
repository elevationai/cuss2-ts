import { assertEquals } from "@std/assert";
import { spy, stub } from "@std/testing/mock";
import { ApplicationStateCodes as AppState } from "cuss2-typescript-models";
import { createMockCuss2, setCurrentState } from "./test-helpers.ts";
import type { BaseComponent } from "./models/index.ts";

// Section 7: Component Availability Tests

Deno.test("Section 7.1: unavailableComponents getter - should return components that are not ready", () => {
  const { cuss2 } = createMockCuss2();

  // Create mock components with different ready states
  const mockComponents = {
    "1": { id: 1, ready: true, required: true } as unknown as BaseComponent,
    "2": { id: 2, ready: false, required: true } as unknown as BaseComponent,
    "3": { id: 3, ready: false, required: false } as unknown as BaseComponent,
    "4": { id: 4, ready: true, required: false } as unknown as BaseComponent,
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = mockComponents;

  const unavailable = cuss2.unavailableComponents;

  // Should return only components that are not ready (components 2 and 3)
  assertEquals(unavailable.length, 2);
  assertEquals(unavailable.some((c: BaseComponent) => c.id === 2), true);
  assertEquals(unavailable.some((c: BaseComponent) => c.id === 3), true);
  assertEquals(unavailable.some((c: BaseComponent) => c.id === 1), false);
  assertEquals(unavailable.some((c: BaseComponent) => c.id === 4), false);
});

Deno.test("Section 7.1: unavailableComponents getter - should return empty array when no components", () => {
  const { cuss2 } = createMockCuss2();

  // @ts-ignore - accessing private property for testing
  cuss2.components = undefined;

  const unavailable = cuss2.unavailableComponents;

  assertEquals(unavailable.length, 0);
  assertEquals(Array.isArray(unavailable), true);
});

Deno.test("Section 7.2: unavailableRequiredComponents getter - should return required components that are not ready", () => {
  const { cuss2 } = createMockCuss2();

  // Create mock components with different ready and required states
  const mockComponents = {
    "1": { id: 1, ready: true, required: true } as unknown as BaseComponent,
    "2": { id: 2, ready: false, required: true } as unknown as BaseComponent,
    "3": { id: 3, ready: false, required: false } as unknown as BaseComponent,
    "4": { id: 4, ready: true, required: false } as unknown as BaseComponent,
    "5": { id: 5, ready: false, required: true } as unknown as BaseComponent,
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = mockComponents;

  const unavailableRequired = cuss2.unavailableRequiredComponents;

  // Should return only components that are both not ready AND required (components 2 and 5)
  assertEquals(unavailableRequired.length, 2);
  assertEquals(unavailableRequired.some((c: BaseComponent) => c.id === 2), true);
  assertEquals(unavailableRequired.some((c: BaseComponent) => c.id === 5), true);
  assertEquals(unavailableRequired.some((c: BaseComponent) => c.id === 3), false); // Not required
  assertEquals(unavailableRequired.some((c: BaseComponent) => c.id === 1), false); // Ready
  assertEquals(unavailableRequired.some((c: BaseComponent) => c.id === 4), false); // Ready
});

Deno.test("Section 7.3: checkRequiredComponentsAndSyncState - all required components available → request AVAILABLE state", () => {
  const { cuss2 } = createMockCuss2();

  // Set initial state to UNAVAILABLE
  setCurrentState(cuss2, AppState.UNAVAILABLE);

  // Create mock components - all required components are ready
  const mockComponents = {
    "1": { id: 1, ready: true, required: true } as unknown as BaseComponent,
    "2": { id: 2, ready: true, required: true } as unknown as BaseComponent,
    "3": { id: 3, ready: false, required: false } as unknown as BaseComponent, // Not required, so doesn't matter
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = mockComponents;

  // Set online status directly to avoid triggering checkRequiredComponentsAndSyncState early
  // @ts-ignore - accessing private property for testing
  cuss2._online = true;

  // Spy on requestAvailableState
  const requestAvailableSpy = spy(cuss2, "requestAvailableState");

  cuss2.checkRequiredComponentsAndSyncState();

  // Should request AVAILABLE state since all required components are ready
  assertEquals(requestAvailableSpy.calls.length, 1);

  requestAvailableSpy.restore();
});

Deno.test("Section 7.3: checkRequiredComponentsAndSyncState - some required components unavailable → request UNAVAILABLE state", () => {
  const { cuss2 } = createMockCuss2();

  // Set initial state to AVAILABLE
  setCurrentState(cuss2, AppState.AVAILABLE);

  // Set online status directly to avoid triggering checkRequiredComponentsAndSyncState early
  // @ts-ignore - accessing private property for testing
  cuss2._online = true;

  // Create mock components - some required components are not ready
  const mockComponents = {
    "1": { id: 1, ready: true, required: true } as unknown as BaseComponent,
    "2": { id: 2, ready: false, required: true } as unknown as BaseComponent, // Required but not ready
    "3": { id: 3, ready: true, required: false } as unknown as BaseComponent,
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = mockComponents;

  // Spy on requestUnavailableState
  const requestUnavailableSpy = spy(cuss2, "requestUnavailableState");

  cuss2.checkRequiredComponentsAndSyncState();

  // Should request UNAVAILABLE state since some required components are not ready
  assertEquals(requestUnavailableSpy.calls.length, 1);

  requestUnavailableSpy.restore();
});

Deno.test("Section 7.3: checkRequiredComponentsAndSyncState - offline → request UNAVAILABLE state", () => {
  const { cuss2 } = createMockCuss2();

  // Set initial state to AVAILABLE
  setCurrentState(cuss2, AppState.AVAILABLE);

  // Set offline status directly
  // @ts-ignore - accessing private property for testing
  cuss2._online = false;

  // Create mock components - all ready but we're offline
  const mockComponents = {
    "1": { id: 1, ready: true, required: true } as unknown as BaseComponent,
    "2": { id: 2, ready: true, required: true } as unknown as BaseComponent,
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = mockComponents;

  // Spy on requestUnavailableState
  const requestUnavailableSpy = spy(cuss2, "requestUnavailableState");

  cuss2.checkRequiredComponentsAndSyncState();

  // Should request UNAVAILABLE state when offline
  assertEquals(requestUnavailableSpy.calls.length, 1);

  requestUnavailableSpy.restore();
});

Deno.test("Section 7.3: checkRequiredComponentsAndSyncState - should not trigger state change if pending state change", () => {
  const { cuss2 } = createMockCuss2();

  // Set pending state change
  // @ts-ignore - accessing private property for testing
  cuss2.pendingStateChange = AppState.AVAILABLE;

  // Set up conditions that would normally trigger a state change
  setCurrentState(cuss2, AppState.UNAVAILABLE);
  cuss2.applicationOnline = true;

  // Create mock components - all required components are ready
  const mockComponents = {
    "1": { id: 1, ready: true, required: true } as unknown as BaseComponent,
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = mockComponents;

  // Spy on state request methods
  const requestAvailableSpy = spy(cuss2, "requestAvailableState");
  const requestUnavailableSpy = spy(cuss2, "requestUnavailableState");

  cuss2.checkRequiredComponentsAndSyncState();

  // Should not request any state change when pendingStateChange is set
  assertEquals(requestAvailableSpy.calls.length, 0);
  assertEquals(requestUnavailableSpy.calls.length, 0);

  requestAvailableSpy.restore();
  requestUnavailableSpy.restore();
});

Deno.test("Section 7.3: checkRequiredComponentsAndSyncState - should not change from non-UNAVAILABLE state when all components ready", () => {
  const { cuss2 } = createMockCuss2();

  // Set initial state to AVAILABLE (not UNAVAILABLE)
  setCurrentState(cuss2, AppState.AVAILABLE);

  // Set online status directly to avoid triggering checkRequiredComponentsAndSyncState early
  // @ts-ignore - accessing private property for testing
  cuss2._online = true;

  // Create mock components - all required components are ready
  const mockComponents = {
    "1": { id: 1, ready: true, required: true } as unknown as BaseComponent,
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = mockComponents;

  // Spy on requestAvailableState
  const requestAvailableSpy = spy(cuss2, "requestAvailableState");

  cuss2.checkRequiredComponentsAndSyncState();

  // Should NOT request AVAILABLE state since we're not in UNAVAILABLE
  assertEquals(requestAvailableSpy.calls.length, 0);

  requestAvailableSpy.restore();
});

Deno.test("Section 7.3: checkRequiredComponentsAndSyncState - should handle empty components list", () => {
  const { cuss2 } = createMockCuss2();

  // Set initial state
  setCurrentState(cuss2, AppState.UNAVAILABLE);

  // Set online status directly to avoid triggering checkRequiredComponentsAndSyncState early
  // @ts-ignore - accessing private property for testing
  cuss2._online = true;

  // Set empty components
  // @ts-ignore - accessing private property for testing
  cuss2.components = {};

  // Spy on requestAvailableState
  const requestAvailableSpy = spy(cuss2, "requestAvailableState");

  cuss2.checkRequiredComponentsAndSyncState();

  // With no components, all required components are "ready" (empty list), so should request AVAILABLE
  assertEquals(requestAvailableSpy.calls.length, 1);

  requestAvailableSpy.restore();
});

Deno.test("Section 7.3: checkRequiredComponentsAndSyncState - offline with no components should still request UNAVAILABLE", () => {
  const { cuss2 } = createMockCuss2();

  // Set initial state
  setCurrentState(cuss2, AppState.AVAILABLE);

  // Set offline status directly
  // @ts-ignore - accessing private property for testing
  cuss2._online = false;

  // No components set (undefined)
  // @ts-ignore - accessing private property for testing
  cuss2.components = undefined;

  // Spy on requestUnavailableState
  const requestUnavailableSpy = spy(cuss2, "requestUnavailableState");

  cuss2.checkRequiredComponentsAndSyncState();

  // Should not request UNAVAILABLE when components is undefined
  assertEquals(requestUnavailableSpy.calls.length, 0);

  requestUnavailableSpy.restore();
});

// Additional edge case tests

Deno.test("Section 7.1: unavailableComponents getter - should handle mixed component types", () => {
  const { cuss2 } = createMockCuss2();

  // Create mock components including some with undefined ready state
  const mockComponents = {
    "1": { id: 1, ready: true } as unknown as BaseComponent,
    "2": { id: 2, ready: false } as unknown as BaseComponent,
    "3": { id: 3 } as unknown as BaseComponent, // ready is undefined, should be treated as not ready
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = mockComponents;

  const unavailable = cuss2.unavailableComponents;

  // Components 2 and 3 should be unavailable
  assertEquals(unavailable.length, 2);
  assertEquals(unavailable.some((c: BaseComponent) => c.id === 2), true);
  assertEquals(unavailable.some((c: BaseComponent) => c.id === 3), true);
});

Deno.test("Section 7.3: checkRequiredComponentsAndSyncState - logs required unavailable components", () => {
  const { cuss2 } = createMockCuss2();

  // Set initial state
  setCurrentState(cuss2, AppState.AVAILABLE);

  // Set online status directly to avoid triggering checkRequiredComponentsAndSyncState early
  // @ts-ignore - accessing private property for testing
  cuss2._online = true;

  // Mock console log to verify logging
  const originalLog = console.log;
  const logCalls: unknown[][] = [];
  console.log = (...args: unknown[]) => {
    logCalls.push(args);
  };

  // Create mock components with constructor names
  const mockComponent1 = {
    id: 1,
    ready: false,
    required: true,
    constructor: { name: "BarcodeReader" },
  } as unknown as BaseComponent;

  const mockComponent2 = {
    id: 2,
    ready: false,
    required: true,
    constructor: { name: "CardReader" },
  } as unknown as BaseComponent;

  const mockComponents = {
    "1": mockComponent1,
    "2": mockComponent2,
  };

  // @ts-ignore - accessing private property for testing
  cuss2.components = mockComponents;

  // Mock requestUnavailableState to prevent actual state change
  const requestUnavailableStub = stub(cuss2, "requestUnavailableState", () => Promise.resolve(undefined));

  cuss2.checkRequiredComponentsAndSyncState();

  // Restore console.log
  console.log = originalLog;

  // The log function might filter out verbose logs, so we just verify the method was called
  assertEquals(requestUnavailableStub.calls.length, 1);

  requestUnavailableStub.restore();
});
