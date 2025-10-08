/**
 * Base Component Class - CUSS2 Virtual Component Concept
 * Only includes methods available to ALL component types:
 * - query: Returns current state/status
 * - cancel: Cancels queued directives
 * - setup: Configure component
 */

import { EventEmitter } from "events";
import type { Cuss2 } from "../../cuss2.ts";
import { ComponentState, type DataRecordList, type EnvironmentComponent, MessageCodes, type PlatformData } from "cuss2-typescript-models";
import { DeviceType } from "../deviceType.ts";
import type { ComponentAPI } from "../../cuss2/ComponentAPI.ts";

export abstract class BaseComponent extends EventEmitter {
  protected _component: EnvironmentComponent;
  id: number;
  api!: ComponentAPI;
  required: boolean = false;
  protected _status: MessageCodes = MessageCodes.OK;
  protected _componentState: ComponentState = ComponentState.UNAVAILABLE;
  deviceType: DeviceType;
  pendingCalls: number = 0;
  pollingInterval = 10000;
  protected _poller: ReturnType<typeof setTimeout> | undefined;
  parent: BaseComponent | null;
  subcomponents: BaseComponent[] = [];

  get ready(): boolean {
    return this._componentState === ComponentState.READY;
  }

  get pending(): boolean {
    return this.pendingCalls > 0;
  }

  get status(): MessageCodes {
    return this._status;
  }

  get componentState(): ComponentState {
    return this._componentState;
  }

  constructor(
    component: EnvironmentComponent,
    cuss2: Cuss2,
    _type: DeviceType = DeviceType.UNKNOWN,
  ) {
    super();
    this.deviceType = _type;
    this._component = component;
    this.id = Number(component.componentID);
    this.api = cuss2.api;
    this.parent = null;

    // Get required from componentCharacteristics
    const characteristics = component.componentCharacteristics?.[0];
    this.required = (characteristics as unknown as { required?: boolean })?.required || false;

    // Initialize state - these may not exist on initial component
    this._componentState = ComponentState.UNAVAILABLE;
    this._status = MessageCodes.OK;

    this.setupEventListeners(cuss2);
  }

  protected setupEventListeners(cuss2: Cuss2): void {
    // Subscribe to platform messages via cuss2 instance
    cuss2.on("message", (data: PlatformData) => {
      if (data?.meta?.componentID === this.id) {
        this.handleMessage(data);
        this.updateState(data);
      }
    });

    // Subscribe to deactivation events
    cuss2.on("deactivated", () => {
      // Handle deactivation if needed
    });
  }

  handleMessage(data: PlatformData): void {
    this.emit("message", data);
  }

  stateIsDifferent(msg: PlatformData): boolean {
    return this.status !== msg.meta.messageCode || this._componentState !== msg.meta.componentState;
  }

  updateState(msg: PlatformData): void {
    if (msg?.meta?.componentState) {
      this._componentState = msg.meta.componentState as ComponentState;
      this.emit("readyStateChange", this._componentState);
    }
    if (msg?.meta?.messageCode) {
      this._status = msg.meta.messageCode as MessageCodes;
      this.emit("statusChange", this._status);
    }
  }

  /**
   * Query the current state/status of the component
   * Available to ALL component types
   */
  async query(): Promise<PlatformData> {
    this.pendingCalls++;
    return await this.api.getStatus(this.id).finally(() => this.pendingCalls--);
  }

  /**
   * Cancel all currently executed and queued directives
   * Available to ALL components except APPLICATION
   */
  async cancel(): Promise<PlatformData> {
    this.pendingCalls++;
    return await this.api.cancel(this.id).finally(() => this.pendingCalls--);
  }

  /**
   * Setup/configure the component
   * Available to ALL components except APPLICATION
   */
  async setup(dataObj: DataRecordList): Promise<PlatformData> {
    this.pendingCalls++;
    const pd = await this.api.setup(this.id, dataObj).finally(() => this.pendingCalls--);
    this.updateState(pd);
    return pd;
  }

  startPolling(): void {
    if (!this._poller) {
      this._poller = setInterval(async () => {
        await this.query();
      }, this.pollingInterval);
    }
  }

  stopPolling(): void {
    if (this._poller) {
      clearInterval(this._poller);
      this._poller = undefined;
    }
  }

  pollUntilReady(requireOK = false, pollingInterval = this.pollingInterval): void {
    if (this._poller) return;
    const poll = () => {
      if (this.ready && (!requireOK || this.status === MessageCodes.OK)) {
        this._poller = undefined;
        return;
      }
      this._poller = setTimeout(() => {
        this.query().catch(Object).finally(poll);
      }, pollingInterval);
    };
    poll();
  }
}
