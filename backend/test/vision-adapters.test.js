const assert = require("node:assert/strict");
const test = require("node:test");

const { runDetectorWithFallback } = require("../dist/modules/vision/adapters/detector-fallback.js");
const { LocalYoloDetectorAdapter } = require("../dist/modules/vision/adapters/local-yolo-detector.adapter.js");
const { MockDetectorAdapter } = require("../dist/modules/vision/adapters/mock-detector.adapter.js");
const { NoopLlmAdapter } = require("../dist/modules/vision/adapters/noop-llm.adapter.js");

const frame = {
  sourceId: "test",
  cameraCode: "LOCAL-WEBCAM",
  location: "test area",
  capturedAt: new Date(),
  testEventType: "fall",
  testConfidence: 0.9
};

test("local YOLO adapter degrades to unavailable when its service fails", async () => {
  const config = { get: (name, fallback) => name === "AI_SERVICE_URL" ? "http://127.0.0.1:1" : fallback };
  const originalFetch = global.fetch;
  global.fetch = async () => { throw new Error("offline"); };
  try {
    const result = await new LocalYoloDetectorAdapter(config).detect(frame);
    assert.deepEqual(result, { status: "unavailable", detections: [] });
  } finally {
    global.fetch = originalFetch;
  }
});

test("detector runner uses mock only when fallback is enabled", async () => {
  const unavailable = { name: "local_yolo", detect: async () => ({ status: "unavailable", detections: [] }) };
  const mock = new MockDetectorAdapter();
  const fallback = await runDetectorWithFallback(unavailable, mock, frame, true);
  const noFallback = await runDetectorWithFallback(unavailable, mock, frame, false);
  assert.equal(fallback.detectorName, "mock");
  assert.equal(fallback.result.detections[0].eventType, "fall");
  assert.equal(noFallback.detectorName, "local_yolo");
  assert.equal(noFallback.result.status, "unavailable");
});

test("noop LLM returns no summary without throwing", async () => {
  assert.equal(await new NoopLlmAdapter().summarize({ eventType: "fall", confidence: 0.9, location: "test" }), null);
});
