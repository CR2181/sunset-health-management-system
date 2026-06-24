import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class SubmitFrameDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  sourceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  cameraCode?: string;

  @IsString()
  @MaxLength(120)
  location: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  residentCode?: string;

  @IsOptional()
  @IsDateString()
  capturedAt?: string;

  @IsOptional()
  @IsString()
  imageDataUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  imagePath?: string;

  @IsOptional()
  @IsIn(["fall", "possible_fall", "leaving_bed", "wandering", "boundary_crossing", "stillness", "unknown"])
  testEventType?: "fall" | "possible_fall" | "leaving_bed" | "wandering" | "boundary_crossing" | "stillness" | "unknown";

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  testConfidence?: number;
}
