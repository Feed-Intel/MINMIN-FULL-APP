import { IsEmail, IsNotEmpty, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @Length(6, 6)
  otp!: string;

  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}
