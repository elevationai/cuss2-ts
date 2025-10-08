import { AnnouncementComponent } from "./base/AnnouncementComponent.ts";
import { DeviceType } from "./deviceType.ts";
import type { Cuss2 } from "../cuss2.ts";
import type { EnvironmentComponent } from "cuss2-typescript-models";

export class Announcement extends AnnouncementComponent {
  constructor(component: EnvironmentComponent, cuss2: Cuss2) {
    super(component, cuss2, DeviceType.ANNOUNCEMENT);
  }
  // All methods inherited from AnnouncementComponent
}
