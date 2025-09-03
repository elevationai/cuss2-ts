// src/models/EventEmitter.ts
// Runtime: always use the tiny npm polyfill (works in Deno + browsers)
import EE from "npm:events@3.3.0";

// Types only: tell TS we're “like” Node's EventEmitter
import type { EventEmitter as NodeEventEmitter } from "node:events";

// Extract superclass expression to avoid slow-types lint error
const BaseEventEmitter = EE as unknown as { new (...a: unknown[]): NodeEventEmitter };

// Extend the runtime ctor, but give it Node's EventEmitter shape for typing
export class EventEmitter extends BaseEventEmitter {
  waitFor(event: string | symbol, errorEvents: (string | symbol)[] = ["error"]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const mappings: Array<{ source: NodeEventEmitter; event: string | symbol; handler: (...a: unknown[]) => void }> =
        [];

      const cleanup = () => mappings.forEach((m) => m.source.removeListener(m.event, m.handler));
      const resolver = (...a: unknown[]) => {
        cleanup();
        resolve(a[0]);
      };
      const catcher = (...a: unknown[]) => {
        cleanup();
        reject(a[0] ?? a);
      };

      const attach = (ev: string | symbol, handler: (...a: unknown[]) => void) => {
        if (typeof ev === "string" && ev.includes(".")) {
          const parts = ev.split(".");
          const traverseToTarget = (obj: unknown, segments: string[]): unknown => {
            let current = obj;
            for (const seg of segments) {
              current = (current as Record<string, unknown>)?.[seg];
            }
            return current;
          };

          const target = traverseToTarget(this, parts.slice(0, -1)) as NodeEventEmitter | undefined;
          const leaf = parts[parts.length - 1];
          if (target && typeof target.once === "function") {
            target.once(leaf, handler);
            mappings.push({ source: target, event: leaf, handler });
            return;
          }
        }
        this.once(ev, handler);
        mappings.push({ source: this, event: ev, handler });
      };

      attach(event, resolver);
      for (const e of errorEvents) attach(e, catcher);
    });
  }
}
