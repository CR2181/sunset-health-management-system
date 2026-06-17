import { IsArray, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";

export class UpdateResidentDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  room?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  risk?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  detail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  careLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  familyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  familyContactPhone?: string;

  @IsOptional()
  @IsArray()
  riskTags?: string[];
}
