import {
  type ComponentCharacteristics,
  ComponentTypes,
  CussDataTypes,
  DeviceTypes,
  type EnvironmentComponent,
  MediaTypes,
} from "./types/modelExtensions.ts";

const dsTypesHas = (charac0: ComponentCharacteristics, type: CussDataTypes) => {
  return (charac0?.dsTypesList as Array<CussDataTypes>)?.find((d) => d === type);
};
const mediaTypesHas = (mediaTypes: MediaTypes[], type: MediaTypes) => {
  return mediaTypes?.find((m) => m === type);
};

const deviceTypesHas = (
  deviceTypes: DeviceTypes[] | undefined,
  type: DeviceTypes,
) => {
  return deviceTypes?.find((m) => m === type);
};

export class ComponentInterrogation {
  static isAnnouncement = (component: EnvironmentComponent): boolean => {
    return component.componentType === ComponentTypes.ANNOUNCEMENT;
  };

  static isFeeder = (component: EnvironmentComponent): boolean => {
    return component.componentType === ComponentTypes.FEEDER;
  };

  static isDispenser = (component: EnvironmentComponent): boolean => {
    return component.componentType === ComponentTypes.DISPENSER;
  };

  static isBagTagPrinter = (component: EnvironmentComponent): boolean => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    const mediaTypes = charac0.mediaTypesList;
    return !!deviceTypesHas(charac0.deviceTypesList, DeviceTypes.PRINT) &&
      !!mediaTypesHas(mediaTypes, MediaTypes.BAGGAGETAG);
  };

  static isBoardingPassPrinter = (component: EnvironmentComponent): boolean => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    const mediaTypes = charac0.mediaTypesList;
    return !!deviceTypesHas(charac0.deviceTypesList, DeviceTypes.PRINT) &&
      !!mediaTypesHas(mediaTypes, MediaTypes.BOARDINGPASS);
  };

  static isDocumentReader = (component: EnvironmentComponent): boolean => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    const mediaTypes = charac0.mediaTypesList;
    return !!mediaTypesHas(mediaTypes, MediaTypes.PASSPORT);
  };

  static isBarcodeReader = (component: EnvironmentComponent): boolean => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    return !!dsTypesHas(charac0, CussDataTypes.DS_TYPES_BARCODE);
  };

  static isCardReader = (component: EnvironmentComponent): boolean => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    const mediaTypes = charac0.mediaTypesList;
    return !!mediaTypesHas(mediaTypes, "MAGCARD");
  };

  static isKeypad = (component: EnvironmentComponent): boolean => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    return !!dsTypesHas(charac0, CussDataTypes.DS_TYPES_KEY) ||
      !!dsTypesHas(charac0, CussDataTypes.DS_TYPES_KEY_UP) ||
      !!dsTypesHas(charac0, CussDataTypes.DS_TYPES_KEY_DOWN);
  };

  static isIllumination = (component: EnvironmentComponent): boolean => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    return !!deviceTypesHas(charac0.deviceTypesList, DeviceTypes.ILLUMINATION);
  };

  static isHeadset = (component: EnvironmentComponent): boolean => {
    // Headset can be MEDIA_INPUT, USER_OUTPUT, or DATA_OUTPUT (platform variance)
    // Identify by characteristics: ASSISTIVE device type + AUDIO media type
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    const mediaTypes = charac0.mediaTypesList;

    // Must have both ASSISTIVE device type and AUDIO media type
    const hasAssistive = deviceTypesHas(charac0.deviceTypesList, DeviceTypes.ASSISTIVE);
    const hasAudio = mediaTypesHas(mediaTypes, MediaTypes.AUDIO);

    if (!hasAssistive || !hasAudio) return false;

    // Exclude Announcement components (they also have ASSISTIVE + AUDIO)
    if (component.componentType === ComponentTypes.ANNOUNCEMENT) return false;

    return true;
  };

  static isScale = (component: EnvironmentComponent): boolean => {
    if (component.componentType !== ComponentTypes.DATA_INPUT) return false;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    return !!deviceTypesHas(charac0.deviceTypesList, DeviceTypes.SCALE);
  };
  static isBiometric = (component: EnvironmentComponent): boolean => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    return !!dsTypesHas(charac0, CussDataTypes.DS_TYPES_BIOMETRIC);
  };
  static isCamera = (component: EnvironmentComponent): boolean => {
    if (component.componentType !== ComponentTypes.DATA_INPUT) return false;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    const mediaTypes = charac0.mediaTypesList;
    return !!deviceTypesHas(charac0.deviceTypesList, DeviceTypes.CAMERA) &&
      !!mediaTypesHas(mediaTypes, MediaTypes.IMAGE);
  };

  static isRFIDReader = (component: EnvironmentComponent): boolean => {
    if (component.componentType !== ComponentTypes.DATA_INPUT) return false;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    const mediaTypes = charac0.mediaTypesList;
    return !!deviceTypesHas(charac0.deviceTypesList, DeviceTypes.CONTACTLESS) &&
      !!mediaTypesHas(mediaTypes, MediaTypes.RFID);
  };

  static isAEASBD = (component: EnvironmentComponent): boolean => {
    if (component.componentType !== ComponentTypes.USER_OUTPUT) return false;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    return !!dsTypesHas(charac0, "SBDAEA");
  };

  static isBHS = (component: EnvironmentComponent): boolean => {
    if (component.componentType !== ComponentTypes.DATA_OUTPUT) return false;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return false;
    return !!dsTypesHas(charac0, CussDataTypes.DS_TYPES_RP1745);
  };
}
