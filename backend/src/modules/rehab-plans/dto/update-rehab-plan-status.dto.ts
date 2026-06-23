import { IsIn } from "class-validator";

export class UpdateRehabPlanStatusDto {
  @IsIn(["active", "paused", "archived"])
  status: string;
}
