/**
 * InteractiveComponent - Base for components that can be enabled/disabled
 * Adds enable/disable methods to base component functionality
 */

import { BaseComponent } from "./BaseComponent.ts";
import { MessageCodes, type PlatformData } from "cuss2-typescript-models";
import type { UserEnableCapable } from "../capabilities/ComponentCapabilities.ts";

export abstract class InteractiveComponent extends BaseComponent implements UserEnableCapable {
  override enabled: boolean = false;

  /**
   * Enable the component for user interaction
   * Available to: DISPENSER, USER_INPUT, USER_OUTPUT, MEDIA_INPUT,
   *               MEDIA_OUTPUT, DISPLAY, BAGGAGE_SCALE, INSERTION_BELT, ANNOUNCEMENT
   */
  async enable(): Promise<PlatformData> {
    console.log(`[DEBUG InteractiveComponent] enable() called, enabled before=${this.enabled}`);
    const pd = await this.withPendingCall(() => this.api.enable(this.id));
    console.log(`[DEBUG InteractiveComponent] enable() received response:`, pd);
    this.updateState(pd);
    console.log(`[DEBUG InteractiveComponent] enable() after updateState, enabled=${this.enabled}`);
    this.enabled = true;
    console.log(`[DEBUG InteractiveComponent] enable() after setting enabled=true, enabled=${this.enabled}`);
    return pd;
  }

  /**
   * Disable the component from user interaction
   * Available to: DISPENSER, USER_INPUT, USER_OUTPUT, MEDIA_INPUT,
   *               MEDIA_OUTPUT, DISPLAY, BAGGAGE_SCALE, INSERTION_BELT, ANNOUNCEMENT
   */
  async disable(): Promise<PlatformData> {
    try {
      const pd = await this.withPendingCall(() => this.api.disable(this.id));
      this.updateState(pd);
      this.enabled = false;
      return pd;
    }
    catch (e: unknown) {
      // Handle OUT_OF_SEQUENCE error gracefully
      const pd = e as PlatformData;
      if (pd?.meta?.messageCode === MessageCodes.OUT_OF_SEQUENCE) {
        this.enabled = false;
        return pd;
      }
      // Re-throw other errors
      return Promise.reject(e);
    }
  }
}
