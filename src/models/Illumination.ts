import { DataOutputComponent } from "./base/DataOutputComponent.ts";
import { DeviceType } from "./deviceType.ts";
import type { Cuss2 } from "../cuss2.ts";
import type { EnvironmentComponent, IlluminationData, PlatformData } from "cuss2-typescript-models";

// Define enum for light colors
enum LightColorNameEnum {
  Red = "red",
  Green = "green",
  Blue = "blue",
  Yellow = "yellow",
  White = "white",
}

export class Illumination extends DataOutputComponent {
  constructor(component: EnvironmentComponent, cuss2: Cuss2) {
    super(component, cuss2, DeviceType.ILLUMINATION);
  }

  /**
   * Convenience method to control the illumination
   * Note: Illumination is DATA_OUTPUT - no enable/disable per CUSS spec
   */
  async illuminate(
    duration: number = 0,
    color?: string | number[],
    blink?: number[],
  ): Promise<PlatformData> {
    const name = (typeof color === "string") ? LightColorNameEnum[color as keyof typeof LightColorNameEnum] || undefined : undefined;
    const rgb = (Array.isArray(color) && color.length === 3) ? { red: color[0], green: color[1], blue: color[2] } : undefined;
    const blinkRate = (Array.isArray(blink) && blink.length === 2) ? { durationOn: blink[0], durationOff: blink[1] } : undefined;

    const illuminationData = {
      duration,
      lightColor: { name, rgb },
      blinkRate,
    } as IlluminationData;

    // Send as DataRecordList
    const dataRecords = [{
      data: JSON.stringify(illuminationData),
      dsTypes: ["DS_TYPES_DATASTRUCTURE" as unknown as never],
    }];

    return await this.send(dataRecords);
  }

  /**
   * Turn off illumination
   */
  async turnOff(): Promise<PlatformData> {
    return await this.illuminate(0);
  }
}
