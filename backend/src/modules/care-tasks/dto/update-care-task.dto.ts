import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateCareTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  meta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  residentCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  room?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  assigneeName?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;
}
