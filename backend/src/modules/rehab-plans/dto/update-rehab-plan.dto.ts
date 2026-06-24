import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateRehabPlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  residentCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  goal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  riskNote?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  frequency?: string;
}
