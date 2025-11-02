import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  addressLine?: string;

  @IsOptional()
  @IsString()
  gpsCoordinates?: string;

  @IsOptional()
  @IsIn(['home', 'office', 'other'])
  label?: 'home' | 'office' | 'other';

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
