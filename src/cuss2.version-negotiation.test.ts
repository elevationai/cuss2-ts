import { assertEquals, assertRejects, assertThrows } from "@std/assert";
import { stub } from "@std/testing/mock";
import { type ApplicationData, ApplicationStateCodes as AppState, type PlatformData, PlatformDirectives } from "cuss2-typescript-models";
import { createMockEnvironment, MockConnection } from "./test-helpers.ts";
import { highestCussVersion, supportsAtLeast } from "./helper.ts";
import { Cuss2 } from "./cuss2.ts";

const STATE_REQUEST_PRE_2_4_WIRE_NAME = "platform_applications_staterequest";

// Builds a Cuss2 whose environment has been populated from the given cussVersions.
async function connectWithVersions(cussVersions: unknown) {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  const environment = createMockEnvironment(
    {
      cussVersions,
    } as Parameters<typeof createMockEnvironment>[0],
  );

  const sendAndGetResponse = stub(mockConnection, "sendAndGetResponse", () =>
    Promise.resolve({
      meta: { messageCode: "OK" },
      payload: { environmentLevel: environment },
    } as unknown as PlatformData));

  await cuss2.api.getEnvironment();
  sendAndGetResponse.restore();

  return { cuss2, mockConnection };
}

// Returns the directive the platform actually received for a state request.
async function directiveForStateRequest(cussVersions: unknown) {
  const { cuss2, mockConnection } = await connectWithVersions(cussVersions);

  const sendAndGetResponse = stub(mockConnection, "sendAndGetResponse", () =>
    Promise.resolve({
      meta: { messageCode: "OK" },
      payload: {},
    } as unknown as PlatformData));

  await cuss2.api.staterequest(AppState.AVAILABLE);

  const sent = sendAndGetResponse.calls[0].args[0] as ApplicationData;
  sendAndGetResponse.restore();
  return sent.meta.directive;
}

Deno.test("highestCussVersion picks the highest entry regardless of order", () => {
  assertEquals(highestCussVersion(["2.4", "2.3"]), "2.4");
  assertEquals(highestCussVersion(["2.3", "2.4"]), "2.4");
  assertEquals(highestCussVersion(["2.3.2"]), "2.3.2");
  assertEquals(highestCussVersion(["2.9", "2.10"]), "2.10");
});

Deno.test("highestCussVersion orders by patch", () => {
  assertEquals(highestCussVersion(["2.4.0", "2.4.1"]), "2.4.1");
  assertEquals(highestCussVersion(["2.4.1", "2.4.0"]), "2.4.1");
  assertEquals(highestCussVersion(["2.4.2", "2.4.10"]), "2.4.10");
  // An omitted patch is 2.4.0, so an explicit patch outranks it.
  assertEquals(highestCussVersion(["2.4", "2.4.1"]), "2.4.1");
  assertEquals(highestCussVersion(["2.4.1", "2.4"]), "2.4.1");
  // A higher minor still wins over a higher patch.
  assertEquals(highestCussVersion(["2.3.9", "2.4.0"]), "2.4.0");
});

Deno.test("highestCussVersion tolerates prerelease suffixes", () => {
  assertEquals(highestCussVersion(["2.4.1-beta"]), "2.4.1-beta");
  assertEquals(highestCussVersion(["2.3", "2.4.1-beta"]), "2.4.1-beta");
});

Deno.test("highestCussVersion returns undefined when nothing is usable", () => {
  assertEquals(highestCussVersion(undefined), undefined);
  assertEquals(highestCussVersion([]), undefined);
  assertEquals(highestCussVersion(["nonsense"]), undefined);
  // A non-array value from a misbehaving platform must not throw.
  assertEquals(highestCussVersion("2.4" as unknown as string[]), undefined);
});

Deno.test("supportsAtLeast compares against the requested version", () => {
  assertEquals(supportsAtLeast(["2.3"], "2.4"), false);
  assertEquals(supportsAtLeast(["2.3.2"], "2.4"), false);
  assertEquals(supportsAtLeast(["2.3.99"], "2.4"), false);
  assertEquals(supportsAtLeast(["2.4"], "2.4"), true);
  assertEquals(supportsAtLeast(["2.4.0"], "2.4"), true);
  assertEquals(supportsAtLeast(["2.3", "2.4"], "2.4"), true);
  assertEquals(supportsAtLeast(["3.0"], "2.4"), true);
});

Deno.test("supportsAtLeast gates each version independently", () => {
  // What a 2.5 workaround would ask, without redefining what 2.4 means.
  assertEquals(supportsAtLeast(["2.4.1"], "2.4"), true);
  assertEquals(supportsAtLeast(["2.4.1"], "2.5"), false);
  assertEquals(supportsAtLeast(["2.5"], "2.4"), true);
  assertEquals(supportsAtLeast(["2.5"], "2.5"), true);
});

Deno.test("supportsAtLeast ignores the patch, which carries no breaking changes", () => {
  assertEquals(supportsAtLeast(["2.4.1"], "2.4"), true);
  assertEquals(supportsAtLeast(["2.3", "2.4", "2.4.1"], "2.4"), true);
});

Deno.test("supportsAtLeast assumes the targeted spec when the platform reports nothing", () => {
  for (const versions of [undefined, [], ["nonsense"]]) {
    assertEquals(supportsAtLeast(versions, "2.4"), true);
    // The assumption is the targeted version, not "supports everything".
    assertEquals(supportsAtLeast(versions, "2.5"), false);
  }
});

Deno.test("supportsAtLeast throws on an unparseable minimum", () => {
  assertThrows(() => supportsAtLeast(["2.4"], "2,4"), TypeError, "Invalid version: 2,4");
});

Deno.test("pre-2.4 platform receives the pre-rename state request directive", async () => {
  assertEquals(
    await directiveForStateRequest(["2.3"]),
    STATE_REQUEST_PRE_2_4_WIRE_NAME,
  );
});

Deno.test("2.4 platform receives the renamed state request directive", async () => {
  assertEquals(
    await directiveForStateRequest(["2.3", "2.4"]),
    PlatformDirectives.PLATFORM_APPLICATIONS_STATE_REQUEST,
  );
});

Deno.test("platform reporting no versions falls back to the renamed directive", async () => {
  assertEquals(
    await directiveForStateRequest(undefined),
    PlatformDirectives.PLATFORM_APPLICATIONS_STATE_REQUEST,
  );
});

Deno.test("re-fetching the environment re-resolves the directive", async () => {
  // A reconnect can land on a different platform, so the pinned directive must not stick.
  const { cuss2, mockConnection } = await connectWithVersions(["2.3", "2.4"]);

  const refetch = stub(mockConnection, "sendAndGetResponse", () =>
    Promise.resolve({
      meta: { messageCode: "OK" },
      payload: {
        environmentLevel: createMockEnvironment({ cussVersions: ["2.3"] } as Parameters<typeof createMockEnvironment>[0]),
      },
    } as unknown as PlatformData));
  await cuss2.api.getEnvironment();
  refetch.restore();

  const stateRequest = stub(
    mockConnection,
    "sendAndGetResponse",
    () => Promise.resolve({ meta: { messageCode: "OK" }, payload: {} } as unknown as PlatformData),
  );
  await cuss2.api.staterequest(AppState.AVAILABLE);
  const sent = stateRequest.calls[0].args[0] as ApplicationData;
  stateRequest.restore();

  assertEquals(sent.meta.directive, STATE_REQUEST_PRE_2_4_WIRE_NAME);
});

Deno.test("platformVersion and supportsAtLeast reflect the environment", async () => {
  const pre24 = await connectWithVersions(["2.3"]);
  assertEquals(pre24.cuss2.platformVersion, "2.3");
  assertEquals(pre24.cuss2.supportsAtLeast("2.4"), false);

  const v24 = await connectWithVersions(["2.3", "2.4"]);
  assertEquals(v24.cuss2.platformVersion, "2.4");
  assertEquals(v24.cuss2.supportsAtLeast("2.4"), true);
});

Deno.test("supportsAtLeast assumes the targeted spec before the environment is fetched", () => {
  const mockConnection = new MockConnection();
  // @ts-ignore - accessing private constructor for testing
  const cuss2 = new Cuss2(mockConnection);

  assertEquals(cuss2.platformVersion, undefined);
  assertEquals(cuss2.supportsAtLeast("2.4"), true);
});

Deno.test("extendSession throws on a 2.3 platform without sending anything", async () => {
  const { cuss2, mockConnection } = await connectWithVersions(["2.3"]);

  const sendAndGetResponse = stub(mockConnection, "sendAndGetResponse", () =>
    Promise.resolve({
      meta: { messageCode: "OK" },
      payload: {},
    } as unknown as PlatformData));

  await assertRejects(
    () => cuss2.api.extendSession(),
    Error,
    "Session extension requires CUSS 2.4; platform reports 2.3",
  );
  assertEquals(sendAndGetResponse.calls.length, 0);

  sendAndGetResponse.restore();
});

Deno.test("extendSession sends the directive on a 2.4 platform", async () => {
  const { cuss2, mockConnection } = await connectWithVersions(["2.3", "2.4"]);

  const sendAndGetResponse = stub(mockConnection, "sendAndGetResponse", () =>
    Promise.resolve({
      meta: { messageCode: "OK" },
      payload: {},
    } as unknown as PlatformData));

  await cuss2.api.extendSession();

  const sent = sendAndGetResponse.calls[0].args[0] as ApplicationData;
  assertEquals(
    sent.meta.directive,
    PlatformDirectives.PLATFORM_APPLICATIONS_EXTEND_SESSION_REQUEST,
  );

  sendAndGetResponse.restore();
});
