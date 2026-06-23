import { IsIn, IsOptional, IsString } from "class-validator";

export class UpdateCareTaskStatusDto {
  @IsIn(["in_progress", "completed", "exception"])
  status: string;

  @IsString()
  @IsOptional()
  note?: string;
}
