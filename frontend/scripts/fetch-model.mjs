// Downloads the MediaPipe hand-landmark model into public/models/ and verifies
// its SHA-256 checksum. Runs automatically before `npm run dev` / `npm run build`.
//
// The model (~7.5 MB) is a build input, not source code, so it isn't committed.
// Pinning the checksum guarantees every machine and CI run uses the exact same
// file, and that a corrupted or tampered download fails the build.
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const MODEL_SHA256 = "fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1";

const target = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "models",
  "hand_landmarker.task",
);

const sha256 = (data) => createHash("sha256").update(data).digest("hex");

async function hasValidModel() {
  try {
    return sha256(await readFile(target)) === MODEL_SHA256;
  } catch {
    return false;
  }
}

if (await hasValidModel()) {
  console.log("Hand landmark model already present.");
} else {
  console.log(`Downloading ${MODEL_URL}`);
  const response = await fetch(MODEL_URL);
  if (!response.ok) {
    throw new Error(`Model download failed: HTTP ${response.status}`);
  }
  const data = Buffer.from(await response.arrayBuffer());
  const actual = sha256(data);
  if (actual !== MODEL_SHA256) {
    throw new Error(`Model checksum mismatch: expected ${MODEL_SHA256}, got ${actual}`);
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);
  console.log(`Saved ${target}`);
}
