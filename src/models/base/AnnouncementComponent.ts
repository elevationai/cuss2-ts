/**
 * AnnouncementComponent - Special interactive component with audio controls
 */

import { InteractiveComponent } from "./InteractiveComponent.ts";
import type { AnnouncementCapable } from "../capabilities/ComponentCapabilities.ts";
import type { PlatformData } from "cuss2-typescript-models";

export class AnnouncementComponent extends InteractiveComponent implements AnnouncementCapable {
  /**
   * Play SSML formatted audio
   */
  async play(xml: string): Promise<PlatformData> {
    this.pendingCalls++;
    return await this.api.announcement.play(this.id, xml).finally(() => this.pendingCalls--);
  }

  /**
   * Pause current playback
   */
  async pause(): Promise<PlatformData> {
    this.pendingCalls++;
    return await this.api.announcement.pause(this.id).finally(() => this.pendingCalls--);
  }

  /**
   * Resume paused playback
   */
  async resume(): Promise<PlatformData> {
    this.pendingCalls++;
    return await this.api.announcement.resume(this.id).finally(() => this.pendingCalls--);
  }

  /**
   * Stop current playback
   */
  async stop(): Promise<PlatformData> {
    this.pendingCalls++;
    return await this.api.announcement.stop(this.id).finally(() => this.pendingCalls--);
  }

  /**
   * Convenience method for text-to-speech
   */
  say(text: string, lang: string = "en-US"): Promise<PlatformData> {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis"
             xml:lang="${lang}">${text}</speak>`;
    return this.play(xml);
  }
}
