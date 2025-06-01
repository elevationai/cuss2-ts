/**
 * Type extensions for cuss2-typescript-models
 *
 * These extensions add missing values to the imported types that are needed
 * by the cuss2-ts SDK but are not present in the generated models.
 */

// Import the original enums
import {
  ComponentTypes,
  CussDataTypes as _CussDataTypes,
  DeviceTypes,
  MediaTypes as _MediaTypes,
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
