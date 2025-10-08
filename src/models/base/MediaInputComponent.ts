/**
 * MediaInputComponent - Interactive components for media/document input
 * Can be enabled/disabled but cannot send data
 * Base for: BarcodeReader, DocumentReader, CardReader, Camera, RFID
 */

import { InteractiveComponent } from "./InteractiveComponent.ts";
import type { DataReadCapable } from "../capabilities/ComponentCapabilities.ts";
import { type DataRecord, MessageCodes, type PlatformData } from "cuss2-typescript-models";

export abstract class MediaInputComponent extends InteractiveComponent implements DataReadCapable {
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
   * Convenience method to read data with timeout
   */
  async read(ms: number = 30000): Promise<string[]> {
    await this.enable();

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
    }).finally(() => this.disable());
  }
}
