import { IsOptional, IsString } from 'class-validator';

export class RegisterCustomerDto {
  @IsString()
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
