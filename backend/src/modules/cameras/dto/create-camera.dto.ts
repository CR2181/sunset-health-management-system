import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCameraDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  floor: string;

  @IsString()
  @IsNotEmpty()
  area: string;

  @IsIn(["公共走廊", "活动区", "出入口", "护理站", "康复区", "餐厅"])
  purpose: string;

  @IsIn(["RTSP", "ONVIF", "NVR", "Demo Video"])
  accessType: string;

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
