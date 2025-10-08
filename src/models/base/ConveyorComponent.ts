/**
 * ConveyorComponent - Base for conveyor belt components
 * All conveyors can send data and have conveyor-specific methods
 */

import { BaseComponent } from "./BaseComponent.ts";
import type { ConveyorCapable, OutputCapable } from "../capabilities/ComponentCapabilities.ts";
import type { BaggageData, PlatformData } from "cuss2-typescript-models";

export abstract class ConveyorComponent extends BaseComponent implements OutputCapable, ConveyorCapable {
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
   * Move bag to next position or airport collector belt
   */
  forward(): Promise<PlatformData> {
    // Implementation would call appropriate API endpoint
    // For now, using send with specific data
    return Promise.reject(new Error("Conveyor forward operation not yet implemented"));
  }

  /**
   * Move bag back to previous position or user
   */
  backward(): Promise<PlatformData> {
    // Implementation would call appropriate API endpoint
    return Promise.reject(new Error("Conveyor backward operation not yet implemented"));
  }

  /**
   * Process/examine bag for weight, dimensions, LPNs, RFID
   */
  process(): Promise<PlatformData> {
    // Implementation would call appropriate API endpoint
    return Promise.reject(new Error("Conveyor process operation not yet implemented"));
  }
}
