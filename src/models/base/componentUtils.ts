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
  MessageCodes,
  PlatformData,
  ScreenResolution,
} from "cuss2-typescript-models";
import type { PlatformDataMetaWithCurrent } from "../../types/modelExtensions.ts";

/**
 * Resolve a component's authoritative status code from a platform message.
 *
 * The newer `bridge2to1` platform moved the live component status out of `meta.messageCode` (which
 * it now pins to `"OK"`) and into `meta.currentComponentState.status`. When that object is present
 * we trust it exclusively — `messageCode` is no longer meaningful there. When it is ABSENT (the
 * legacy bridge still running at the airports) we fall back to `meta.messageCode`, so component
 * status tracking is byte-for-byte unchanged against the old bridge and any other consumer.
 *
 * This is the single seam through which BOTH `stateIsDifferent` (change detection) and
 * `updateState` (assignment) read status, so the two can never disagree about the source field.
 */
export function resolveStatusCode(meta: PlatformData["meta"]): MessageCodes | undefined {
  const current = (meta as PlatformDataMetaWithCurrent).currentComponentState;
  if (current) return current.status;
  return meta.messageCode;
}

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
