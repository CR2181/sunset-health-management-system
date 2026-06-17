import { IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateAiEventDto {
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsString()
  @IsOptional()
  externalEventId?: string;

  @IsString()
  @IsNotEmpty()
  cameraCode: string;

  @IsString()
  @IsOptional()
  residentCode?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsIn(["low", "medium", "high", "critical"])
  level: string;

  @IsString()
  @IsOptional()
  eventTime?: string;

  @IsString()
  @IsOptional()
  modelVersion?: string;

  @IsString()
  @IsOptional()
  evidenceUrl?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  confidence?: number;

  @IsObject()
  @IsOptional()
  evidence?: Record<string, unknown>;
}
