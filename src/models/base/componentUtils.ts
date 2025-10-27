/**
 * Shared utility functions for component implementations
 * These utilities help DRY up common patterns across component classes
 */

import type {
  BaggageData,
  CommonUseBiometricMessage,
  CommonUsePaymentMessage,
  DataRecordList,
  IlluminationData,
  PlatformData,
  ScreenResolution,
} from "cuss2-typescript-models";

// Type for all possible send data types
type SendDataTypes =
  | DataRecordList
  | BaggageData
  | CommonUseBiometricMessage
  | CommonUsePaymentMessage
  | IlluminationData
  | ScreenResolution;

/**
 * Shared implementation for the send() method used by output components
 * This pattern is used by DataOutputComponent, MediaOutputComponent, and UserOutputComponent
 *
 * Note: This is designed to be called from within the component classes themselves,
 * where they have access to their own protected methods.
 *
 * @param component - The component instance (must have withPendingCall, api, id, and updateState)
 * @param dataObj - The data to send (type varies by component)
 * @returns Promise with the platform response
 */
export async function executeSend<T extends SendDataTypes>(
  component: {
    readonly id: number;
    readonly api: {
      send(id: number, dataObj: SendDataTypes): Promise<PlatformData>;
    };
    updateState(pd: PlatformData): void;
  },
  dataObj: T,
  withPendingCall: <R extends PlatformData>(apiCall: () => Promise<R>) => Promise<R>,
): Promise<PlatformData> {
  const pd = await withPendingCall(() => component.api.send(component.id, dataObj));
  component.updateState(pd);
  return pd;
}
