import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCareTaskDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  meta?: string;

  @IsString()
  @MaxLength(30)
  residentCode: string;

  @IsString()
  @MaxLength(30)
  room: string;

  @IsString()
  @MaxLength(50)
  assigneeName: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsIn(["pending", "in_progress", "overdue"])
  status?: string;
}
