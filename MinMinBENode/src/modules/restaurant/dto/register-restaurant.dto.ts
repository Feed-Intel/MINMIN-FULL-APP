import { IsOptional, IsString } from 'class-validator';

export class RegisterRestaurantDto {
  @IsString()
  name!: string;

  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;
}
