import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';
import { IsUUID } from 'class-validator';

export enum UserType {
  CUSTOMER = 'customer',
  RESTAURANT = 'restaurant',
  BRANCH = 'branch',
  ADMIN = 'admin',
}

export class CreateAccountDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(UserType)
  userType!: UserType;

  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  @Length(0, 15)
  tinNo?: string;

  @IsOptional()
  @IsBoolean()
  optInPromotions?: boolean;

  @IsOptional()
  @IsBoolean()
  enableEmailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  enableInAppNotifications?: boolean;
}
