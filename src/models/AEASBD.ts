import { MediaOutputComponent } from "./base/MediaOutputComponent.ts";
import { DeviceType } from "./deviceType.ts";
import type { Cuss2 } from "../cuss2.ts";
import type { EnvironmentComponent } from "cuss2-typescript-models";

export class AEASBD extends MediaOutputComponent {
  constructor(component: EnvironmentComponent, cuss2: Cuss2) {
    super(component, cuss2, DeviceType.AEASBD);
  }
  // AEA Self Bag Drop - similar to printer, uses ITPS commands
}
