/**
 * MediaOutputComponent - Interactive components for media/document output
 * Can be enabled/disabled AND can send data
 * Base for: Printers (BoardingPass, BagTag, GeneralPurpose)
 */

import { InteractiveComponent } from "./InteractiveComponent.ts";
import type { OutputCapable } from "../capabilities/ComponentCapabilities.ts";
import type { DataRecordList, PlatformData } from "cuss2-typescript-models";

export abstract class MediaOutputComponent extends InteractiveComponent implements OutputCapable {
  /**
   * Send data to the component (print jobs, etc.)
   * Available to: MEDIA_OUTPUT components
   */
  async send(dataObj: DataRecordList): Promise<PlatformData> {
    this.pendingCalls++;
    const pd = await this.api.send(this.id, dataObj).finally(() => this.pendingCalls--);
    this.updateState(pd);
    return pd;
  }
}
