import { WebSocketManager } from "./websocket.ts";
import {
  ClientError,
  type ClientEvents,
  type ConnectionOptions,
  type DeviceCommand,
  type EventHandler,
  type PlatformMessage,
  type TenantsResponse,
  type TenantUpdate,
} from "./types.ts";
import type { EnvironmentComponent } from "@cuss/cuss2-ts";
import type { ApplicationStateCodes } from "cuss2-typescript-models";

export class CUSS2DevToolsClient {
  private wsManager: WebSocketManager;
  private eventHandlers: Map<keyof ClientEvents, Set<EventHandler>> = new Map();
  private commandTimeout = 5000;
  private requestCounter = 0;
  private pendingRequests = new Map<string, {
    resolve: (response: PlatformMessage) => void;
    reject: (error: Error) => void;
    timer: number;
    command: DeviceCommand;
  }>();

  constructor(private options: ConnectionOptions) {
    this.wsManager = new WebSocketManager(options);
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers(): void {
    this.wsManager.on("open", () => this.emit("connected"));
    this.wsManager.on("close", (reason) => this.emit("disconnected", reason));
    this.wsManager.on("message", (data) => this.handleMessage(data as PlatformMessage));
    this.wsManager.on("error", (error) => this.emit("error", error));
  }

  private handleMessage(message: PlatformMessage): void {
    // Check if this is a response to a pending request
    if (message.requestId && this.pendingRequests.has(message.requestId)) {
      const pending = this.pendingRequests.get(message.requestId)!;
      clearTimeout(pending.timer);
      this.pendingRequests.delete(message.requestId);

      // Resolve or reject based on status
      if (message.status === "OK") {
        pending.resolve(message);
      }
      else {
        pending.reject(
          new ClientError(
            `Command failed: ${message.error || message.status || "Unknown error"}`,
            "COMMAND_FAILED",
            { command: pending.command, response: message },
          ),
        );
      }
    }

    // Check if this is a tenant state update broadcast
    if ("tenant" in message && "state" in message && typeof message.tenant === "string") {
      const update: TenantUpdate = {
        tenant: message.tenant as string,
        brand: message.brand as string | undefined,
        state: message.state as ApplicationStateCodes,
        previous: message.previous as ApplicationStateCodes | undefined,
      };
      this.emit("tenant_update", update);
    }

    this.emit("message", message);

    if (message.meta?.platformDirective === "platform_environment") {
      this.emit("environment", message.payload);
    }
    else if (message.meta?.platformDirective === "platform_components") {
      const components = (message.payload as { componentList?: EnvironmentComponent[] })?.componentList;
      if (components) {
        this.emit("components", components);
      }
    }

    if (message.meta?.componentID !== undefined) {
      this.emit("component_message", message.meta.componentID, message);
    }
  }

  on<K extends keyof ClientEvents>(event: K, handler: ClientEvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler as EventHandler);
  }

  off<K extends keyof ClientEvents>(event: K, handler: ClientEvents[K]): void {
    this.eventHandlers.get(event)?.delete(handler as EventHandler);
  }

  private emit<K extends keyof ClientEvents>(
    event: K,
    ...args: Parameters<ClientEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          const result = handler(...args);
          if (result instanceof Promise) {
            result.catch((error) => {
              console.error(`Async event handler error for ${event}:`, error);
            });
          }
        }
        catch (error) {
          console.error(`Event handler error for ${event}:`, error);
        }
      }
    }
  }

  async connect(): Promise<void> {
    try {
      await this.wsManager.connect();
    }
    catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw new ClientError(
        `Connection failed: ${error}`,
        "CONNECTION_FAILED",
        error,
      );
    }
  }

  disconnect(): void {
    this.wsManager.disconnect();
  }

  private generateRequestId(): string {
    this.requestCounter++;
    return `req_${Date.now()}_${this.requestCounter}`;
  }

  cmd(
    componentId: number,
    action: string,
    args: Record<string, unknown> = {},
  ): Promise<PlatformMessage> {
    if (!Number.isInteger(componentId) || componentId < 0) {
      throw new ClientError(
        `Invalid component ID: ${componentId}`,
        "VALIDATION_ERROR",
      );
    }

    if (!action || typeof action !== "string") {
      throw new ClientError(
        "Action must be a non-empty string",
        "VALIDATION_ERROR",
      );
    }

    const requestId = this.generateRequestId();
    const command: DeviceCommand = {
      componentID: componentId,
      action,
      args,
      requestId,
    };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(
          new ClientError(
            `Command timeout after ${this.commandTimeout}ms`,
            "COMMAND_FAILED",
            { command },
          ),
        );
      }, this.commandTimeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timer,
        command,
      });

      try {
        this.send(command);
      }
      catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);

        if (error instanceof ClientError) {
          reject(error);
        }
        else {
          reject(
            new ClientError(
              `Command failed: ${error}`,
              "COMMAND_FAILED",
              { command, error },
            ),
          );
        }
      }
    });
  }

  // Keep a synchronous version for backward compatibility
  cmdSync(
    componentId: number,
    action: string,
    args: Record<string, unknown> = {},
  ): void {
    this.cmd(componentId, action, args).catch((error) => {
      this.emit("error", error);
    });
  }

  send(message: unknown): void {
    if (!this.wsManager.isConnected()) {
      throw new ClientError(
        "Client is not connected",
        "CONNECTION_FAILED",
      );
    }

    try {
      this.wsManager.send(message);
    }
    catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw new ClientError(
        `Failed to send message: ${error}`,
        "WEBSOCKET_ERROR",
        error,
      );
    }
  }

  sendWithResponse(message: Record<string, unknown>): Promise<PlatformMessage> {
    const requestId = this.generateRequestId();
    const messageWithId = { ...message, requestId };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(
          new ClientError(
            `Request timeout after ${this.commandTimeout}ms`,
            "COMMAND_FAILED",
            { message: messageWithId },
          ),
        );
      }, this.commandTimeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timer,
        command: messageWithId as DeviceCommand,
      });

      try {
        this.send(messageWithId);
      }
      catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(requestId);

        if (error instanceof ClientError) {
          reject(error);
        }
        else {
          reject(
            new ClientError(
              `Send failed: ${error}`,
              "WEBSOCKET_ERROR",
              { message: messageWithId, error },
            ),
          );
        }
      }
    });
  }

  isConnected(): boolean {
    return this.wsManager.isConnected();
  }

  getConnectionState(): string {
    const state = this.wsManager.getReadyState();
    switch (state) {
      case WebSocket.CONNECTING:
        return "CONNECTING";
      case WebSocket.OPEN:
        return "CONNECTED";
      case WebSocket.CLOSING:
        return "CLOSING";
      case WebSocket.CLOSED:
        return "CLOSED";
      default:
        return "UNKNOWN";
    }
  }

  setCommandTimeout(timeout: number): void {
    if (timeout <= 0) {
      throw new ClientError(
        "Timeout must be greater than 0",
        "VALIDATION_ERROR",
      );
    }
    this.commandTimeout = timeout;
  }

  async listTenants(): Promise<TenantsResponse> {
    if (!this.wsManager.isConnected()) {
      throw new ClientError(
        "Client is not connected",
        "CONNECTION_FAILED",
      );
    }

    try {
      const response = await this.sendWithResponse({ action: "list_tenants" });
      if (response.status !== "OK") {
        throw new ClientError(
          `Failed to list tenants: ${response.error || response.status}`,
          "COMMAND_FAILED",
          response,
        );
      }
      return response.tenants as TenantsResponse;
    }
    catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw new ClientError(
        `Failed to list tenants: ${error}`,
        "COMMAND_FAILED",
        error,
      );
    }
  }

  async activateBrand(tenant: string, brand: string): Promise<void> {
    if (!this.wsManager.isConnected()) {
      throw new ClientError(
        "Client is not connected",
        "CONNECTION_FAILED",
      );
    }

    if (!tenant || !brand) {
      throw new ClientError(
        "Tenant and brand are required",
        "VALIDATION_ERROR",
      );
    }

    try {
      const response = await this.sendWithResponse({
        action: "activate",
        tenantId: tenant,
        brandId: brand,
      });

      if (response.status !== "OK") {
        throw new ClientError(
          `Failed to activate brand: ${response.error || response.status}`,
          "COMMAND_FAILED",
          response,
        );
      }
    }
    catch (error) {
      if (error instanceof ClientError) {
        throw error;
      }
      throw new ClientError(
        `Failed to activate brand: ${error}`,
        "COMMAND_FAILED",
        error,
      );
    }
  }
}
