import { Build, log } from "./helper.ts";
import { EventEmitter } from "./models/EventEmitter.ts";

import { Connection } from "./connection.ts";
import { StateChange } from "./models/stateChange.ts";
import { ComponentInterrogation } from "./componentInterrogation.ts";
import {
  AEASBD,
  Announcement,
  BagTagPrinter,
  BarcodeReader,
  type BaseComponent,
  BHS,
  Biometric,
  BoardingPassPrinter,
  Camera,
  CardReader,
  Dispenser,
  DocumentReader,
  Feeder,
  Headset,
  Illumination,
  type InteractiveComponent,
  Keypad,
  RFID,
  Scale,
} from "./models/index.ts";
import { UnknownComponent } from "./models/base/UnknownComponent.ts";

import {
  ApplicationStateChangeReasonCodes as ChangeReason,
  ApplicationStateCodes as AppState,
  type BaggageData,
  type CommonUseBiometricMessage,
  type CommonUsePaymentMessage,
  type ComponentList,
  CussDataTypes,
  type DataRecordList,
  type EnvironmentLevel,
  type IlluminationData,
  MessageCodes,
  type PlatformData,
  PlatformDirectives,
  type ScreenResolution,
} from "cuss2-typescript-models";
import type { ComponentAPI } from "./cuss2/ComponentAPI.ts";

const {
  isAnnouncement,
  isFeeder,
  isDispenser,
  isBagTagPrinter,
  isBoardingPassPrinter,
  isDocumentReader,
  isBarcodeReader,
  isCardReader,
  isBiometric,
  isKeypad,
  isIllumination,
  isHeadset,
  isScale,
  isCamera,
  isRFIDReader,
  isAEASBD,
  isBHS,
} = ComponentInterrogation;

function validateComponentId(componentID: unknown) {
  if (typeof componentID !== "number") {
    throw new TypeError("Invalid componentID: " + componentID);
  }
}

export class Cuss2 extends EventEmitter {
  connection: Connection;
  environment: EnvironmentLevel = {} as EnvironmentLevel;
  components: Record<string, BaseComponent> | undefined = undefined;

  // State management
  private _currentState: StateChange = new StateChange(AppState.STOPPED, AppState.STOPPED);
  /**
   * How much gold the party starts with.
   */
  bagTagPrinter?: BagTagPrinter;
  boardingPassPrinter?: BoardingPassPrinter;
  documentReader?: DocumentReader;
  barcodeReader?: BarcodeReader;
  illumination?: Illumination;
  announcement?: Announcement;
  keypad?: Keypad;
  cardReader?: CardReader;
  biometric?: Biometric;
  scale?: Scale;
  rfid?: RFID;
  headset?: Headset;
  camera?: Camera;
  bhs?: BHS;
  aeasbd?: AEASBD;

  pendingStateChange?: AppState;
  multiTenant?: boolean;
  accessibleMode: boolean = false;
  language?: string;

  get state(): AppState {
    return this._currentState.current;
  }

  get connected(): Promise<unknown> {
    if (this.connection.isOpen && this.components) {
      return Promise.resolve();
    }
    return this.waitFor("connected", ["connection.authenticationError", "connection.close"]);
  }

  private constructor(connection: Connection) {
    super();
    this.connection = connection;

    // Increase max listeners to handle many components
    // Each component adds a listener for messages and deactivation
    this.setMaxListeners(100);

    // Subscribe to messages from the connection
    connection.on("message", (e) => this._handleWebSocketMessage(e));
    connection.on("open", () => {
      this._initialize().catch((e) => {
        log("error", "Initialization failed", e);
        connection.emit("error", new Error("Initialization failed: " + e.message));
      });
    });
  }

  static connect(
    client_id: string,
    client_secret: string,
    wss: string = "https://localhost:22222",
    deviceID: string = "00000000-0000-0000-0000-000000000000",
    tokenURL?: string,
  ): Cuss2 {
    using connection = Connection.connect(wss, client_id, client_secret, deviceID, tokenURL);
    return new Cuss2(connection);
  }

  private _ensureConnected(): void {
    if (!this.connection.isOpen) {
      throw new Error("Connection not established. Please await cuss2.connected before making API calls.");
    }
  }

  private async _initialize(): Promise<undefined> {
    log("info", "Getting Environment Information");
    const environment = await this.api.getEnvironment();

    // hydrate device id if none provided
    const deviceID = this.connection.deviceID;
    if (deviceID === "00000000-0000-0000-0000-000000000000" || deviceID === null) {
      this.connection.deviceID = environment.deviceID;
    }
    if (!this.state) {
      throw new Error("Platform in abnormal state.");
    }

    if (this.state === AppState.SUSPENDED || this.state === AppState.DISABLED) {
      throw new Error(`Platform has ${this.state} the application`);
    }

    log("info", "Getting Component List");
    await this.api.getComponents();
    await this.queryComponents().catch((e) => {
      log("error", "error querying components", e);
      super.emit("queryError", e);
    });
    this.emit("connected", this);
  }

  private async _handleWebSocketMessage(platformData: PlatformData) {
    if (!platformData) return;
    const { meta, payload } = platformData;

    log("verbose", "[event.currentApplicationState]", meta.currentApplicationState);

    const unsolicited = !meta.platformDirective;
    const currentState: AppState = meta.currentApplicationState.applicationStateCode;

    if (meta.messageCode === MessageCodes.SESSION_TIMEOUT) {
      super.emit("sessionTimeout", meta.messageCode);
    }

    if (!currentState) {
      this.connection._socket?.close();
      throw new Error("Platform in invalid state. Cannot continue.");
    }
    if (currentState !== this.state) {
      const prevState = this.state;
      log("verbose", `[state changed] old:${prevState} new:${currentState}`);

      // Update current state and emit event
      this._currentState = new StateChange(prevState, currentState as AppState);
      super.emit("stateChange", this._currentState);

      if (currentState === AppState.UNAVAILABLE) {
        // await this.queryComponents().catch((e) => {
        //   log("error", "error querying components", e);
        //   super.emit("queryError", e);
        // });
        if (this._online) {
          this.checkRequiredComponentsAndSyncState();
        }
      }
      else if (currentState === AppState.ACTIVE) {
        this.multiTenant = payload?.applicationActivation?.executionMode === "MAM";
        this.accessibleMode = payload?.applicationActivation?.accessibleMode || false;
        this.language = payload?.applicationActivation?.languageID || "en-US";
        super.emit("activated", payload?.applicationActivation);
      }
      if (prevState === AppState.ACTIVE) {
        super.emit("deactivated", currentState as AppState);
      }
    }

    if (typeof meta.componentID === "number" && this.components) {
      const component = this.components[meta.componentID];
      if (component && component.stateIsDifferent(platformData)) {
        component.updateState(platformData);

        super.emit("componentStateChange", component);

        if (
          this._online &&
          (unsolicited ||
            meta.platformDirective === PlatformDirectives.PERIPHERALS_QUERY)
        ) {
          this.checkRequiredComponentsAndSyncState();
        }
      }
    }

    log("verbose", "[socket.onmessage]", platformData);

    // Emit platform message
    super.emit("message", platformData);
  }

  api: ComponentAPI = {
    getEnvironment: async (): Promise<EnvironmentLevel> => {
      this._ensureConnected();
      const ad = Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT);
      const response = await this.connection.sendAndGetResponse(ad);
      log("verbose", "[getEnvironment()] response", response);
      this.environment = response.payload?.environmentLevel as EnvironmentLevel;
      return this.environment;
    },

    getComponents: async (): Promise<ComponentList> => {
      this._ensureConnected();
      const ad = Build.applicationData(PlatformDirectives.PLATFORM_COMPONENTS);
      const response = await this.connection.sendAndGetResponse(ad);
      log("verbose", "[getComponents()] response", response);
      const componentList = response.payload?.componentList as ComponentList;
      if (this.components) return componentList;

      const components: Record<string, BaseComponent> = this.components = {};

      //first find feeders & dispensers, so they can be linked when printers are created
      componentList.forEach((component) => {
        const id = String(component.componentID);
        let instance;

        if (isFeeder(component)) instance = new Feeder(component, this);
        else if (isDispenser(component)) {
          instance = new Dispenser(component, this);
        }
        else return;

        return components[id] = instance;
      });

      componentList.forEach((component) => {
        const id = String(component.componentID);
        let instance;

        if (isAnnouncement(component)) {
          instance = this.announcement = new Announcement(component, this);
        }
        else if (isBagTagPrinter(component)) {
          instance = this.bagTagPrinter = new BagTagPrinter(component, this);
        }
        else if (isBoardingPassPrinter(component)) {
          instance = this.boardingPassPrinter = new BoardingPassPrinter(
            component,
            this,
          );
        }
        else if (isDocumentReader(component)) {
          instance = this.documentReader = new DocumentReader(component, this);
        }
        else if (isBarcodeReader(component)) {
          instance = this.barcodeReader = new BarcodeReader(component, this);
        }
        else if (isCardReader(component)) {
          instance = this.cardReader = new CardReader(component, this);
        }
        else if (isKeypad(component)) {
          instance = this.keypad = new Keypad(component, this);
        }
        else if (isBiometric(component)) {
          instance = this.biometric = new Biometric(component, this);
        }
        else if (isScale(component)) {
          instance = this.scale = new Scale(component, this);
        }
        else if (isCamera(component)) {
          instance = this.camera = new Camera(component, this);
        }
        else if (isRFIDReader(component)) {
          instance = this.rfid = new RFID(component, this);
        }
        else if (isBHS(component)) {
          instance = this.bhs = new BHS(component, this);
        }
        else if (isAEASBD(component)) {
          instance = this.aeasbd = new AEASBD(component, this);
        }
        // subcomponents
        else if (isFeeder(component)) return; // instance = new Feeder(component, this);
        else if (isDispenser(component)) return; // instance = new Dispenser(component, this);
        else if (isIllumination(component)) {
          instance = this.illumination = new Illumination(component, this);
        }
        else if (isHeadset(component)) {
          instance = this.headset = new Headset(component, this);
        }
        else instance = new UnknownComponent(component, this);

        return components[id] = instance as BaseComponent;
      });

      return componentList;
    },

    getStatus: async (componentID: number): Promise<PlatformData> => {
      this._ensureConnected();
      log("verbose", `[getStatus()] querying component with ID: ${componentID}`);
      const ad = Build.applicationData(PlatformDirectives.PERIPHERALS_QUERY, {
        componentID: componentID,
      });
      log("verbose", "[getStatus()] applicationData built:", ad);
      const response = await this.connection.sendAndGetResponse(ad);
      log("verbose", "[queryDevice()] response", response);
      return response;
    },

    send: async (
      componentID: number,
      dataObj:
        | DataRecordList
        | ScreenResolution
        | IlluminationData
        | BaggageData
        | CommonUsePaymentMessage
        | CommonUseBiometricMessage,
    ): Promise<PlatformData> => {
      this._ensureConnected();
      const ad = Build.applicationData(PlatformDirectives.PERIPHERALS_SEND, {
        componentID: componentID,
        dataObj,
      });
      return await this.connection.sendAndGetResponse(ad);
    },

    setup: async (
      componentID: number,
      dataObj: DataRecordList,
    ): Promise<PlatformData> => {
      this._ensureConnected();
      validateComponentId(componentID);
      const ad = Build.applicationData(PlatformDirectives.PERIPHERALS_SETUP, {
        componentID: componentID,
        dataObj,
      });
      return await this.connection.sendAndGetResponse(ad);
    },

    cancel: async (componentID: number): Promise<PlatformData> => {
      this._ensureConnected();
      validateComponentId(componentID);
      const ad = Build.applicationData(PlatformDirectives.PERIPHERALS_CANCEL, {
        componentID: componentID,
      });
      return await this.connection.sendAndGetResponse(ad);
    },

    enable: async (componentID: number): Promise<PlatformData> => {
      this._ensureConnected();
      validateComponentId(componentID);
      const ad = Build.applicationData(
        PlatformDirectives.PERIPHERALS_USERPRESENT_ENABLE,
        { componentID: componentID },
      );
      return await this.connection.sendAndGetResponse(ad);
    },

    disable: async (componentID: number): Promise<PlatformData> => {
      this._ensureConnected();
      validateComponentId(componentID);
      const ad = Build.applicationData(
        PlatformDirectives.PERIPHERALS_USERPRESENT_DISABLE,
        { componentID: componentID },
      );
      return await this.connection.sendAndGetResponse(ad);
    },
    offer: async (componentID: number): Promise<PlatformData> => {
      this._ensureConnected();
      validateComponentId(componentID);
      const ad = Build.applicationData(
        PlatformDirectives.PERIPHERALS_USERPRESENT_OFFER,
        { componentID: componentID },
      );
      return await this.connection.sendAndGetResponse(ad);
    },

    staterequest: async (
      state: AppState,
      reasonCode = ChangeReason.NOT_APPLICABLE,
      reason = "",
    ): Promise<PlatformData | undefined> => {
      this._ensureConnected();
      if (this.pendingStateChange) {
        return Promise.resolve(undefined);
      }
      log("info", `Requesting ${state} state`);
      this.pendingStateChange = state;
      let response: PlatformData | undefined;
      try {
        const ad = Build.stateChange(state, reasonCode, reason);
        response = await this.connection.sendAndGetResponse(ad);
        return response;
      }
      finally {
        this.pendingStateChange = undefined;
      }
    },

    announcement: {
      play: async (
        componentID: number,
        rawData: string,
      ): Promise<PlatformData> => {
        this._ensureConnected();
        validateComponentId(componentID);
        const dataObj = [{
          data: rawData as string,
          dsTypes: [CussDataTypes.DS_TYPES_SSML],
        }];
        const ad = Build.applicationData(
          PlatformDirectives.PERIPHERALS_ANNOUNCEMENT_PLAY,
          {
            componentID: componentID,
            dataObj,
          },
        );
        return await this.connection.sendAndGetResponse(ad);
      },

      pause: async (componentID: number): Promise<PlatformData> => {
        this._ensureConnected();
        validateComponentId(componentID);
        const ad = Build.applicationData(
          PlatformDirectives.PERIPHERALS_ANNOUNCEMENT_PAUSE,
          { componentID: componentID },
        );
        return await this.connection.sendAndGetResponse(ad);
      },

      resume: async (componentID: number): Promise<PlatformData> => {
        this._ensureConnected();
        validateComponentId(componentID);
        const ad = Build.applicationData(
          PlatformDirectives.PERIPHERALS_ANNOUNCEMENT_RESUME,
          { componentID: componentID },
        );
        return await this.connection.sendAndGetResponse(ad);
      },

      stop: async (componentID: number): Promise<PlatformData> => {
        this._ensureConnected();
        validateComponentId(componentID);
        const ad = Build.applicationData(
          PlatformDirectives.PERIPHERALS_ANNOUNCEMENT_STOP,
          { componentID: componentID },
        );
        return await this.connection.sendAndGetResponse(ad);
      },
    },
  };

  private async _disableAllComponents(): Promise<void> {
    if (this.components) {
      const componentList = Object.values(this.components) as BaseComponent[];
      for await (const component of componentList) {
        // Check if component has enable/disable capability (InteractiveComponent)
        if ("enabled" in component && (component as InteractiveComponent).enabled) {
          await (component as InteractiveComponent).disable();
        }
      }

      // alternatives to try out...

      // // Option 1: Concurrent disabling (faster)
      // await Promise.all(
      //   componentList
      //     .filter((component) => component?.enabled)
      //     .map(async (component) => await component.disable()),
      // );

      // // Option 2: Sequential disabling (if order matters)
      // for (const component of componentList) {
      //   if (component?.enabled) await component.disable();
      // }
    }
  }

  async requestInitializeState(): Promise<PlatformData | undefined> {
    this._ensureConnected();
    const okToChange = this.state === AppState.STOPPED;
    return okToChange ? await this.api.staterequest(AppState.INITIALIZE) : Promise.resolve(undefined);
  }

  async requestUnavailableState(): Promise<PlatformData | undefined> {
    this._ensureConnected();
    const okToChange = this.state === AppState.INITIALIZE || this.state === AppState.AVAILABLE ||
      this.state === AppState.ACTIVE;

    if (okToChange && this.state === AppState.ACTIVE) {
      await this._disableAllComponents();
    }

    return okToChange ? this.api.staterequest(AppState.UNAVAILABLE) : Promise.resolve(undefined);
  }

  async requestAvailableState(): Promise<PlatformData | undefined> {
    this._ensureConnected();
    const okToChange = this.state === AppState.UNAVAILABLE || this.state === AppState.ACTIVE;

    if (okToChange && this.state === AppState.ACTIVE) {
      await this._disableAllComponents();
    }

    return okToChange ? this.api.staterequest(AppState.AVAILABLE) : Promise.resolve(undefined);
  }

  async requestActiveState(): Promise<PlatformData | undefined> {
    this._ensureConnected();
    const okToChange = this.state === AppState.AVAILABLE || this.state === AppState.ACTIVE;
    return await (okToChange ? this.api.staterequest(AppState.ACTIVE) : Promise.resolve(undefined));
  }

  async requestStoppedState(): Promise<PlatformData | undefined> {
    this._ensureConnected();
    return await this.api.staterequest(AppState.STOPPED);
  }

  async requestReload(): Promise<boolean> {
    this._ensureConnected();
    const okToChange = !this.state || this.state === AppState.UNAVAILABLE ||
      this.state === AppState.AVAILABLE || this.state === AppState.ACTIVE;

    if (!okToChange) {
      return Promise.resolve(false);
    }

    await this.api.staterequest(AppState.RELOAD);
    // directly close the socket so reconnect will still happen
    this.connection._socket?.close(1001, "Reloading");
    return true;
  }

  async queryComponents(): Promise<boolean> {
    if (!this.components) {
      return false;
    }
    const componentList = Object.values(this.components) as BaseComponent[];
    await Promise.all(
      componentList.map((c) =>
        c.query()
          .catch((e) => e)
      ), //it rejects statusCodes that are not "OK" - but here we just need to know what it is, so ignore
    );
    return true;
  }

  get unavailableComponents(): BaseComponent[] {
    const components = Object.values(this.components || {}) as BaseComponent[];
    return components.filter((c: BaseComponent) => !c.ready);
  }

  get unavailableRequiredComponents(): BaseComponent[] {
    return this.unavailableComponents.filter((c: BaseComponent) => c.required);
  }

  checkRequiredComponentsAndSyncState(): void {
    if (this.pendingStateChange) return;
    if (this._online) {
      const inactiveRequiredComponents = this.unavailableRequiredComponents;
      if (!inactiveRequiredComponents.length) {
        if (this.state === AppState.UNAVAILABLE) {
          log(
            "verbose",
            "[checkRequiredComponentsAndSyncState] All required components OK ✅. Ready for AVAILABLE state.",
          );
          this.requestAvailableState();
        }
      }
      else {
        log(
          "verbose",
          "[checkRequiredComponentsAndSyncState] Required components UNAVAILABLE:",
          inactiveRequiredComponents.map((c: BaseComponent) => c.constructor.name),
        );
        this.requestUnavailableState();
      }
    }
    else if (this.components) {
      this.requestUnavailableState();
    }
  }

  private _online: boolean = false;
  get applicationOnline(): boolean {
    return this._online;
  }
  set applicationOnline(online: boolean) {
    this._online = online;
    this.checkRequiredComponentsAndSyncState();
  }
}

// this is down here so that it outputs in the documentation after the Cuss2 class
export type { ComponentAPI } from "./cuss2/ComponentAPI.ts";
