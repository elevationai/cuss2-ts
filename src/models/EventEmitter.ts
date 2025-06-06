import { EventEmitter as EE } from "events";

export class EventEmitter extends EE {
  waitFor(event: string, errorEvents = ["error"]): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        this.off(event, resolver);
        for (const errorEvent of errorEvents) {
          this.off(errorEvent, catcher);
        }
      };
      const resolver = (e: unknown) => {
        cleanup();
        resolve(e);
      };
      const catcher = (e: unknown) => {
        cleanup();
        reject(e);
      };

      this.once(event, resolver);
      for (const errorEvent of errorEvents) {
        this.once(errorEvent, catcher);
      }
    });
  }
}
