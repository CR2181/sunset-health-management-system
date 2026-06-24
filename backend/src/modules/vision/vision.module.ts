import { Module } from "@nestjs/common";
import { AccessPolicyModule } from "../../common/access-policy.module";
import { AiEventsModule } from "../ai-events/ai-events.module";
import { AlertsModule } from "../alerts/alerts.module";
import { AuditModule } from "../audit/audit.module";
import { DETECTOR_ADAPTER } from "./adapters/detector.adapter";
import { MockDetectorAdapter } from "./adapters/mock-detector.adapter";
import { VisionController } from "./vision.controller";
import { VisionService } from "./vision.service";

@Module({
  imports: [AccessPolicyModule, AiEventsModule, AlertsModule, AuditModule],
  controllers: [VisionController],
  providers: [MockDetectorAdapter, VisionService, { provide: DETECTOR_ADAPTER, useExisting: MockDetectorAdapter }],
  exports: [VisionService]
})
export class VisionModule {}
