import { EventEmitter } from "events";
import {
  type ApplicationData,
  type ApplicationDataMeta,
  type ApplicationDataPayload,
  type ApplicationState,
  type ApplicationTransfer,
  type BaggageData,
  type CommonUseBiometricMessage,
  type CommonUsePaymentMessage,
  type DataRecordList,
  type IlluminationData,
  MessageCodes,
  PlatformDirectives,
  type ScreenResolution,
} from "cuss2-typescript-models";

export class LogMessage {
  action: string;
  data: unknown;
  level: string;

  constructor(level: string, action: string, data: unknown) {
    this.action = action;
    this.level = level;
    this.data = data;
  }
}

export const logger: EventEmitter = new EventEmitter();
export const log = (level: string, action: string, data?: unknown): void => {
  logger.emit("log", new LogMessage(level, action, data));
};

export const helpers = {
  splitAndFilter: (text: string, delimiter1 = "#"): string[] => {
    return text.split(delimiter1).filter((p) => !!p);
  },
  split_every: (text: string, n: number): string[] => {
    if (!text) return [];
    return text.match(new RegExp(".{1," + n + "}", "g")) as string[];
  },
  deserializeDictionary: (
    text: string,
    delimiter1 = "#",
    delimiter2 = "=",
  ): Record<string, string> => {
    const out: Record<string, string> = {};
    helpers.splitAndFilter(text, delimiter1).forEach((p) => {
      const [k, v] = p.split(delimiter2);
      if (v && k) out[k] = v;
    });
    return out;
  },
  isNonCritical: (messageCode: MessageCodes): boolean => {
    return !criticalErrors.some((s): boolean => s === messageCode);
  },
};

const criticalErrors = [
  MessageCodes.CANCELLED,
  MessageCodes.WRONG_APPLICATION_STATE,
  MessageCodes.OUT_OF_SEQUENCE,
  MessageCodes.TIMEOUT,
  MessageCodes.SESSION_TIMEOUT,
  MessageCodes.KILL_TIMEOUT,
  MessageCodes.SOFTWARE_ERROR,
  MessageCodes.CRITICAL_SOFTWARE_ERROR,
  MessageCodes.FORMAT_ERROR,
  MessageCodes.LENGTH_ERROR,
  MessageCodes.DATA_MISSING,
  MessageCodes.THRESHOLD_ERROR,
  MessageCodes.THRESHOLD_USAGE,
  MessageCodes.HARDWARE_ERROR,
  MessageCodes.NOT_REACHABLE,
  MessageCodes.NOT_RESPONDING,
  MessageCodes.BAGGAGE_FULL,
  MessageCodes.BAGGAGE_UNDETECTED,
  MessageCodes.BAGGAGE_OVERSIZED,
  MessageCodes.BAGGAGE_TOO_MANY_BAGS,
  MessageCodes.BAGGAGE_UNEXPECTED_BAG,
  MessageCodes.BAGGAGE_TOO_HIGH,
  MessageCodes.BAGGAGE_TOO_LONG,
  MessageCodes.BAGGAGE_TOO_FLAT,
  MessageCodes.BAGGAGE_TOO_SHORT,
  MessageCodes.BAGGAGE_INVALID_DATA,
  MessageCodes.BAGGAGE_WEIGHT_OUT_OF_RANGE,
  MessageCodes.BAGGAGE_JAMMED,
  MessageCodes.BAGGAGE_EMERGENCY_STOP,
  MessageCodes.BAGGAGE_RESTLESS,
  MessageCodes.BAGGAGE_TRANSPORT_BUSY,
  MessageCodes.BAGGAGE_MISTRACKED,
  MessageCodes.BAGGAGE_UNEXPECTED_CHANGE,
  MessageCodes.BAGGAGE_INTERFERENCE_USER,
  MessageCodes.BAGGAGE_INTRUSION_SAFETY,
  MessageCodes.BAGGAGE_NOT_CONVEYABLE,
  MessageCodes.BAGGAGE_IRREGULAR_BAG,
  MessageCodes.BAGGAGE_VOLUME_NOT_DETERMINABLE,
  MessageCodes.BAGGAGE_OVERFLOW_TUB,
];

const isDataRecord = (dataRecordObject: unknown): dataRecordObject is DataRecordList => {
  return Array.isArray(dataRecordObject) && dataRecordObject.length > 0 && "data" in dataRecordObject[0];
};

interface BuildOptions {
  componentID?: number;
  deviceID?: string;
  dataObj?:
    | ApplicationState
    | ApplicationTransfer
    | DataRecordList
    | ScreenResolution
    | IlluminationData
    | BaggageData
    | CommonUsePaymentMessage
    | CommonUseBiometricMessage;
}

export const Build = {
  applicationData: (
    directive: PlatformDirectives,
    options: BuildOptions = {},
  ): ApplicationData => {
    const {
      componentID,
      deviceID = "00000000-0000-0000-0000-000000000000",
      dataObj,
    } = options;
    const meta = {} as ApplicationDataMeta;
    // Use crypto.randomUUID if available, otherwise fallback to a polyfill
    meta.requestID = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
    meta.directive = directive;
    // Only set componentID if it's defined
    if (componentID) {
      meta.componentID = componentID;
    }
    meta.deviceID = deviceID;

    const payload: ApplicationDataPayload = {};

    if (dataObj && "applicationStateCode" in dataObj) {
      payload.applicationState = dataObj;
    }

    if (dataObj && "targetApplicationID" in dataObj) {
      payload.applicationTransfer = dataObj;
    }

    if (isDataRecord(dataObj)) {
      payload.dataRecords = dataObj;
    }

    if (dataObj && "vertical" in dataObj) {
      payload.screenResolution = dataObj;
    }

    if (dataObj && "lightColor" in dataObj) {
      payload.illuminationData = dataObj;
    }

    if (dataObj && "baggageMeasurements" in dataObj) {
      payload.bagdropData = dataObj;
    }

    if (dataObj && "ePaymentMessage" in dataObj) {
      payload.paymentData = dataObj;
    }

    if (dataObj && "biometricProviderMessage" in dataObj) {
      payload.biometricData = dataObj;
    }

    return { meta, payload } as ApplicationData;
  },

  stateChange: (
    desiredState: string | number,
    reasonCode: string | number,
    reason: string,
    brand: string | undefined = undefined,
  ): ApplicationData => {
    return Build.applicationData(
      PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST,
      {
        dataObj: {
          applicationStateCode: desiredState,
          applicationStateChangeReasonCode: reasonCode,
          applicationStateChangeReason: reason,
          applicationBrand: brand,
        } as ApplicationState,
      },
    );
  },
};
