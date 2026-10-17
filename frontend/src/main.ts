// Wires the pieces together: camera -> hand tracker -> overlay + server.
import "./style.css";
import { startCamera } from "./camera";
import { ServerConnection, type ConnectionStatus } from "./connection";
import { createHandTracker } from "./handTracker";
import { HandOverlay } from "./overlay";
import { toHandsMessage, type ServerMessage } from "./protocol";

/** Looks up an element and checks at runtime that it is the expected kind. */
function element<T extends HTMLElement>(id: string, kind: new () => T): T {
  const found = document.getElementById(id);
  if (!(found instanceof kind)) throw new Error(`#${id} in index.html is missing or wrong type`);
  return found;
}

const video = element("video", HTMLVideoElement);
const canvas = element("overlay", HTMLCanvasElement);
const startButton = element("start", HTMLButtonElement);
const serverStatus = element("server-status", HTMLSpanElement);
const latency = element("latency", HTMLSpanElement);
const fps = element("fps", HTMLSpanElement);
const trackerStatus = element("tracker-status", HTMLSpanElement);
const features = element("features", HTMLParagraphElement);

function showServerStatus(status: ConnectionStatus): void {
  serverStatus.textContent = status;
  serverStatus.className = status === "open" ? "ok" : "bad";
}

function handleServerMessage(message: ServerMessage): void {
  switch (message.type) {
    case "pong":
      latency.textContent = `${String(Math.round(performance.now() - message.sent_at))} ms`;
      break;
    case "hand_features":
      features.textContent =
        message.hands.length === 0
          ? "no hands"
          : message.hands.map((h) => `${h.handedness}: pinch ${h.pinch.toFixed(2)}`).join("   ");
      break;
    case "error":
      console.error("Server rejected a message:", message.detail);
      break;
  }
}

const protocol = location.protocol === "https:" ? "wss" : "ws";
const connection = new ServerConnection(
  `${protocol}://${location.host}/ws`,
  handleServerMessage,
  showServerStatus,
);
connection.connect();
setInterval(() => connection.send({ type: "ping", sent_at: performance.now() }), 1000);

async function start(): Promise<void> {
  startButton.disabled = true;
  trackerStatus.textContent = "Loading model and camera…";
  try {
    const [tracker] = await Promise.all([createHandTracker(), startCamera(video)]);
    const overlay = new HandOverlay(canvas);
    trackerStatus.textContent = "Tracking";

    let lastVideoTime = -1;
    let frames = 0;
    let windowStart = performance.now();

    const loop = (): void => {
      // Only run the model when the camera has produced a new frame.
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const now = performance.now();
        const result = tracker.detectForVideo(video, now);
        overlay.draw(result, video.videoWidth, video.videoHeight);
        connection.send(toHandsMessage(result, now, video.videoWidth / video.videoHeight));

        frames++;
        if (now - windowStart >= 1000) {
          fps.textContent = String(frames);
          frames = 0;
          windowStart = now;
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  } catch (error) {
    trackerStatus.textContent = `Could not start: ${String(error)}`;
    startButton.disabled = false;
  }
}

startButton.addEventListener("click", () => {
  void start();
});
