/**
 * InsertionBeltComponent - Special conveyor that can also be enabled/disabled and offer
 * The only interactive conveyor component
 */

import { InteractiveComponent } from "./InteractiveComponent.ts";
import type { ConveyorCapable, MediaOfferCapable, OutputCapable } from "../capabilities/ComponentCapabilities.ts";
import type { BaggageData, PlatformData } from "cuss2-typescript-models";

export class InsertionBeltComponent extends InteractiveComponent implements OutputCapable, ConveyorCapable, MediaOfferCapable {
  /**
   * Send baggage data to the component
   */
  async send(dataObj: BaggageData): Promise<PlatformData> {
    this.pendingCalls++;
    const pd = await this.api.send(this.id, dataObj).finally(() => this.pendingCalls--);
    this.updateState(pd);
    return pd;
  }

  /**
   * Offer the bag to the next component/user
   */
  async offer(): Promise<PlatformData> {
    this.pendingCalls++;
    return await this.api.offer(this.id).finally(() => this.pendingCalls--);
  }

  /**
   * Move bag to next position
   */
  forward(): Promise<PlatformData> {
    // Implementation would call appropriate API endpoint
    return Promise.reject(new Error("Conveyor forward operation not yet implemented"));
  }

  /**
   * Move bag back to user
   */
  backward(): Promise<PlatformData> {
    // Implementation would call appropriate API endpoint
    return Promise.reject(new Error("Conveyor backward operation not yet implemented"));
  }

  /**
   * Process/examine bag
   */
  process(): Promise<PlatformData> {
    // Implementation would call appropriate API endpoint
    return Promise.reject(new Error("Conveyor process operation not yet implemented"));
  }
}
