import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AccessPolicyModule } from "../../common/access-policy.module";
import { AiEventsModule } from "../ai-events/ai-events.module";
import { AlertsModule } from "../alerts/alerts.module";
import { AuditModule } from "../audit/audit.module";
import { DETECTOR_ADAPTER } from "./adapters/detector.adapter";
import { MockDetectorAdapter } from "./adapters/mock-detector.adapter";
import { LocalYoloDetectorAdapter } from "./adapters/local-yolo-detector.adapter";
import { LLM_ADAPTER } from "./adapters/llm.adapter";
import { NoopLlmAdapter } from "./adapters/noop-llm.adapter";
import { VisionController } from "./vision.controller";
import { VisionService } from "./vision.service";

@Module({
  imports: [AccessPolicyModule, AiEventsModule, AlertsModule, AuditModule],
  controllers: [VisionController],
  providers: [
    MockDetectorAdapter,
    LocalYoloDetectorAdapter,
    NoopLlmAdapter,
    VisionService,
    {
      provide: DETECTOR_ADAPTER,
      inject: [ConfigService, LocalYoloDetectorAdapter, MockDetectorAdapter],
      useFactory: (config: ConfigService, localYolo: LocalYoloDetectorAdapter, mock: MockDetectorAdapter) =>
        config.get<string>("AI_DETECTOR_MODE", "mock") === "local_yolo" ? localYolo : mock
    },
    { provide: LLM_ADAPTER, useExisting: NoopLlmAdapter }
  ],
  exports: [VisionService]
})
export class VisionModule {}
