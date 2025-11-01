import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsUUID,
} from 'class-validator';

export class RegisterRestaurantDto {
  @IsString()
  restaurantName!: string;

  @IsString()
  profile!: string;

  @IsUUID()
  adminUserId!: string;

  @IsOptional()
  @IsString()
  chapaApiKey?: string;

  @IsOptional()
  @IsString()
  chapaPublicKey?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceCharge?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountLimit?: number;
}
