import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";

export class CreateDeviceEventDto {
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsString()
  @IsOptional()
  externalEventId?: string;

  @IsString()
  @IsNotEmpty()
  sourceType: string;

  @IsString()
  @IsNotEmpty()
  deviceCode: string;

  @IsString()
  @IsOptional()
  residentCode?: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  eventTime?: string;

  @IsIn(["low", "medium", "high", "critical"])
  level: string;

  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>;
}
