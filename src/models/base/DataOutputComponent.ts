/**
 * DataOutputComponent - Non-interactive components that can send data
 * No enable/disable, but can send data
 */

import { BaseComponent } from "./BaseComponent.ts";
import type { OutputCapable } from "../capabilities/ComponentCapabilities.ts";
import type { DataRecordList, PlatformData } from "cuss2-typescript-models";

export abstract class DataOutputComponent extends BaseComponent implements OutputCapable {
  /**
   * Send data to the component
   * Available to: DATA_OUTPUT components
   */
  async send(dataObj: DataRecordList): Promise<PlatformData> {
    this.pendingCalls++;
    const pd = await this.api.send(this.id, dataObj).finally(() => this.pendingCalls--);
    this.updateState(pd);
    return pd;
  }
}
