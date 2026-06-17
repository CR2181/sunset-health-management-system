import { IsIn, IsOptional, IsString } from "class-validator";

export class UpdateCareTaskStatusDto {
  @IsIn(["pending", "in_progress", "completed", "overdue", "reviewed"])
  status: string;

  @IsString()
  @IsOptional()
  operatorName?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
