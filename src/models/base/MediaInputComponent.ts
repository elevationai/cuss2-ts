/**
 * MediaInputComponent - Interactive components for media/document input
 * Can be enabled/disabled but cannot send data
 * Base for: BarcodeReader, DocumentReader, CardReader, Camera, RFID
 */

import { InteractiveComponent } from "./InteractiveComponent.ts";
import type { DataReadCapable } from "../capabilities/ComponentCapabilities.ts";
import { type DataRecord, MessageCodes, type PlatformData } from "cuss2-typescript-models";

export abstract class MediaInputComponent extends InteractiveComponent implements DataReadCapable {
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
   * Convenience method to read data with timeout
   */
  async read(ms: number = 30000): Promise<DataRecord[]> {
    await this.enable();

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
    }).finally(() => this.disable());
  }
}
