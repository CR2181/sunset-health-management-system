import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class HeartbeatDeviceDto {
  @IsOptional()
  @IsIn(["online", "offline", "warning"])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @IsOptional()
  @IsString()
  externalDeviceId?: string;
}
