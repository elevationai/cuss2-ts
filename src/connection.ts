import { EventEmitter } from "./models/EventEmitter.ts";
import { helpers } from "./helper.ts";
import { PlatformResponseError } from "./models/index.ts";
import { AuthenticationError } from "./models/Errors.ts";
import type { ApplicationData, PlatformData, UniqueId } from "cuss2-typescript-models";
import type { AuthResponse } from "./models/authResponse.ts";
import { retry } from "async/retry";
import "./WebSocket.ts";

// const log = console.log
const log = (..._args: unknown[]) => {};

interface ConnectionEvents {
  message: [PlatformData];
  close: [CloseEvent];
  open: [];
  authenticating: [number];
  connecting: [number];
  authenticated: [typeof Connection.prototype._auth];
  messageError: [unknown];
  socketError: [unknown];
  authenticationError: [AuthenticationError];
}

// These are needed for overriding during testing
export const global: {
  readonly WebSocket: typeof globalThis.WebSocket;
  fetch: typeof globalThis.fetch;
  clearTimeout: typeof globalThis.clearTimeout;
  setTimeout: typeof globalThis.setTimeout;
} = {
  get WebSocket() {
    return globalThis.WebSocket;
  },
  fetch: globalThis.fetch.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  setTimeout: globalThis.setTimeout.bind(globalThis),
};

export class Connection extends EventEmitter {
  declare on: <K extends keyof ConnectionEvents>(event: K, listener: (...args: ConnectionEvents[K]) => void) => this;

  _auth: { url: string; client_id: string; client_secret: string };
  _baseURL: string;
  _socketURL: string;
  _socket?: WebSocket;
  _refresher: ReturnType<typeof setTimeout> | null = null;
  deviceID: UniqueId;
  access_token = "";
  _retryOptions: {
    maxAttempts?: number;
    minTimeout?: number;
    maxTimeout?: number;
    multiplier?: number;
    jitter?: number;
  };

  get isOpen(): boolean {
    return !!this._socket && this._socket.readyState === 1; // OPEN
  }

  constructor(
    baseURL: string,
    client_id: string,
    client_secret: string,
    deviceID: UniqueId,
    tokenURL?: string,
    retryOptions?: typeof Connection.prototype._retryOptions,
  ) {
    super();
    this.deviceID = deviceID;
    (this as EventEmitter).setMaxListeners(0); // Allow unlimited listeners

    // Validate base URL protocol
    this._validateURL(baseURL, "Base URL");

    // Validate token URL protocol if provided
    if (tokenURL) {
      this._validateURL(tokenURL, "Token URL");
    }

    // Store just the origin (protocol + hostname + port), stripping any path/query/hash
    this._baseURL = new URL(baseURL).origin;

    // Set up token URL - always ensure OAuth uses HTTP/HTTPS protocol
    const oauthUrl = tokenURL
      ? this._convertToHttpProtocol(tokenURL) // Convert custom token URL to HTTP/HTTPS
      : `${this._convertToHttpProtocol(this._baseURL)}/oauth/token`;

    this._auth = {
      url: oauthUrl,
      client_id,
      client_secret,
    };

    // Set up WebSocket URL from the original base URL
    this._socketURL = this._buildWebSocketURL(this._baseURL);

    this._retryOptions = {
      maxAttempts: 99,
      minTimeout: 1000, //ms
      maxTimeout: 64000, //ms
      multiplier: 2,
      jitter: 0.25,
      ...retryOptions,
    };
  }

  private async authorize(): Promise<AuthResponse> {
    log("info", `Authorizing client '${this._auth.client_id}'`, this._auth.url);

    const params = new URLSearchParams();
    params.append("client_id", this._auth.client_id);
    params.append("client_secret", this._auth.client_secret);
    params.append("grant_type", "client_credentials");
    let attempts = 0;

    const result = await retry(async () => {
      log("info", `Retrying client '${this._auth.client_id}'`);
      this.emit("authenticating", ++attempts);
      const response = await global.fetch(this._auth.url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        redirect: "follow",
        body: params.toString(), // Form-encoded data
      });

      if (response.status === 401) {
        // Return the error instead of throwing it to stop retries
        return new AuthenticationError("Invalid Credentials", 401);
      }

      if (response.status >= 400) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const auth = {
        access_token: data.access_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
      };
      this.emit("authenticated", auth);
      return auth;
    }, this._retryOptions);

    // Check if the result is an authentication error
    if (result instanceof AuthenticationError) {
      this.emit("authenticationError", result);
      throw result; // Re-throw the error to stop further processing
    }

    attempts = 0; // Reset attempts on successful authentication
    return result;
  }

  static connect(
    baseURL: string,
    client_id: string,
    client_secret: string,
    deviceID: string,
    tokenURL?: string,
    retryOptions?: typeof Connection.prototype._retryOptions,
  ): Connection {
    using connection = new Connection(
      baseURL,
      client_id,
      client_secret,
      deviceID,
      tokenURL,
      retryOptions,
    );
    connection.once("authenticated", () => connection._createWebSocketAndAttachEventHandlers());
    setTimeout(() => connection._authenticateAndQueueTokenRefresh(), 10);
    return connection;
  }

  private _validateURL(url: string, urlType: string): void {
    const ALLOWED_PROTOCOLS = ["http:", "https:", "ws:", "wss:"];

    try {
      const parsedUrl = new URL(url);

      if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        throw new Error(
          `${urlType} uses unsupported protocol '${parsedUrl.protocol}'. ` +
            `Only ${ALLOWED_PROTOCOLS.map((p) => p.replace(":", "://")).join(", ")} are supported.`,
        );
      }
    }
    catch (error) {
      if (error instanceof TypeError) {
        throw new Error(`${urlType} is not a valid URL: ${url}`);
      }
      throw error; // Re-throw validation errors
    }
  }

  private _convertToHttpProtocol(url: string): string {
    // Convert ws/wss protocols to http/https for OAuth endpoints
    if (url.startsWith("ws://")) {
      return url.replace(/^ws:/, "http:");
    }
    else if (url.startsWith("wss://")) {
      return url.replace(/^wss:/, "https:");
    }
    return url;
  }

  private _buildWebSocketURL(baseURL: string): string {
    // If URL already has WebSocket protocol, return as is
    if (baseURL.startsWith("ws://") || baseURL.startsWith("wss://")) {
      return `${baseURL}/platform/subscribe`;
    }

    // For HTTP/HTTPS URLs, convert to WebSocket protocol
    if (baseURL.startsWith("https://")) {
      const wsBase = baseURL.replace(/^https:\/\//, "");
      return `wss://${wsBase}/platform/subscribe`;
    }
    else if (baseURL.startsWith("http://")) {
      const wsBase = baseURL.replace(/^http:\/\//, "");
      return `ws://${wsBase}/platform/subscribe`;
    }

    // This should never happen after validation, but provide a safety net
    throw new Error(`Unable to build WebSocket URL from base URL: ${baseURL}`);
  }

  private async _authenticateAndQueueTokenRefresh(): Promise<void> {
    log("info", "Getting access_token");

    if (this._refresher) {
      global.clearTimeout(this._refresher);
      this._refresher = null;
    }

    try {
      const access_data = await this.authorize();

      this.access_token = access_data.access_token;
      const expires = Math.max(0, access_data.expires_in);

      if (expires > 0) {
        log("info", `access_token expires in ${expires} seconds`);
        this._refresher = global.setTimeout(() => this._authenticateAndQueueTokenRefresh(), (expires - 1) * 1000);
      }
    }
    catch (error) {
      log("error", "Authentication failed:", error);
    }
  }

  _createWebSocketAndAttachEventHandlers(): void {
    let attempts = 0;

    retry(() =>
      new Promise<boolean>((resolve, reject) => {
        if (this.isOpen) {
          return resolve(true);
        }
        this.emit("connecting", ++attempts);

        let options: { headers: { Origin: string } } | undefined = undefined;
        if (typeof Deno !== "undefined") {
          const origin = this._baseURL.startsWith("http") ? this._baseURL : `http://${this._baseURL}`;
          options = { headers: { Origin: origin } };
        }

        // @ts-ignore - ws library accepts options as third parameter, browser ignores extra params
        const socket = new global.WebSocket(this._socketURL, undefined, options);

        socket.onopen = () => {
          log("info", "Socket opened: ", this._socketURL);
          this._socket = socket;
          attempts = 0;
          resolve(true);
          this.emit("open");
        };

        socket.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);

            if (data.ping) {
              socket.send(`{ "pong": ${Date.now()} }`);
              this.emit("ping", data);
              return;
            }

            if (data.ackCode) {
              this.emit("ack", data);
              return;
            }

            log("socket.onmessage", event);
            const platformData = data as PlatformData;
            this.emit("message", platformData);

            if (platformData?.meta?.requestID) {
              this.emit(String(platformData.meta.requestID), platformData);
            }
          }
          catch (error) {
            log("error", "Error processing message:", error);
            this.emit("messageError", error);
          }
        };

        socket.onclose = (e: CloseEvent) => {
          log("Websocket Close:", e.reason);
          socket.onopen = null;
          socket.onclose = null;
          socket.onerror = null;
          socket.onmessage = null;

          this.emit("close", e);

          // normal close (probably from calling the close() method)
          if (e.code === 1000) return;

          if (attempts > 0) {
            reject(e); // cause retry to try again
          }
        };

        socket.onerror = (e: Event) => {
          log("Websocket Error:", e);
          this.emit("socketError", e);
        };
      }), this._retryOptions);
  }

  send(data: ApplicationData) {
    if (!this.isOpen) {
      throw new Error("WebSocket connection not established");
    }
    if (data instanceof Object && !data.meta?.oauthToken) {
      data.meta.oauthToken = this.access_token;
    }
    if (data instanceof Object && !data.meta?.deviceID) {
      data.meta.deviceID = this.deviceID;
    }
    this.json(data);
  }

  json(obj: unknown) {
    this._socket?.send(JSON.stringify(obj));
  }

  async sendAndGetResponse(
    applicationData: ApplicationData,
  ): Promise<PlatformData> {
    if (!this.isOpen) {
      throw new Error("WebSocket connection not established");
    }
    const meta = applicationData.meta;
    const reqId = meta.requestID as string;
    meta.oauthToken = this.access_token;
    if (
      (meta.deviceID === null || meta.deviceID === "00000000-0000-0000-0000-000000000000") && this.deviceID !== null
    ) {
      meta.deviceID = this.deviceID;
    }
    const promise = this.waitFor(reqId, ["messageError", "socketError", "close"]);
    this._socket?.send(JSON.stringify(applicationData));
    const message = (await promise) as PlatformData;
    const messageCode = message.meta?.messageCode;
    if (messageCode && helpers.isNonCritical(messageCode)) {
      return message;
    }
    else {
      throw new PlatformResponseError(message);
    }
  }

  close(code?: number, reason?: string): void {
    if (this._refresher) {
      global.clearTimeout(this._refresher);
      this._refresher = null;
    }

    this._socket?.close(code, reason);
  }

  [Symbol.dispose]() {
    if (this._refresher) {
      clearTimeout(this._refresher);
    }
  }
}
