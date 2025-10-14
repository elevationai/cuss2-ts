/**
 * DispenserComponent - Can be enabled/disabled and offer media
 */

import { InteractiveComponent } from "./InteractiveComponent.ts";
import type { MediaOfferCapable } from "../capabilities/ComponentCapabilities.ts";
import { MessageCodes, type PlatformData } from "cuss2-typescript-models";

export class DispenserComponent extends InteractiveComponent implements MediaOfferCapable {
  protected _mediaPresent: boolean = false;

  get mediaPresent(): boolean {
    return this._mediaPresent;
  }

  protected set mediaPresent(value: boolean) {
    this._mediaPresent = value;
  }

  override handleMessage(data: PlatformData) {
    super.handleMessage(data);
    if (data?.meta?.messageCode === MessageCodes.MEDIA_PRESENT) {
      this._mediaPresent = true;
      this.emit("mediaPresent", true);
    }
    else if (data?.meta?.messageCode === MessageCodes.MEDIA_EMPTY) {
      this._mediaPresent = false;
      this.emit("mediaPresent", false);
    }
  }

  /**
   * Offer document to user
   */
  async offer(): Promise<PlatformData> {
    const pd = await this.withPendingCall(() => this.api.offer(this.id));
    if (pd?.meta?.messageCode === MessageCodes.OK) {
      this._mediaPresent = false;
    }
    return pd;
  }
}
