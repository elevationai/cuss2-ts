/**
 * DataInputComponent - Non-interactive components that receive data
 * No enable/disable, cannot send data, but can receive/read data
 */

import { BaseComponent } from "./BaseComponent.ts";
import type { DataReadCapable } from "../capabilities/ComponentCapabilities.ts";
import { type DataRecord, MessageCodes, type PlatformData } from "cuss2-typescript-models";

export abstract class DataInputComponent extends BaseComponent implements DataReadCapable {
  previousData: string[] = [];

  override handleMessage(data: PlatformData) {
    super.handleMessage(data);
    if (
      data?.meta?.messageCode === MessageCodes.DATA_PRESENT &&
      data?.payload?.dataRecords?.length
    ) {
      this.previousData = data?.payload?.dataRecords?.map((dr: DataRecord) => dr?.data || "") as string[];
      this.emit("data", this.previousData);
    }
  }

  /**
   * Read data with timeout (no enable/disable for data components)
   */
  read(ms: number = 30000): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off("data", dataHandler);
        reject(new Error(`Timeout of ${ms}ms exceeded`));
      }, ms);

      const dataHandler = (data: string[]): void => {
        clearTimeout(timeoutId);
        resolve(data);
      };

      this.once("data", dataHandler);
    });
  }
}
