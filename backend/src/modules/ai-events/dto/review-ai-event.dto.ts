import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ReviewAiEventDto {
  @IsIn(["confirmed", "false_positive"])
  status: string;

  @IsString()
  @MaxLength(50)
  reviewedBy: string;

  @IsOptional()
  @IsBoolean()
  isFalsePositive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}
