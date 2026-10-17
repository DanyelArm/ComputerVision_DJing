// Draws the detected hand skeletons on a canvas layered over the video.
import { DrawingUtils, HandLandmarker, type HandLandmarkerResult } from "@mediapipe/tasks-vision";

export class HandOverlay {
  private readonly context: CanvasRenderingContext2D;
  private readonly drawing: DrawingUtils;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    this.context = context;
    this.drawing = new DrawingUtils(context);
  }

  draw(result: HandLandmarkerResult, width: number, height: number): void {
    // Match the canvas resolution to the video so landmarks line up.
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.context.clearRect(0, 0, width, height);
    for (const landmarks of result.landmarks) {
      this.drawing.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
        color: "#4ade80",
        lineWidth: 3,
      });
      this.drawing.drawLandmarks(landmarks, { color: "#f472b6", radius: 3 });
    }
  }
}
