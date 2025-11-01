import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';

import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { CheckOtpDto } from './dto/check-otp.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Controller('accounts')
@UseGuards(ApiKeyGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('register')
  register(@Body() payload: CreateAccountDto) {
    return this.accountsService.register(payload);
  }

  @Post('verify-otp')
  verifyOtp(@Body() payload: VerifyOtpDto) {
    return this.accountsService.verifyOtp(payload);
  }

  @Post('check-otp')
  checkOtp(@Body() payload: CheckOtpDto) {
    return this.accountsService.checkOtp(payload);
  }

  @Post('login')
  login(@Body() payload: LoginDto) {
    return this.accountsService.login(payload);
  }

  @Post('token/refresh')
  refreshToken(@Body() payload: RefreshTokenDto) {
    return this.accountsService.refreshToken(payload);
  }

  @Post('password-reset/request')
  requestPasswordReset(@Body() payload: RequestPasswordResetDto) {
    return this.accountsService.requestPasswordReset(payload);
  }

  @Post('password-reset/verify')
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.accountsService.resetPassword(payload);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  logout(@Req() request: any) {
    return this.accountsService.logout(request.user.sub);
  }

  @Get('users')
  @UseGuards(JwtGuard)
  findAll() {
    return this.accountsService.findAll();
  }

  @Get('user/:id')
  @UseGuards(JwtGuard)
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Put('user/:id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body() payload: UpdateAccountDto) {
    return this.accountsService.update(id, payload);
  }

  @Delete('user/:id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string) {
    return this.accountsService.remove(id);
  }
}
