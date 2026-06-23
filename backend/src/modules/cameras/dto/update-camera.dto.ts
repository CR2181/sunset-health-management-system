import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateCameraDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  floor?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsIn(["公共走廊", "活动区", "出入口", "护理站", "康复区", "餐厅"])
  @IsOptional()
  purpose?: string;

  @IsIn(["RTSP", "ONVIF", "NVR", "Demo Video"])
  @IsOptional()
  accessType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  stream?: string;

  @IsBoolean()
  @IsOptional()
  aiEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  maskedDisplay?: boolean;

  @IsIn(["online", "offline", "warning", "demo"])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
