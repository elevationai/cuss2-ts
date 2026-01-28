/**
 * Base Component Class - CUSS2 Virtual Component Concept
 * Only includes methods available to ALL component types:
 * - query: Returns current state/status
 * - cancel: Cancels queued directives
 * - setup: Configure component
 */

import { EventEmitter } from "events";
import type { Cuss2 } from "../../cuss2.ts";
import {
  ApplicationStateCodes,
  ComponentState,
  type DataRecordList,
  type EnvironmentComponent,
  MessageCodes,
  type PlatformData,
  PlatformDirectives,
} from "cuss2-typescript-models";
import { DeviceType } from "../deviceType.ts";
import type { ComponentAPI } from "../../cuss2/ComponentAPI.ts";
import { getCurrentComponentState } from "../../types/modelExtensions.ts";

export abstract class BaseComponent extends EventEmitter {
  protected _component: EnvironmentComponent;
  id: number;
  api!: ComponentAPI;
  required: boolean = false;
  protected _status: MessageCodes = MessageCodes.OK;
  protected _componentState: ComponentState = ComponentState.UNAVAILABLE;
  deviceType: DeviceType;
  pendingCalls: number = 0;
  pollingInterval: number = 0;
  protected _poller: ReturnType<typeof setTimeout> | undefined;
  parent: BaseComponent | null;
  subcomponents: BaseComponent[] = [];

  // Only InteractiveComponent and its subclasses actually use this
  enabled?: boolean;

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

    // Handle subcomponent linking for components with linkedComponentIDs
    if (component.linkedComponentIDs?.length) {
      const name = this.deviceType;
      const parentId = Math.min(
        this.id,
        ...component.linkedComponentIDs as number[],
      );
      if (parentId !== this.id) {
        this.parent = cuss2.components?.[parentId] as BaseComponent;
        // feeder and dispenser are created in the printer component
        if (this.parent) {
          this.parent.subcomponents.push(this);
          // We need to use bracket notation to access dynamic properties
          // Explicitly tell TypeScript that this is safe by using indexing
          (this.parent as unknown as Record<string, BaseComponent>)[name] = this;
        }
      }
    }
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
      // Set enabled to false if this component uses the enabled property
      if (this.enabled !== undefined && this.enabled !== false) {
        this.enabled = false;
        // Notify consumers so UI can update toggle states
        cuss2.emit("componentStateChange", this);
      }
    });
  }

  handleMessage(data: PlatformData): void {
    this.emit("message", data);
  }

  stateIsDifferent(msg: PlatformData): boolean {
    const ccs = getCurrentComponentState(msg.meta);
    if (ccs) {
      return this._status !== ccs.status ||
        this._componentState !== ccs.componentState ||
        (this.enabled !== undefined && this.enabled !== ccs.enabled);
    }
    return this.status !== msg.meta.messageCode || this._componentState !== msg.meta.componentState;
  }

  updateState(msg: PlatformData): void {
    const { meta } = msg;
    const ccs = getCurrentComponentState(meta);

    if (ccs) {
      // New path: use currentComponentState as the source of truth
      if (ccs.componentState !== this._componentState) {
        this._componentState = ccs.componentState;
        this.emit("readyStateChange", ccs.componentState === ComponentState.READY);
      }

      // Status is always applied — the new format already separates response codes from status
      if (ccs.status !== this._status) {
        this._status = ccs.status;
        this.emit("statusChange", this._status);
      }

      // Sync enabled from platform (only for components that track enabled)
      // Components can only be enabled in ACTIVE state — force false otherwise
      if (this.enabled !== undefined) {
        const appState = meta.currentApplicationState?.applicationStateCode;
        if (this._componentState === ComponentState.UNAVAILABLE || appState !== ApplicationStateCodes.ACTIVE) {
          this.enabled = false;
        }
        else if (ccs.enabled !== this.enabled) {
          this.enabled = ccs.enabled;
        }
      }
    }
    else {
      // Legacy path: existing behavior unchanged
      if (meta?.componentState !== undefined && meta.componentState !== this._componentState) {
        this._componentState = meta.componentState ?? ComponentState.UNAVAILABLE;

        if (meta.componentState === ComponentState.UNAVAILABLE && this.enabled !== undefined) {
          this.enabled = false;
        }

        this.emit("readyStateChange", meta.componentState === ComponentState.READY);
      }

      if (
        !meta.platformDirective ||
        meta.platformDirective === PlatformDirectives.PERIPHERALS_QUERY
      ) {
        if (meta?.messageCode !== undefined && this._status !== meta.messageCode) {
          this._status = meta.messageCode as MessageCodes;
          this.emit("statusChange", this._status);
        }
      }
    }

    // Auto-poll for required components that are not ready
    if (!this.ready && this.required && !this._poller && this.pollingInterval > 0) {
      this.pollUntilReady();
    }
  }

  /**
   * Query the current state/status of the component
   * Available to ALL component types
   */
  async query(): Promise<PlatformData> {
    const pd = await this.withPendingCall(() => this.api.getStatus(this.id));
    this.updateState(pd);
    return pd;
  }

  /**
   * Cancel all currently executed and queued directives
   * Available to ALL components except APPLICATION
   */
  async cancel(): Promise<PlatformData> {
    return await this.withPendingCall(() => this.api.cancel(this.id));
  }

  /**
   * Setup/configure the component
   * Available to ALL components except APPLICATION
   */
  async setup(dataObj: DataRecordList): Promise<PlatformData> {
    const pd = await this.withPendingCall(() => this.api.setup(this.id, dataObj));
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

  pollUntilReady(requireOK: boolean = false, pollingInterval: number = this.pollingInterval): void {
    // Polling for printers, feeders, and dispensers needs to consider MEDIA_ABSENT, MEDIA_LOW, MEDIA_FULL, and MEDIA_PRESENT
    // as READY states as well as the usual OK for other components.
    if (this._poller) return;
    const poll = () => {
      if (!pollingInterval || pollingInterval <= 0) {
        return this._poller = undefined;
      }
      if (
        this.ready &&
        (!requireOK ||
          (this.status === MessageCodes.OK || this.status === MessageCodes.MEDIA_ABSENT || this.status === MessageCodes.MEDIA_LOW ||
            this.status === MessageCodes.MEDIA_FULL || this.status === MessageCodes.MEDIA_PRESENT))
      ) {
        return this._poller = undefined;
      }
      this._poller = setTimeout(() => {
        this.query().catch(Object).finally(poll);
      }, Math.max(pollingInterval, 1000)); // Minimum 1 second interval - we don't allow hammering the API
    };
    poll();
  }

  /**
   * Wrapper for API calls that manages pendingCalls counter
   * Increments before the call, decrements in finally block
   * @param apiCall - The API call to execute
   * @returns Promise with the API call result
   */
  protected async withPendingCall<T extends PlatformData>(
    apiCall: () => Promise<T>,
  ): Promise<T> {
    this.pendingCalls++;
    try {
      return await apiCall();
    }
    finally {
      this.pendingCalls--;
    }
  }
}
