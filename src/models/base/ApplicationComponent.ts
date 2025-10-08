/**
 * ApplicationComponent - Represents CUSS applications
 * Only has query() method - no cancel, setup, or other operations
 */

import { BaseComponent } from "./BaseComponent.ts";
import type { DataRecordList, PlatformData } from "cuss2-typescript-models";

export class ApplicationComponent extends BaseComponent {
  /**
   * ApplicationComponent cannot be cancelled
   * @throws Error always
   */
  override cancel(): Promise<PlatformData> {
    return Promise.reject(new Error("ApplicationComponent does not support cancel operation"));
  }

  /**
   * ApplicationComponent cannot be setup
   * @throws Error always
   */
  override setup(_dataObj: DataRecordList): Promise<PlatformData> {
    return Promise.reject(new Error("ApplicationComponent does not support setup operation"));
  }
}
