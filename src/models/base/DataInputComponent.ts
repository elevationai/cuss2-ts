/**
 * DataInputComponent - Non-interactive components that receive data
 * No enable/disable, cannot send data, but can receive/read data
 */

import { BaseComponent } from "./BaseComponent.ts";
import type { DataReadCapable } from "../capabilities/ComponentCapabilities.ts";
import { type DataRecord, MessageCodes, type PlatformData } from "cuss2-typescript-models";

export abstract class DataInputComponent extends BaseComponent implements DataReadCapable {
  previousData: DataRecord[] = [];

  override handleMessage(data: PlatformData) {
    super.handleMessage(data);
    if (
      data?.meta?.messageCode === MessageCodes.DATA_PRESENT &&
      data?.payload?.dataRecords?.length
    ) {
      this.previousData = data.payload.dataRecords;
      this.emit("data", this.previousData);
    }
  }

  /**
   * Read data with timeout (no enable/disable for data components)
   */
  read(ms: number = 30000): Promise<DataRecord[]> {
    return new Promise<DataRecord[]>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off("data", dataHandler);
        reject(new Error(`Timeout of ${ms}ms exceeded`));
      }, ms);

      const dataHandler = (data: DataRecord[]): void => {
        clearTimeout(timeoutId);
        resolve(data);
      };

      this.once("data", dataHandler);
    });
  }
}
