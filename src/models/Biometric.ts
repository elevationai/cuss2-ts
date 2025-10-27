import { UserOutputComponent } from "./base/UserOutputComponent.ts";
import { DeviceType } from "./deviceType.ts";
import type { Cuss2 } from "../cuss2.ts";
import type { EnvironmentComponent } from "cuss2-typescript-models";

export class Biometric extends UserOutputComponent {
  constructor(component: EnvironmentComponent, cuss2: Cuss2) {
    super(component, cuss2, DeviceType.BIOMETRIC);
  }
  // Can send CommonUseBiometricMessage via inherited send() method
}
