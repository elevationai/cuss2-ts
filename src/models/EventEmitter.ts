import { EventEmitter as EE } from "events";


export class EventEmitter extends EE {
  waitFor(event: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const resolver = (e: unknown) => {
        this.off("close", catcher);
        resolve(e);
      };
      const catcher = (e: unknown) => {
        this.off(event, resolver);
        reject(e);
      };
      this.once(event, resolver);
      this.once("close", catcher);
    });
  }
}
