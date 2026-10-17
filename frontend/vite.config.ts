import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    // Build straight into the Python package so FastAPI serves it and it
    // ships inside the wheel / Docker image.
    outDir: "../src/cvdj/static",
    emptyOutDir: true,
  },
  server: {
    // `npm run dev` serves the frontend with hot reload on :5173 and forwards
    // API traffic to the Python backend on :8000.
    proxy: {
      "/ws": { target: "ws://127.0.0.1:8000", ws: true },
      "/health": "http://127.0.0.1:8000",
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
