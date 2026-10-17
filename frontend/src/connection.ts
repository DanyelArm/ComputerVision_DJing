// WebSocket client that reconnects on its own and never lets stale frames pile up.
import { parseServerMessage, type ClientMessage, type ServerMessage } from "./protocol";

export type ConnectionStatus = "connecting" | "open" | "closed";

/** Exponential backoff: 0.5 s, 1 s, 2 s, 4 s, ... capped at 10 s. */
export function reconnectDelay(attempt: number): number {
  return Math.min(500 * 2 ** attempt, 10_000);
}

/**
 * If more than this is still waiting to be sent, the network is behind. For
 * real-time hand data an old frame is worthless, so we drop new frames instead
 * of queueing them (queueing would add ever-growing lag).
 */
export const MAX_BUFFERED_BYTES = 64 * 1024;

export class ServerConnection {
  private socket: WebSocket | null = null;
  private attempt = 0;

  constructor(
    private readonly url: string,
    private readonly onMessage: (message: ServerMessage) => void,
    private readonly onStatus: (status: ConnectionStatus) => void,
  ) {}

  connect(): void {
    this.onStatus("connecting");
    const socket = new WebSocket(this.url);
    socket.onopen = () => {
      this.attempt = 0;
      this.onStatus("open");
    };
    socket.onmessage = (event: MessageEvent<string>) => {
      const message = parseServerMessage(event.data);
      if (message) this.onMessage(message);
    };
    socket.onclose = () => {
      this.onStatus("closed");
      setTimeout(() => {
        this.connect();
      }, reconnectDelay(this.attempt++));
    };
    this.socket = socket;
  }

  /** Sends a message; returns false if it was dropped (not connected, or backed up). */
  send(message: ClientMessage): boolean {
    const socket = this.socket;
    if (socket?.readyState !== WebSocket.OPEN || socket.bufferedAmount > MAX_BUFFERED_BYTES) {
      return false;
    }
    socket.send(JSON.stringify(message));
    return true;
  }
}
