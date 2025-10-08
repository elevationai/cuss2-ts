import { ConveyorComponent } from "./base/ConveyorComponent.ts";
import { DeviceType } from "./deviceType.ts";
import type { Cuss2 } from "../cuss2.ts";
import type { EnvironmentComponent } from "cuss2-typescript-models";

export class VerificationBelt extends ConveyorComponent {
  constructor(component: EnvironmentComponent, cuss2: Cuss2) {
    super(component, cuss2, DeviceType.VERIFICATION_BELT);
  }
  // Cannot be enabled/disabled - only ConveyorComponent methods
}
