import { assertEquals, assertRejects } from "@std/assert";
import { EventEmitter } from "./EventEmitter.ts";

Deno.test("EventEmitter - waitFor resolves with event data", async () => {
  const emitter = new EventEmitter();

  const promise = emitter.waitFor("test-event");

  // Emit the event after a small delay
  setTimeout(() => {
    emitter.emit("test-event", { data: "test-data" });
  }, 10);

  const result = await promise;
  assertEquals(result, { data: "test-data" });
});

Deno.test("EventEmitter - waitFor rejects on error event", async () => {
  const emitter = new EventEmitter();

  const promise = emitter.waitFor("test-event");

  // Emit error event
  setTimeout(() => {
    emitter.emit("error", new Error("Test error"));
  }, 10);

  await assertRejects(
    async () => await promise,
    Error,
    "Test error",
  );
});

Deno.test("EventEmitter - waitFor rejects on custom error events", async () => {
  const emitter = new EventEmitter();

  const promise = emitter.waitFor("test-event", ["error", "custom-error"]);

  // Emit custom error event
  setTimeout(() => {
    emitter.emit("custom-error", new Error("Custom error"));
  }, 10);

  await assertRejects(
    async () => await promise,
    Error,
    "Custom error",
  );
});

Deno.test("EventEmitter - waitFor with property event syntax", async () => {
  class TestEmitter extends EventEmitter {
    subEmitter: EventEmitter;

    constructor() {
      super();
      this.subEmitter = new EventEmitter();
    }
  }

  const emitter = new TestEmitter();

  const promise = emitter.waitFor("subEmitter.data");

  // Emit event on sub-emitter
  setTimeout(() => {
    emitter.subEmitter.emit("data", { value: 42 });
  }, 10);

  const result = await promise;
  assertEquals(result, { value: 42 });
});

Deno.test("EventEmitter - waitFor with property error event", async () => {
  class TestEmitter extends EventEmitter {
    subEmitter: EventEmitter;

    constructor() {
      super();
      this.subEmitter = new EventEmitter();
    }
  }

  const emitter = new TestEmitter();

  const promise = emitter.waitFor("subEmitter.data", ["subEmitter.error"]);

  // Emit error on sub-emitter
  setTimeout(() => {
    emitter.subEmitter.emit("error", new Error("Sub error"));
  }, 10);

  await assertRejects(
    async () => await promise,
    Error,
    "Sub error",
  );
});

Deno.test("EventEmitter - waitFor falls back to full event name if property doesn't exist", async () => {
  const emitter = new EventEmitter();

  const promise = emitter.waitFor("nonexistent.event");

  // Emit event with full name
  setTimeout(() => {
    emitter.emit("nonexistent.event", "fallback-data");
  }, 10);

  const result = await promise;
  assertEquals(result, "fallback-data");
});

Deno.test("EventEmitter - waitFor falls back if property is not EventEmitter", async () => {
  class TestEmitter extends EventEmitter {
    notAnEmitter: string = "just a string";
  }

  const emitter = new TestEmitter();

  const promise = emitter.waitFor("notAnEmitter.event");

  // Emit event with full name
  setTimeout(() => {
    emitter.emit("notAnEmitter.event", "fallback-data");
  }, 10);

  const result = await promise;
  assertEquals(result, "fallback-data");
});

Deno.test("EventEmitter - waitFor cleans up all listeners on resolve", async () => {
  class TestEmitter extends EventEmitter {
    subEmitter: EventEmitter;

    constructor() {
      super();
      this.subEmitter = new EventEmitter();
    }
  }

  const emitter = new TestEmitter();

  // Register waitFor with multiple error events
  const promise = emitter.waitFor("test-event", ["error", "subEmitter.error"]);

  // Check initial listener counts
  assertEquals(emitter.listenerCount("test-event"), 1);
  assertEquals(emitter.listenerCount("error"), 1);
  assertEquals(emitter.subEmitter.listenerCount("error"), 1);

  // Resolve the promise
  emitter.emit("test-event", "data");
  await promise;

  // All listeners should be cleaned up
  assertEquals(emitter.listenerCount("test-event"), 0);
  assertEquals(emitter.listenerCount("error"), 0);
  assertEquals(emitter.subEmitter.listenerCount("error"), 0);
});

Deno.test("EventEmitter - waitFor cleans up all listeners on reject", async () => {
  class TestEmitter extends EventEmitter {
    subEmitter: EventEmitter;

    constructor() {
      super();
      this.subEmitter = new EventEmitter();
    }
  }

  const emitter = new TestEmitter();

  // Register waitFor with multiple error events
  const promise = emitter.waitFor("test-event", ["error", "subEmitter.error"]);

  // Check initial listener counts
  assertEquals(emitter.listenerCount("test-event"), 1);
  assertEquals(emitter.listenerCount("error"), 1);
  assertEquals(emitter.subEmitter.listenerCount("error"), 1);

  // Reject the promise
  emitter.emit("error", new Error("test"));

  try {
    await promise;
  }
  catch {
    // Expected rejection
  }

  // All listeners should be cleaned up
  assertEquals(emitter.listenerCount("test-event"), 0);
  assertEquals(emitter.listenerCount("error"), 0);
  assertEquals(emitter.subEmitter.listenerCount("error"), 0);
});

Deno.test("EventEmitter - waitFor handles multiple simultaneous calls", async () => {
  const emitter = new EventEmitter();

  const promise1 = emitter.waitFor("event1");
  const promise2 = emitter.waitFor("event2");

  assertEquals(emitter.listenerCount("event1"), 1);
  assertEquals(emitter.listenerCount("event2"), 1);

  emitter.emit("event1", "data1");
  emitter.emit("event2", "data2");

  const [result1, result2] = await Promise.all([promise1, promise2]);

  assertEquals(result1, "data1");
  assertEquals(result2, "data2");
  assertEquals(emitter.listenerCount("event1"), 0);
  assertEquals(emitter.listenerCount("event2"), 0);
});

Deno.test("EventEmitter - waitFor with no dot in event name", async () => {
  const emitter = new EventEmitter();

  const promise = emitter.waitFor("simple");

  setTimeout(() => {
    emitter.emit("simple", "simple-data");
  }, 10);

  const result = await promise;
  assertEquals(result, "simple-data");
});

Deno.test("EventEmitter - waitFor with empty error events array", async () => {
  const emitter = new EventEmitter();

  // Add a dummy error listener to prevent uncaught error
  emitter.on("error", () => {});

  // Pass empty array for error events
  const promise = emitter.waitFor("test-event", []);

  // Error event should not cause rejection of waitFor promise
  emitter.emit("error", new Error("Should not reject"));

  // Main event should still resolve
  setTimeout(() => {
    emitter.emit("test-event", "success");
  }, 20);

  const result = await promise;
  assertEquals(result, "success");
});
