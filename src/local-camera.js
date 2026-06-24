(function initLocalCamera(global) {
  function isSupported() {
    const hostname = global.location?.hostname || "";
    const secureOrigin = global.location?.protocol === "https:" || ["localhost", "127.0.0.1", "::1"].includes(hostname);
    return Boolean(secureOrigin && global.navigator?.mediaDevices?.getUserMedia);
  }

  function createController({ video, canvas, onFrame, intervalMs = 1000 }) {
    let stream = null;
    let timer = null;
    let framePending = false;
    const delay = Math.max(500, Number(intervalMs) || 1000);

    function captureFrame() {
      if (!stream || !video || !canvas || !video.videoWidth || !video.videoHeight) return null;
      const maxWidth = 640;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.72);
    }

    async function emitFrame() {
      if (framePending || typeof onFrame !== "function") return;
      const imageDataUrl = captureFrame();
      if (!imageDataUrl) return;
      framePending = true;
      try {
        await onFrame({ imageDataUrl, capturedAt: new Date().toISOString() });
      } finally {
        framePending = false;
      }
    }

    async function start() {
      if (stream) return stream;
      if (!isSupported()) throw new Error("当前浏览器仅支持在 localhost 或 HTTPS 下使用本机摄像头。");
      stream = await global.navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        if (typeof video.play === "function") await video.play();
      }
      timer = global.setInterval(() => { void emitFrame(); }, delay);
      return stream;
    }

    function stop() {
      if (timer !== null) {
        global.clearInterval(timer);
        timer = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      if (video) {
        if (typeof video.pause === "function") video.pause();
        video.srcObject = null;
      }
      if (canvas) {
        const context = canvas.getContext("2d");
        context?.clearRect(0, 0, canvas.width, canvas.height);
      }
      framePending = false;
    }

    return {
      start,
      stop,
      captureFrame,
      isSupported,
      getState: () => ({ active: Boolean(stream), intervalMs: delay })
    };
  }

  global.YianLocalCamera = { createController, isSupported };
})(typeof globalThis !== "undefined" ? globalThis : window);
