import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateRehabTaskStatusDto {
  @IsIn(["in_progress", "completed", "skipped", "exception"])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  operatorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
