/**
 * UnknownComponent - Fallback component for unrecognized device types
 *
 * This component is used when the CUSS2 platform reports a device type
 * that doesn't have a specific implementation. It provides the basic
 * BaseComponent functionality without any specialized methods.
 *
 * In a properly configured CUSS2 environment, this should rarely be used
 * as all standard device types have specific implementations.
 */

import { BaseComponent } from "./BaseComponent.ts";
import type { Cuss2 } from "../../cuss2.ts";
import {
  type BaggageData,
  type CommonUseBiometricMessage,
  type CommonUsePaymentMessage,
  type DataRecordList,
  type EnvironmentComponent,
  type IlluminationData,
  MessageCodes,
  type PlatformData,
  type ScreenResolution,
} from "cuss2-typescript-models";
import { DeviceType } from "../deviceType.ts";

export class UnknownComponent extends BaseComponent {
  // Add enabled property for compatibility
  override enabled: boolean = false;

  constructor(
    component: EnvironmentComponent,
    cuss2: Cuss2,
  ) {
    super(component, cuss2, DeviceType.UNKNOWN);

    console.warn(
      `Unknown component type detected: ${component.componentType}. ` +
        `Using UnknownComponent fallback. This component will have limited functionality.`,
    );
  }

  /**
   * Enable the component - provided for backward compatibility
   * UnknownComponent may or may not support enable/disable based on actual device type
   */
  async enable(): Promise<PlatformData> {
    const pd = await this.withPendingCall(() => this.api.enable(this.id));
    this.updateState(pd);
    this.enabled = true;
    return pd;
  }

  /**
   * Disable the component - provided for backward compatibility
   * UnknownComponent may or may not support disable based on actual device type
   */
  async disable(): Promise<PlatformData> {
    try {
      const pd = await this.withPendingCall(() => this.api.disable(this.id));
      this.updateState(pd);
      this.enabled = false;
      return pd;
    }
    catch (e: unknown) {
      // Handle OUT_OF_SEQUENCE error gracefully
      const pd = e as PlatformData;
      if (pd?.meta?.messageCode === MessageCodes.OUT_OF_SEQUENCE) {
        this.enabled = false;
        return pd;
      }
      // Re-throw other errors
      return Promise.reject(e);
    }
  }

  /**
   * Send data to the component - provided for backward compatibility
   * UnknownComponent accepts all data types since we don't know its actual capabilities
   */
  async send(
    dataObj:
      | DataRecordList
      | ScreenResolution
      | IlluminationData
      | BaggageData
      | CommonUsePaymentMessage
      | CommonUseBiometricMessage,
  ): Promise<PlatformData> {
    const pd = await this.withPendingCall(() => this.api.send(this.id, dataObj));
    this.updateState(pd);
    return pd;
  }
}
