import { ClientError, type ConnectionOptions } from "./types.ts";
import "./ws.ts";

export interface WebSocketManagerEvents {
  open: () => void;
  close: (reason: string) => void;
  message: (data: unknown) => void;
  error: (error: ClientError) => void;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private isClosing = false;
  private messageBuffer: unknown[] = [];
  // deno-lint-ignore ban-types
  private eventHandlers: Map<keyof WebSocketManagerEvents, Set<Function>> = new Map();

  constructor(private options: ConnectionOptions) {
    this.options.reconnectInterval = options.reconnectInterval ?? 2000;
    this.options.maxReconnectAttempts = options.maxReconnectAttempts ?? Infinity;
    this.options.bufferSize = options.bufferSize ?? 100;
  }

  on<K extends keyof WebSocketManagerEvents>(
    event: K,
    handler: WebSocketManagerEvents[K],
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off<K extends keyof WebSocketManagerEvents>(
    event: K,
    handler: WebSocketManagerEvents[K],
  ): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit<K extends keyof WebSocketManagerEvents>(
    event: K,
    ...args: Parameters<WebSocketManagerEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(...args);
        }
        catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      }
    }
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isClosing = false;

    try {
      const url = new URL(this.options.url);

      if (this.options.auth) {
        const params = new URLSearchParams();
        if (this.options.auth.client_id) {
          params.set("client_id", this.options.auth.client_id);
        }
        if (this.options.auth.client_secret) {
          params.set("client_secret", this.options.auth.client_secret);
        }
        url.search = params.toString();
      }

      let options: { headers: { Origin: string } } | undefined = undefined;
      if (typeof Deno !== "undefined") {
        const baseURL = `${url.protocol === "wss:" ? "https" : "http"}://${url.host}`;
        options = { headers: { Origin: baseURL } };
      }

      // @ts-ignore - ws library accepts options as third parameter, browser ignores extra params
      this.ws = new globalThis.WebSocket(url.toString(), undefined, options);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.flushMessageBuffer();
        this.emit("open");
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit("message", data);
        }
        catch (error) {
          console.error("Failed to parse WebSocket message:", error);
          this.emit(
            "error",
            new ClientError(
              "Failed to parse message",
              "WEBSOCKET_ERROR",
              { originalData: event.data, error },
            ),
          );
        }
      };

      this.ws.onerror = (event) => {
        console.error("WebSocket error:", event);
        this.emit(
          "error",
          new ClientError(
            "WebSocket error occurred",
            "WEBSOCKET_ERROR",
            event,
          ),
        );
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
        this.ws = null;

        if (!this.isClosing && this.shouldReconnect()) {
          this.scheduleReconnect();
        }

        this.emit("close", event.reason || "Connection closed");
      };

      await this.waitForConnection();
    }
    catch (error) {
      throw new ClientError(
        `Failed to connect to WebSocket: ${error}`,
        "CONNECTION_FAILED",
        error,
      );
    }
  }

  private waitForConnection(timeout = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = 100;
      let elapsed = 0;

      const check = () => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          resolve();
        }
        else if (elapsed >= timeout) {
          reject(
            new ClientError(
              "Connection timeout",
              "CONNECTION_FAILED",
              { timeout },
            ),
          );
        }
        else {
          elapsed += checkInterval;
          setTimeout(check, checkInterval);
        }
      };

      check();
    });
  }

  private shouldReconnect(): boolean {
    return this.reconnectAttempts < (this.options.maxReconnectAttempts ?? Infinity);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.options.reconnectInterval! * Math.pow(1.5, this.reconnectAttempts - 1),
      30000,
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
      });
    }, delay);
  }

  private flushMessageBuffer(): void {
    while (this.messageBuffer.length > 0 && this.isConnected()) {
      const message = this.messageBuffer.shift();
      if (message) {
        try {
          this.send(message);
        }
        catch (error) {
          console.error("Failed to send buffered message:", error);
        }
      }
    }
  }

  send(data: unknown): void {
    if (!this.isConnected()) {
      if (this.messageBuffer.length < (this.options.bufferSize ?? 100)) {
        this.messageBuffer.push(data);
        console.log("Message buffered, will send when reconnected");
        return;
      }
      else {
        throw new ClientError(
          "WebSocket is not connected and buffer is full",
          "CONNECTION_FAILED",
        );
      }
    }

    try {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      this.ws!.send(message);
    }
    catch (error) {
      throw new ClientError(
        "Failed to send message",
        "WEBSOCKET_ERROR",
        error,
      );
    }
  }

  disconnect(): void {
    this.isClosing = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, "Client disconnect");
      }
      this.ws = null;
    }

    this.messageBuffer = [];
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}
