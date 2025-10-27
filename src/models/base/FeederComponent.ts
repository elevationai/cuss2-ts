/**
 * FeederComponent - Can only offer media, no enable/disable or send
 */

import { BaseComponent } from "./BaseComponent.ts";
import type { MediaOfferCapable } from "../capabilities/ComponentCapabilities.ts";
import type { PlatformData } from "cuss2-typescript-models";

export class FeederComponent extends BaseComponent implements MediaOfferCapable {
  /**
   * Offer media from feeder
   */
  async offer(): Promise<PlatformData> {
    return await this.withPendingCall(() => this.api.offer(this.id));
  }
}
