// Loads MediaPipe's hand-landmark model. Everything is self-hosted: the
// WebAssembly runtime is bundled from node_modules by Vite and the model is
// downloaded at build time (scripts/fetch-model.mjs), so no CDN is needed.
import { HandLandmarker } from "@mediapipe/tasks-vision";
import wasmLoaderPath from "@mediapipe/tasks-vision/vision_wasm_internal.js?url";
import wasmBinaryPath from "@mediapipe/tasks-vision/vision_wasm_internal.wasm?url";

const MODEL_PATH = "/models/hand_landmarker.task";

function options(delegate: "GPU" | "CPU") {
  return {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: "VIDEO" as const,
    numHands: 2,
  };
}

export async function createHandTracker(): Promise<HandLandmarker> {
  const fileset = { wasmLoaderPath, wasmBinaryPath };
  try {
    return await HandLandmarker.createFromOptions(fileset, options("GPU"));
  } catch (error) {
    console.warn("GPU unavailable for hand tracking, falling back to CPU.", error);
    return HandLandmarker.createFromOptions(fileset, options("CPU"));
  }
}
