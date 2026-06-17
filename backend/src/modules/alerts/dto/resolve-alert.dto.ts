import { IsNotEmpty, IsString } from "class-validator";

export class ResolveAlertDto {
  @IsString()
  @IsNotEmpty()
  resolutionNote: string;
}
