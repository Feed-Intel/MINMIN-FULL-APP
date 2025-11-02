import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  addressLine!: string;

  @IsString()
  gpsCoordinates!: string;

  @IsIn(['home', 'office', 'other'])
  label!: 'home' | 'office' | 'other';

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
