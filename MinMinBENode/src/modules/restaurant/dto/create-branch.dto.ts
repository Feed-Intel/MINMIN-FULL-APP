import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBranchDto {
  @IsUUID()
  tenantId!: string;

  @IsString()
  address!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  location?: {
    latitude: number;
    longitude: number;
  };
}
