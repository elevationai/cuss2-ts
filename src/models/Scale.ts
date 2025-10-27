import { BaggageScaleComponent } from "./base/BaggageScaleComponent.ts";
import { DeviceType } from "./deviceType.ts";
import type { Cuss2 } from "../cuss2.ts";
import type { EnvironmentComponent } from "cuss2-typescript-models";

export class Scale extends BaggageScaleComponent {
  constructor(component: EnvironmentComponent, cuss2: Cuss2) {
    super(component, cuss2, DeviceType.SCALE);
  }
}
