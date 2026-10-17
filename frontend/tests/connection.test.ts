import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_BUFFERED_BYTES, ServerConnection, reconnectDelay } from "../src/connection";

/** A stand-in for the browser's WebSocket that we control from the test. */
class FakeWebSocket {
  static readonly OPEN = 1;
  static instances: FakeWebSocket[] = [];

  readyState = 0;
  bufferedAmount = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }
}

const ping = { type: "ping", sent_at: 1 } as const;

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeWebSocket);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function connect() {
  const onMessage = vi.fn();
  const onStatus = vi.fn();
  const connection = new ServerConnection("ws://test/ws", onMessage, onStatus);
  connection.connect();
  const socket = FakeWebSocket.instances.at(-1);
  if (!socket) throw new Error("no socket created");
  return { connection, socket, onMessage, onStatus };
}

describe("reconnectDelay", () => {
  it("doubles each attempt and caps at 10 seconds", () => {
    expect([0, 1, 2, 3, 4, 5, 10].map(reconnectDelay)).toEqual([
      500, 1000, 2000, 4000, 8000, 10_000, 10_000,
    ]);
  });
});

describe("ServerConnection", () => {
  it("drops messages until the socket is open", () => {
    const { connection, socket } = connect();

    expect(connection.send(ping)).toBe(false);
    socket.open();
    expect(connection.send(ping)).toBe(true);
    expect(socket.sent).toEqual([JSON.stringify(ping)]);
  });

  it("drops messages when the send buffer is backed up", () => {
    const { connection, socket } = connect();
    socket.open();
    socket.bufferedAmount = MAX_BUFFERED_BYTES + 1;

    expect(connection.send(ping)).toBe(false);
    expect(socket.sent).toEqual([]);
  });

  it("passes valid server messages on and ignores junk", () => {
    const { socket, onMessage } = connect();

    socket.onmessage?.({ data: '{"type":"pong","sent_at":1}' });
    socket.onmessage?.({ data: "garbage" });

    expect(onMessage).toHaveBeenCalledExactlyOnceWith({ type: "pong", sent_at: 1 });
  });

  it("reports status and reconnects after the connection drops", () => {
    const { socket, onStatus } = connect();
    socket.open();
    socket.onclose?.();

    expect(onStatus.mock.calls.map(([status]) => status as string)).toEqual([
      "connecting",
      "open",
      "closed",
    ]);
    expect(FakeWebSocket.instances).toHaveLength(1);

    vi.advanceTimersByTime(reconnectDelay(0));
    expect(FakeWebSocket.instances).toHaveLength(2);
  });
});
