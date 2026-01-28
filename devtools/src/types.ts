import type { EnvironmentComponent } from "@cuss/cuss2-ts";
import type { ApplicationStateCodes } from "cuss2-typescript-models";

export interface ConnectionOptions {
  url: string;
  auth?: {
    url?: string;
    client_id?: string;
    client_secret?: string;
  };
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  bufferSize?: number;
}

export interface DeviceCommand {
  componentID: number;
  action: string;
  args: Record<string, unknown>;
  requestId?: string;
}

export interface PlatformMessage {
  meta?: {
    componentID?: string | number;
    platformDirective?: string;
    [key: string]: unknown;
  };
  payload?: unknown;
  requestId?: string;
  status?: string;
  error?: string;
  [key: string]: unknown;
}

export interface TenantUpdate {
  tenant: string;
  brand?: string;
  state: ApplicationStateCodes;
  previous?: ApplicationStateCodes;
}

export type ClientEvents = {
  connected: () => void;
  disconnected: (reason: string) => void;
  message: (message: PlatformMessage) => void;
  error: (error: ClientError) => void;
  environment: (environment: unknown) => void;
  components: (components: EnvironmentComponent[]) => void;
  component_message: (componentId: string | number, message: unknown) => void;
  tenant_update: (update: TenantUpdate) => void;
};

export class ClientError extends Error {
  constructor(
    message: string,
    public type: "CONNECTION_FAILED" | "COMMAND_FAILED" | "VALIDATION_ERROR" | "WEBSOCKET_ERROR",
    public details?: unknown,
  ) {
    super(message);
    this.name = "ClientError";
  }
}

export type EventHandler = (...args: unknown[]) => void | Promise<void>;

export interface WebSocketMessage {
  type?: string;
  data?: unknown;
  [key: string]: unknown;
}

export type TenantsResponse = Record<string, Record<string, ApplicationStateCodes>>;
