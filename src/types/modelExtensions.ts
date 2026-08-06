/**
 * Type extensions for cuss2-typescript-models
 *
 * These extensions add missing values to the imported types that are needed
 * by the cuss2-ts SDK but are not present in the generated models.
 */

// Import the original enums
import { ComponentTypes, CussDataTypes as _CussDataTypes, DeviceTypes, MediaTypes as _MediaTypes } from "cuss2-typescript-models";
import type {
  ComponentState as _ComponentState,
  MessageCodes as _MessageCodes,
  PlatformData as _PlatformData,
} from "cuss2-typescript-models";

// Re-export other imports
export type {
  ApplicationActivation,
  ComponentCharacteristics,
  ComponentState,
  EnvironmentComponent,
  MessageCodes,
  PlatformData,
} from "cuss2-typescript-models";

// Re-export unchanged enums
export { ComponentTypes, DeviceTypes };

// Allow any string to be used
export type MediaTypes = _MediaTypes | string;
export type CussDataTypes = _CussDataTypes | string;

// Re-export the enum values under the same name using namespace merging
export const MediaTypes = _MediaTypes;
export const CussDataTypes = _CussDataTypes;

/**
 * Nested component-state object the newer `bridge2to1` platform sends on `meta`.
 *
 * That bridge relocated a component's LIVE status out of `meta.messageCode` (which it now pins to
 * `"OK"`) into here — `currentComponentState.status` is the real code (e.g. `MEDIA_EMPTY`). The
 * legacy bridge still deployed at the airports does NOT send this object, so its mere PRESENCE is
 * the signal that the status has moved. It is not part of `cuss2-typescript-models@2.0.1`, so it is
 * declared here rather than bumping the pinned models package.
 */
export interface CurrentComponentState {
  componentState?: _ComponentState;
  status?: _MessageCodes;
  enabled?: boolean;
}

/** `PlatformData["meta"]` widened with the optional `currentComponentState` the new bridge adds. */
export type PlatformDataMetaWithCurrent = _PlatformData["meta"] & {
  currentComponentState?: CurrentComponentState;
};
