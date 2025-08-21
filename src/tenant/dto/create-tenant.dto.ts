import { IsString, IsNotEmpty, IsOptional, IsObject } from "class-validator";

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  loginUrl: string;

  @IsString()
  @IsOptional()
  logoutUrl?: string;

  @IsString()
  @IsNotEmpty()
  x509cert: string;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
