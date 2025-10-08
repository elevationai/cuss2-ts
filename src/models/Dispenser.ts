import { DispenserComponent } from "./base/DispenserComponent.ts";
import { DeviceType } from "./deviceType.ts";
import type { Cuss2 } from "../cuss2.ts";
import { type EnvironmentComponent, MessageCodes } from "cuss2-typescript-models";
import type { Printer } from "./Printer.ts";

export class Dispenser extends DispenserComponent {
  printer?: Printer;

  constructor(component: EnvironmentComponent, cuss2: Cuss2) {
    super(component, cuss2, DeviceType.DISPENSER);

    // Listen for status changes
    this.on("statusChange", (status: MessageCodes) => {
      if (status === MessageCodes.MEDIA_PRESENT) {
        this.pollUntilReady(true, 2000);
        if (!this.mediaPresent) {
          this.mediaPresent = true;
          this.emit("mediaPresent", true);
        }
      }
      else {
        if (this.mediaPresent) {
          this.mediaPresent = false;
          this.emit("mediaPresent", false);
        }
      }
    });
  }
}
