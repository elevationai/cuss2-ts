/**
 * CUSS2 Component Capability Interfaces
 * Based on CUSS Virtual Component Concept specification
 */

import type {
  BaggageData,
  CommonUseBiometricMessage,
  CommonUsePaymentMessage,
  DataRecord,
  DataRecordList,
  IlluminationData,
  PlatformData,
} from "cuss2-typescript-models";

/**
 * Components that can send data to the platform
 * Available to: DATA_OUTPUT, USER_OUTPUT, MEDIA_OUTPUT,
 *               INSERTION_BELT, VERIFICATION_BELT, PARKING_BELT
 */
export interface OutputCapable {
  send(
    dataObj: DataRecordList | BaggageData | CommonUseBiometricMessage | CommonUsePaymentMessage | IlluminationData,
  ): Promise<PlatformData>;
}

/**
 * Components that can offer media/documents
 * Available to: DISPENSER, FEEDER, INSERTION_BELT
 */
export interface MediaOfferCapable {
  offer(): Promise<PlatformData>;
}

/**
 * Components that can be enabled/disabled for user interaction
 * Available to: DISPENSER, USER_INPUT, USER_OUTPUT, MEDIA_INPUT,
 *               MEDIA_OUTPUT, DISPLAY, BAGGAGE_SCALE, INSERTION_BELT, ANNOUNCEMENT
 */
export interface UserEnableCapable {
  enable(): Promise<PlatformData>;
  disable(): Promise<PlatformData>;
}

/**
 * Conveyor belt specific operations
 * Available to: INSERTION_BELT, VERIFICATION_BELT, PARKING_BELT
 */
export interface ConveyorCapable {
  forward(): Promise<PlatformData>;
  backward(): Promise<PlatformData>;
  process(): Promise<PlatformData>;
}

/**
 * Announcement specific operations
 * Available to: ANNOUNCEMENT components only
 */
export interface AnnouncementCapable {
  play(xml: string): Promise<PlatformData>;
  pause(): Promise<PlatformData>;
  resume(): Promise<PlatformData>;
  stop(): Promise<PlatformData>;
}

/**
 * Data reading capability for input devices
 * Convenience interface for devices that capture data
 */
export interface DataReadCapable {
  read(ms?: number): Promise<DataRecord[]>;
}
