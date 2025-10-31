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
      if (this.enabled !== undefined) {
        this.enabled = false;
      }
    });
  }

  handleMessage(data: PlatformData): void {
    this.emit("message", data);
  }

  stateIsDifferent(msg: PlatformData): boolean {
    return this.status !== msg.meta.messageCode || this._componentState !== msg.meta.componentState;
  }

  updateState(msg: PlatformData): void {
    const { meta } = msg;

    // Handle component state changes
    if (meta?.componentState !== undefined && meta.componentState !== this._componentState) {
      this._componentState = meta.componentState ?? ComponentState.UNAVAILABLE;
      console.log(
        `[DEBUG BaseComponent] updateState: componentState=${meta.componentState}, READY=${ComponentState.READY}, enabled before=${this.enabled}`,
      );

      // Only set enabled to false if component becomes UNAVAILABLE
      // Don't touch enabled state for other state transitions (READY, ENABLED, etc.)
      if (meta.componentState === ComponentState.UNAVAILABLE && this.enabled !== undefined) {
        console.log(`[DEBUG BaseComponent] updateState: Setting enabled=false because componentState is UNAVAILABLE`);
        this.enabled = false;
      }

      console.log(`[DEBUG BaseComponent] updateState: enabled after=${this.enabled}`);
      // Emit readyStateChange with current component state
      this.emit("readyStateChange", meta.componentState === ComponentState.READY);
    }

    // Auto-poll for required components that are not ready
    if (!this.ready && this.required && !this._poller && this.pollingInterval > 0) {
      this.pollUntilReady();
    }

    // Handle message code (status) changes
    if (meta?.messageCode !== undefined && this._status !== meta.messageCode) {
      this._status = meta.messageCode as MessageCodes;
      this.emit("statusChange", this._status);
    }
  }

  /**
   * Query the current state/status of the component
   * Available to ALL component types
   */
  async query(): Promise<PlatformData> {
    return await this.withPendingCall(() => this.api.getStatus(this.id));
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
