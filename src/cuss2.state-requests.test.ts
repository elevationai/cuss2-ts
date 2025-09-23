import { assertEquals } from "@std/assert";
import { spy, stub } from "@std/testing/mock";
import { ApplicationStateCodes as AppState, type PlatformData } from "cuss2-typescript-models";
import { createMockCuss2, MockConnection, setCurrentState } from "./test-helpers.ts";
import { Cuss2 } from "./cuss2.ts";
import type { Component } from "./models/Component.ts";

// Section 6: State Request Methods Tests

Deno.test("Section 6.1: requestInitializeState - should transition from STOPPED to INITIALIZE", async () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  // Set initial state to STOPPED
  setCurrentState(cuss2, AppState.STOPPED);

  // Mock the api.staterequest response
  const mockResponse: PlatformData = {
    meta: {
      messageCode: "OK",
      currentApplicationState: { applicationStateCode: AppState.INITIALIZE },
    },
    payload: {},
  } as unknown as PlatformData;

  const staterequestStub = stub(cuss2.api, "staterequest", () => Promise.resolve(mockResponse));

  const result = await cuss2.requestInitializeState();

  // Verify staterequest was called with correct state
  assertEquals(staterequestStub.calls.length, 1);
  assertEquals(staterequestStub.calls[0].args[0], AppState.INITIALIZE);
  assertEquals(result, mockResponse);

  staterequestStub.restore();
});

Deno.test("Section 6.1: requestInitializeState - should return undefined when not in STOPPED state", async () => {
  const { cuss2 } = createMockCuss2();

  // Set state to something other than STOPPED
  setCurrentState(cuss2, AppState.AVAILABLE);

  const staterequestSpy = spy(cuss2.api, "staterequest");

  const result = await cuss2.requestInitializeState();

  // Verify staterequest was not called
  assertEquals(staterequestSpy.calls.length, 0);
  assertEquals(result, undefined);

  staterequestSpy.restore();
});

Deno.test("Section 6.2: requestUnavailableState - should transition from INITIALIZE", async () => {
  const { cuss2 } = createMockCuss2();

  setCurrentState(cuss2, AppState.INITIALIZE);

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const staterequestStub = stub(cuss2.api, "staterequest", () => Promise.resolve(mockResponse));

  const result = await cuss2.requestUnavailableState();

  assertEquals(staterequestStub.calls.length, 1);
  assertEquals(staterequestStub.calls[0].args[0], AppState.UNAVAILABLE);
  assertEquals(result, mockResponse);

  staterequestStub.restore();
});

Deno.test("Section 6.2: requestUnavailableState - should transition from AVAILABLE", async () => {
  const { cuss2 } = createMockCuss2();

  setCurrentState(cuss2, AppState.AVAILABLE);

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const staterequestStub = stub(cuss2.api, "staterequest", () => Promise.resolve(mockResponse));

  const result = await cuss2.requestUnavailableState();

  assertEquals(staterequestStub.calls.length, 1);
  assertEquals(staterequestStub.calls[0].args[0], AppState.UNAVAILABLE);
  assertEquals(result, mockResponse);

  staterequestStub.restore();
});

Deno.test("Section 6.2: requestUnavailableState - should disable components when transitioning from ACTIVE", async () => {
  const { cuss2 } = createMockCuss2();

  setCurrentState(cuss2, AppState.ACTIVE);

  // Create mock components
  const mockComponent1 = {
    enabled: true,
    disable: () => Promise.resolve(),
  } as unknown as Component;

  const mockComponent2 = {
    enabled: true,
    disable: () => Promise.resolve(),
  } as unknown as Component;

  const mockComponent3 = {
    enabled: false, // Already disabled
    disable: () => Promise.resolve(),
  } as unknown as Component;

  // @ts-ignore - accessing private property for testing
  cuss2.components = {
    "1": mockComponent1,
    "2": mockComponent2,
    "3": mockComponent3,
  };

  const disableSpy1 = spy(mockComponent1, "disable");
  const disableSpy2 = spy(mockComponent2, "disable");
  const disableSpy3 = spy(mockComponent3, "disable");

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const staterequestStub = stub(cuss2.api, "staterequest", () => Promise.resolve(mockResponse));

  const result = await cuss2.requestUnavailableState();

  // Verify enabled components were disabled
  assertEquals(disableSpy1.calls.length, 1);
  assertEquals(disableSpy2.calls.length, 1);
  assertEquals(disableSpy3.calls.length, 0); // Already disabled, shouldn't be called

  assertEquals(staterequestStub.calls.length, 1);
  assertEquals(result, mockResponse);

  disableSpy1.restore();
  disableSpy2.restore();
  disableSpy3.restore();
  staterequestStub.restore();
});

Deno.test("Section 6.2: requestUnavailableState - should return undefined from invalid states", async () => {
  const { cuss2 } = createMockCuss2();

  setCurrentState(cuss2, AppState.STOPPED);

  const staterequestSpy = spy(cuss2.api, "staterequest");

  const result = await cuss2.requestUnavailableState();

  assertEquals(staterequestSpy.calls.length, 0);
  assertEquals(result, undefined);

  staterequestSpy.restore();
});

Deno.test("Section 6.3: requestAvailableState - should transition from UNAVAILABLE", async () => {
  const { cuss2 } = createMockCuss2();

  setCurrentState(cuss2, AppState.UNAVAILABLE);

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const staterequestStub = stub(cuss2.api, "staterequest", () => Promise.resolve(mockResponse));

  const result = await cuss2.requestAvailableState();

  assertEquals(staterequestStub.calls.length, 1);
  assertEquals(staterequestStub.calls[0].args[0], AppState.AVAILABLE);
  assertEquals(result, mockResponse);

  staterequestStub.restore();
});

Deno.test("Section 6.3: requestAvailableState - should disable components when transitioning from ACTIVE", async () => {
  const { cuss2 } = createMockCuss2();

  setCurrentState(cuss2, AppState.ACTIVE);

  // Create mock component
  const mockComponent = {
    enabled: true,
    disable: () => Promise.resolve(),
  } as unknown as Component;

  // @ts-ignore - accessing private property for testing
  cuss2.components = { "1": mockComponent };

  const disableSpy = spy(mockComponent, "disable");

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const staterequestStub = stub(cuss2.api, "staterequest", () => Promise.resolve(mockResponse));

  const result = await cuss2.requestAvailableState();

  // Verify component was disabled
  assertEquals(disableSpy.calls.length, 1);

  assertEquals(staterequestStub.calls.length, 1);
  assertEquals(result, mockResponse);

  disableSpy.restore();
  staterequestStub.restore();
});

Deno.test("Section 6.3: requestAvailableState - should return undefined from INITIALIZE state", async () => {
  const { cuss2 } = createMockCuss2();

  // According to implementation, can't go directly from INITIALIZE to AVAILABLE
  setCurrentState(cuss2, AppState.INITIALIZE);

  const staterequestSpy = spy(cuss2.api, "staterequest");

  const result = await cuss2.requestAvailableState();

  assertEquals(staterequestSpy.calls.length, 0);
  assertEquals(result, undefined);

  staterequestSpy.restore();
});

Deno.test("Section 6.4: requestActiveState - should transition from AVAILABLE", async () => {
  const { cuss2 } = createMockCuss2();

  setCurrentState(cuss2, AppState.AVAILABLE);

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const staterequestStub = stub(cuss2.api, "staterequest", () => Promise.resolve(mockResponse));

  const result = await cuss2.requestActiveState();

  assertEquals(staterequestStub.calls.length, 1);
  assertEquals(staterequestStub.calls[0].args[0], AppState.ACTIVE);
  assertEquals(result, mockResponse);

  staterequestStub.restore();
});

Deno.test("Section 6.4: requestActiveState - should allow transition from ACTIVE (refresh)", async () => {
  const { cuss2 } = createMockCuss2();

  setCurrentState(cuss2, AppState.ACTIVE);

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const staterequestStub = stub(cuss2.api, "staterequest", () => Promise.resolve(mockResponse));

  const result = await cuss2.requestActiveState();

  assertEquals(staterequestStub.calls.length, 1);
  assertEquals(staterequestStub.calls[0].args[0], AppState.ACTIVE);
  assertEquals(result, mockResponse);

  staterequestStub.restore();
});

Deno.test("Section 6.4: requestActiveState - should return undefined from invalid states", async () => {
  const { cuss2 } = createMockCuss2();

  setCurrentState(cuss2, AppState.UNAVAILABLE);

  const staterequestSpy = spy(cuss2.api, "staterequest");

  const result = await cuss2.requestActiveState();

  assertEquals(staterequestSpy.calls.length, 0);
  assertEquals(result, undefined);

  staterequestSpy.restore();
});

Deno.test("Section 6.5: requestStoppedState - should transition to STOPPED from any state", async () => {
  const { cuss2 } = createMockCuss2();

  const states = [
    AppState.INITIALIZE,
    AppState.UNAVAILABLE,
    AppState.AVAILABLE,
    AppState.ACTIVE,
    AppState.STOPPED,
  ];

  for (const state of states) {
    setCurrentState(cuss2, state);

    const mockResponse: PlatformData = {
      meta: { messageCode: "OK" },
      payload: {},
    } as unknown as PlatformData;

    const staterequestStub = stub(cuss2.api, "staterequest", () => Promise.resolve(mockResponse));

    const result = await cuss2.requestStoppedState();

    // requestStoppedState always calls staterequest, regardless of current state
    assertEquals(staterequestStub.calls.length, 1);
    assertEquals(staterequestStub.calls[0].args[0], AppState.STOPPED);
    assertEquals(result, mockResponse);

    staterequestStub.restore();
  }
});

Deno.test("Section 6.6: requestReload - should request reload from valid states", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const validStates = [
    AppState.UNAVAILABLE,
    AppState.AVAILABLE,
    AppState.ACTIVE,
  ];

  for (const state of validStates) {
    setCurrentState(cuss2, state);

    const mockResponse: PlatformData = {
      meta: { messageCode: "OK" },
      payload: {},
    } as unknown as PlatformData;

    const staterequestStub = stub(cuss2.api, "staterequest", () => Promise.resolve(mockResponse));
    const closeSpy = spy(mockConnection._socket, "close");

    const result = await cuss2.requestReload();

    // Verify reload was requested
    assertEquals(staterequestStub.calls.length, 1);
    assertEquals(staterequestStub.calls[0].args[0], AppState.RELOAD);

    // Verify socket was closed with correct code
    assertEquals(closeSpy.calls.length, 1);
    assertEquals(closeSpy.calls[0].args[0], 1001);
    assertEquals(closeSpy.calls[0].args[1], "Reloading");

    assertEquals(result, true);

    staterequestStub.restore();
    closeSpy.restore();
  }
});

Deno.test("Section 6.6: requestReload - should handle undefined state", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  // The requestReload checks !this.state, but the state getter accesses _currentState.current
  // So we need to mock the state getter instead
  const originalState = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(cuss2), "state");
  Object.defineProperty(cuss2, "state", {
    get: () => undefined,
    configurable: true,
  });

  const mockResponse: PlatformData = {
    meta: { messageCode: "OK" },
    payload: {},
  } as unknown as PlatformData;

  const staterequestStub = stub(cuss2.api, "staterequest", () => Promise.resolve(mockResponse));
  const closeSpy = spy(mockConnection._socket, "close");

  const result = await cuss2.requestReload();

  // Should still work with undefined state
  assertEquals(staterequestStub.calls.length, 1);
  assertEquals(closeSpy.calls.length, 1);
  assertEquals(result, true);

  // Restore original state getter
  if (originalState) {
    Object.defineProperty(cuss2, "state", originalState);
  }

  staterequestStub.restore();
  closeSpy.restore();
});

Deno.test("Section 6.6: requestReload - should return false from invalid states", async () => {
  const { cuss2, mockConnection } = createMockCuss2();

  const invalidStates = [
    AppState.INITIALIZE,
    AppState.STOPPED,
  ];

  for (const state of invalidStates) {
    setCurrentState(cuss2, state);

    const staterequestSpy = spy(cuss2.api, "staterequest");
    const closeSpy = spy(mockConnection._socket, "close");

    const result = await cuss2.requestReload();

    // Should not call staterequest or close socket
    assertEquals(staterequestSpy.calls.length, 0);
    assertEquals(closeSpy.calls.length, 0);
    assertEquals(result, false);

    staterequestSpy.restore();
    closeSpy.restore();
  }
});

// Additional test for _disableAllComponents to ensure it works correctly
Deno.test("Section 6: _disableAllComponents - should disable all enabled components sequentially", async () => {
  const { cuss2 } = createMockCuss2();

  // Create mock components with different states
  const components = [
    { enabled: true, disable: () => Promise.resolve() },
    { enabled: false, disable: () => Promise.resolve() },
    { enabled: true, disable: () => Promise.resolve() },
  ];

  // @ts-ignore - accessing private property for testing
  cuss2.components = {
    "1": components[0],
    "2": components[1],
    "3": components[2],
  };

  const disableSpies = components.map((c) => spy(c, "disable"));

  // @ts-ignore - accessing private method for testing
  await cuss2._disableAllComponents();

  // Verify only enabled components were disabled
  assertEquals(disableSpies[0].calls.length, 1);
  assertEquals(disableSpies[1].calls.length, 0); // Already disabled
  assertEquals(disableSpies[2].calls.length, 1);

  disableSpies.forEach((s) => s.restore());
});
