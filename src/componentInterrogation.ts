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
  static isAnnouncement = (component: EnvironmentComponent) => {
    return component.componentType === ComponentTypes.ANNOUNCEMENT;
  };

  static isFeeder = (component: EnvironmentComponent) => {
    return component.componentType === ComponentTypes.FEEDER;
  };

  static isDispenser = (component: EnvironmentComponent) => {
    return component.componentType === ComponentTypes.DISPENSER;
  };

  static isBagTagPrinter = (component: EnvironmentComponent) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return;
    const mediaTypes = charac0.mediaTypesList;
    return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.PRINT) &&
      mediaTypesHas(mediaTypes, MediaTypes.BAGGAGETAG);
  };

  static isBoardingPassPrinter = (component: EnvironmentComponent) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return;
    const mediaTypes = charac0.mediaTypesList;
    return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.PRINT) &&
      mediaTypesHas(mediaTypes, MediaTypes.BOARDINGPASS);
  };

  static isDocumentReader = (component: EnvironmentComponent) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return;
    const mediaTypes = charac0.mediaTypesList;
    return mediaTypesHas(mediaTypes, MediaTypes.PASSPORT);
  };

  static isBarcodeReader = (component: EnvironmentComponent) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return;
    return dsTypesHas(charac0, CussDataTypes.DS_TYPES_BARCODE);
  };

  static isCardReader = (component: EnvironmentComponent) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return;
    const mediaTypes = charac0.mediaTypesList;
    return mediaTypesHas(mediaTypes, "MAGCARD");
  };

  static isKeypad = (component: EnvironmentComponent) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return;
    return dsTypesHas(charac0, CussDataTypes.DS_TYPES_KEY) ||
      dsTypesHas(charac0, CussDataTypes.DS_TYPES_KEY_UP) ||
      dsTypesHas(charac0, CussDataTypes.DS_TYPES_KEY_DOWN);
  };

  static isIllumination = (component: EnvironmentComponent) => {
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return;
    return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.ILLUMINATION);
  };

  static isHeadset = (component: EnvironmentComponent) => {
    if (component.componentType !== ComponentTypes.USER_INPUT) return;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return;
    const mediaTypes = charac0.mediaTypesList;
    return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.ASSISTIVE) &&
      mediaTypesHas(mediaTypes, MediaTypes.AUDIO);
  };

  static isScale = (component: EnvironmentComponent) => {
    if (component.componentType !== ComponentTypes.DATA_INPUT) return;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return;
    return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.SCALE);
  };
  static isBiometric = (component: EnvironmentComponent) => {
    //return component.componentDescription === 'Face Reader';
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return;
    return dsTypesHas(charac0, CussDataTypes.DS_TYPES_BIOMETRIC);
  };
  static isCamera = (component: EnvironmentComponent) => {
    if (component.componentType !== ComponentTypes.DATA_INPUT) return;
    const charac0 = component.componentCharacteristics?.[0];
    if (!charac0) return;
    const mediaTypes = charac0.mediaTypesList;
    return deviceTypesHas(charac0.deviceTypesList, DeviceTypes.CAMERA) &&
      mediaTypesHas(mediaTypes, MediaTypes.IMAGE);
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
