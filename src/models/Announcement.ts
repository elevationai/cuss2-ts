import { Component } from "./Component.ts";
import type { PlatformData } from "cuss2-typescript-models";

export class Announcement extends Component {
  say(text: string, lang: string = "en-US"): Promise<PlatformData> {
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?><speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">${text}</speak>`;
    return this.play(xml);
  }

  play(xml: string): Promise<PlatformData> {
    return this.api.announcement.play(this.id, xml);
  }

  stop(): Promise<PlatformData> {
    return this.api.announcement.stop(this.id);
  }

  pause(): Promise<PlatformData> {
    return this.api.announcement.pause(this.id);
  }

  resume(): Promise<PlatformData> {
    return this.api.announcement.resume(this.id);
  }
}
