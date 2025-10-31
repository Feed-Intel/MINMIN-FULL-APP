import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateAccountDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}
