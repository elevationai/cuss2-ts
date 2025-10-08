/**
 * UserOutputComponent - Interactive components that output to users
 * Can be enabled/disabled AND can send data
 */

import { InteractiveComponent } from "./InteractiveComponent.ts";
import type { OutputCapable } from "../capabilities/ComponentCapabilities.ts";
import type { CommonUseBiometricMessage, CommonUsePaymentMessage, DataRecordList, PlatformData } from "cuss2-typescript-models";

export abstract class UserOutputComponent extends InteractiveComponent implements OutputCapable {
  /**
   * Send data to the component
   * Available to: USER_OUTPUT components
   */
  async send(dataObj: DataRecordList | CommonUseBiometricMessage | CommonUsePaymentMessage): Promise<PlatformData> {
    this.pendingCalls++;
    const pd = await this.api.send(this.id, dataObj).finally(() => this.pendingCalls--);
    this.updateState(pd);
    return pd;
  }
}
