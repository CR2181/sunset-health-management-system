import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateRehabPlanDto {
  @IsString()
  @MaxLength(30)
  residentCode: string;

  @IsString()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(2000)
  goal: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  riskNote?: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsString()
  @MaxLength(100)
  frequency: string;
}
