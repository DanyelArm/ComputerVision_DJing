// The WebSocket message format shared with the Python backend
// (mirrors src/cvdj/protocol.py — keep the two in sync).
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";

/** One landmark as [x, y, z]: x and y are 0..1 fractions of the frame, z is relative depth. */
export type Point = [number, number, number];
export type Handedness = "Left" | "Right";

export interface Hand {
  handedness: Handedness;
  score: number;
  /** 21 points, in MediaPipe's order: 0 = wrist, 4 = thumb tip, 8 = index tip, ... */
  landmarks: Point[];
}

// Browser -> server
export interface HandsMessage {
  type: "hands";
  timestamp: number;
  /** Frame width / height, so the server can put x and y in the same units. */
  aspect_ratio: number;
  hands: Hand[];
}
export interface PingMessage {
  type: "ping";
  sent_at: number;
}
export type ClientMessage = HandsMessage | PingMessage;

// Server -> browser
export interface HandFeatures {
  handedness: Handedness;
  /** Thumb-tip to index-tip distance, relative to hand size: ~0 pinched, ~1+ open. */
  pinch: number;
}
export interface HandFeaturesMessage {
  type: "hand_features";
  timestamp: number;
  hands: HandFeatures[];
}
export interface PongMessage {
  type: "pong";
  sent_at: number;
}
export interface ErrorMessage {
  type: "error";
  detail: string;
}
export type ServerMessage = HandFeaturesMessage | PongMessage | ErrorMessage;

// 4 decimals is ~0.1 px on a 1280 px frame: plenty of precision, and it
// roughly halves the size of each message compared with full float64 output.
const PRECISION = 1e4;
const round = (value: number): number => Math.round(value * PRECISION) / PRECISION;

// MediaPipe labels handedness as if the image were mirrored (a selfie camera).
// Our frames are not mirrored, so the labels come out swapped.
const ACTUAL_HAND: Record<string, Handedness> = { Left: "Right", Right: "Left" };

export function toHandsMessage(
  result: HandLandmarkerResult,
  timestamp: number,
  aspectRatio: number,
): HandsMessage {
  const hands: Hand[] = [];
  result.landmarks.forEach((landmarks, i) => {
    const category = result.handedness[i]?.[0];
    const handedness = category ? ACTUAL_HAND[category.categoryName] : undefined;
    if (!category || !handedness) return;
    hands.push({
      handedness,
      score: round(category.score),
      landmarks: landmarks.map((p) => [round(p.x), round(p.y), round(p.z)]),
    });
  });
  return {
    type: "hands",
    timestamp: Math.round(timestamp),
    aspect_ratio: round(aspectRatio),
    hands,
  };
}

const SERVER_MESSAGE_TYPES = new Set(["hand_features", "pong", "error"]);

/** Parses a message from the server; returns null for anything unrecognised. */
export function parseServerMessage(raw: string): ServerMessage | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    typeof data.type === "string" &&
    SERVER_MESSAGE_TYPES.has(data.type)
  ) {
    return data as ServerMessage;
  }
  return null;
}
