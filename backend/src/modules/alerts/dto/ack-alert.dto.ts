import { IsNotEmpty, IsString } from "class-validator";

export class AckAlertDto {
  @IsString()
  @IsNotEmpty()
  responderName: string;
}
