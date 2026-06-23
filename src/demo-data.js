(function initDemoData(global) {
  const cameras = [
    {
      id: "demo-camera-1",
      businessCode: "CAM-DEMO-001",
      name: "4F 认知照护走廊",
      floor: "4F",
      area: "认知照护走廊",
      purpose: "公共走廊",
      accessType: "RTSP",
      stream: "rtsp://username:password@192.168.1.100:554/stream1",
      aiEnabled: true,
      maskedDisplay: true,
      status: "online",
      lastHeartbeatAt: "2026-06-23T09:30:00+08:00",
      note: "仅为合法自有设备配置示例，不连接真实视频。"
    },
    {
      id: "demo-camera-2",
      businessCode: "CAM-DEMO-002",
      name: "1F 康复训练区",
      floor: "1F",
      area: "康复区",
      purpose: "康复区",
      accessType: "Demo Video",
      stream: "/demo-videos/fall-demo.mp4",
      aiEnabled: true,
      maskedDisplay: true,
      status: "demo",
      lastHeartbeatAt: "2026-06-23T09:25:00+08:00",
      note: "本地演示视频，不提交视频文件到 Git。"
    }
  ];

  const aiEvents = [
    {
      id: "demo-ai-1",
      businessCode: "AI-DEMO-001",
      eventType: "fall",
      confidence: 0.96,
      cameraCode: "CAM-DEMO-002",
      residentCode: "RES-002",
      location: "1F 康复训练区",
      detectedAt: "2026-06-23T09:12:00+08:00",
      status: "pending",
      reviewer: "",
      reviewedAt: null,
      evidenceUrl: "/demo-videos/fall-demo.mp4"
    },
    {
      id: "demo-ai-2",
      businessCode: "AI-DEMO-002",
      eventType: "leaving_bed",
      confidence: 0.89,
      cameraCode: "CAM-DEMO-001",
      residentCode: "RES-001",
      location: "4F 护理区",
      detectedAt: "2026-06-23T08:48:00+08:00",
      status: "confirmed",
      reviewer: "试点护理员",
      reviewedAt: "2026-06-23T08:50:00+08:00",
      evidenceUrl: "/demo-videos/leaving-bed-demo.mp4"
    },
    {
      id: "demo-ai-3",
      businessCode: "AI-DEMO-003",
      eventType: "wandering",
      confidence: 0.81,
      cameraCode: "CAM-DEMO-001",
      residentCode: null,
      location: "4F 公共走廊",
      detectedAt: "2026-06-23T08:20:00+08:00",
      status: "false_positive",
      reviewer: "试点护士长",
      reviewedAt: "2026-06-23T08:26:00+08:00",
      evidenceUrl: "/demo-videos/wandering-demo.mp4"
    }
  ];

  global.YianDemoData = { cameras, aiEvents };
})(typeof globalThis !== "undefined" ? globalThis : window);
