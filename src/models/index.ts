// New base component hierarchy
export { BaseComponent } from "./base/BaseComponent.ts";
export { InteractiveComponent } from "./base/InteractiveComponent.ts";

// Component is an alias for UnknownComponent
export { UnknownComponent as Component } from "./base/UnknownComponent.ts";
export { DataInputComponent } from "./base/DataInputComponent.ts";
export { DataOutputComponent } from "./base/DataOutputComponent.ts";
export { UserInputComponent } from "./base/UserInputComponent.ts";
export { UserOutputComponent } from "./base/UserOutputComponent.ts";
export { MediaInputComponent } from "./base/MediaInputComponent.ts";
export { MediaOutputComponent } from "./base/MediaOutputComponent.ts";
export { BaggageScaleComponent } from "./base/BaggageScaleComponent.ts";
export { AnnouncementComponent } from "./base/AnnouncementComponent.ts";
export { DispenserComponent } from "./base/DispenserComponent.ts";
export { FeederComponent } from "./base/FeederComponent.ts";
export { UnknownComponent } from "./base/UnknownComponent.ts";

// Export capability interfaces
export type {
  AnnouncementCapable,
  DataReadCapable,
  MediaOfferCapable,
  OutputCapable,
  UserEnableCapable,
} from "./capabilities/ComponentCapabilities.ts";

// Reader components
export { BarcodeReader } from "./BarcodeReader.ts";
export { DocumentReader } from "./DocumentReader.ts";
export { CardReader } from "./CardReader.ts";
export { Scale } from "./Scale.ts";
export { RFID } from "./RFID.ts";
export { Camera } from "./Camera.ts";
export { AEASBD } from "./AEASBD.ts";
export { BHS } from "./BHS.ts";

// Printer components
export { Printer } from "./Printer.ts";
export { BagTagPrinter } from "./BagTagPrinter.ts";
export { BoardingPassPrinter } from "./BoardingPassPrinter.ts";
export { Feeder } from "./Feeder.ts";
export { Dispenser } from "./Dispenser.ts";

// Input/Output components
export { Keypad } from "./Keypad.ts";
export { Announcement } from "./Announcement.ts";
export { Illumination } from "./Illumination.ts";
export { Headset } from "./Headset.ts";
export { Biometric } from "./Biometric.ts";

// Types
export { DeviceType } from "./deviceType.ts";
export { PlatformResponseError } from "./platformResponseError.ts";

// Re-export types from the models
export type { DataRecord, EnvironmentComponent, PlatformData } from "cuss2-typescript-models";

export { ComponentState, CussDataTypes, MessageCodes, PlatformDirectives } from "cuss2-typescript-models";
