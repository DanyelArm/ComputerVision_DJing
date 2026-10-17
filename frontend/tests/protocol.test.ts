import type { HandLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { describe, expect, it } from "vitest";
import { parseServerMessage, toHandsMessage } from "../src/protocol";

function landmark(x: number, y: number, z: number): NormalizedLandmark {
  return { x, y, z, visibility: 0 };
}

function category(categoryName: string, score: number) {
  return { categoryName, score, index: 0, displayName: "" };
}

function result(
  hands: { label: string; score: number; points: NormalizedLandmark[] }[],
): HandLandmarkerResult {
  return {
    landmarks: hands.map((h) => h.points),
    worldLandmarks: [],
    handedness: hands.map((h) => [category(h.label, h.score)]),
    handednesses: [],
  };
}

describe("toHandsMessage", () => {
  it("returns an empty hands list when nothing is detected", () => {
    expect(toHandsMessage(result([]), 1000, 16 / 9)).toEqual({
      type: "hands",
      timestamp: 1000,
      aspect_ratio: 1.7778,
      hands: [],
    });
  });

  it("swaps MediaPipe's mirrored handedness labels", () => {
    const message = toHandsMessage(
      result([
        { label: "Left", score: 0.9, points: [] },
        { label: "Right", score: 0.8, points: [] },
      ]),
      0,
      1,
    );

    expect(message.hands.map((h) => h.handedness)).toEqual(["Right", "Left"]);
  });

  it("rounds coordinates, score and timestamp to keep messages small", () => {
    const message = toHandsMessage(
      result([{ label: "Left", score: 0.987654, points: [landmark(0.123456, 0.5, -0.0123456)] }]),
      1234.56,
      1,
    );

    expect(message).toEqual({
      type: "hands",
      timestamp: 1235,
      aspect_ratio: 1,
      hands: [{ handedness: "Right", score: 0.9877, landmarks: [[0.1235, 0.5, -0.0123]] }],
    });
  });

  it("skips a hand with an unknown handedness label", () => {
    const message = toHandsMessage(result([{ label: "Unknown", score: 0.9, points: [] }]), 0, 1);

    expect(message.hands).toEqual([]);
  });
});

describe("parseServerMessage", () => {
  it("accepts known message types", () => {
    expect(parseServerMessage('{"type":"pong","sent_at":5}')).toEqual({
      type: "pong",
      sent_at: 5,
    });
  });

  it.each([
    ["invalid JSON", "{not json"],
    ["a non-object", "42"],
    ["a missing type", '{"sent_at":5}'],
    ["an unknown type", '{"type":"surprise"}'],
  ])("rejects %s", (_description, raw) => {
    expect(parseServerMessage(raw)).toBeNull();
  });
});
