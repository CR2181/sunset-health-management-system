import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateRehabTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  residentCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  planCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  operatorName?: string;
}
