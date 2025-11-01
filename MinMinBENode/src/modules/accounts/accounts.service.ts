import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'crypto';
import { JwtService } from '@nestjs/jwt';

import { User } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { Branch } from '../../database/entities/branch.entity';
import { MailerService } from '../../common/services/mailer.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { CheckOtpDto } from './dto/check-otp.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

const MAX_FAILED_ATTEMPTS = Number(process.env.MAX_FAILED_ATTEMPTS ?? 5);
const LOCKOUT_DURATION_MINUTES = Number(process.env.LOCKOUT_DURATION ?? 15);
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES ?? 10);
const REFRESH_TOKEN_TTL = Number(process.env.REFRESH_TOKEN_TTL ?? 60 * 24 * 30);
const ACCESS_TOKEN_TTL = Number(process.env.ACCESS_TOKEN_TTL ?? 15); // minutes

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Partial<User>;
}

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly mailer: MailerService,
    private readonly jwtService: JwtService,
  ) {}

  async register(payload: CreateAccountDto): Promise<{ message: string }> {
    const email = payload.email.trim().toLowerCase();

    const existingUser = await this.usersRepository.findOne({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    let tenant: Tenant | null = null;
    if (payload.tenantId) {
      tenant = await this.tenantsRepository.findOne({
        where: { id: payload.tenantId },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
    }

    let branch: Branch | null = null;
    if (payload.branchId) {
      branch = await this.branchRepository.findOne({
        where: { id: payload.branchId },
        relations: ['admin', 'tenant'],
      });

      if (!branch) {
        throw new NotFoundException('Branch not found');
      }

      if (branch.admin) {
        throw new BadRequestException('This branch already has an assigned user.');
      }

      tenant = branch.tenant;
    }

    if (payload.userType === 'branch' && !branch) {
      throw new BadRequestException('Branch accounts require a branchId.');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 12);
    const otp = this.generateOtp();
    const hashedOtp = this.hashOtp(otp);

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      fullName: payload.fullName ?? null,
      phone: payload.phone ?? null,
      userType: payload.userType,
      birthday: payload.birthday ? new Date(payload.birthday) : null,
      tinNo: payload.tinNo ?? null,
      optInPromotions: payload.optInPromotions ?? true,
      enableEmailNotifications: payload.enableEmailNotifications ?? true,
      enableInAppNotifications: payload.enableInAppNotifications ?? true,
      otp: payload.userType === 'customer' ? hashedOtp : null,
      otpExpiry:
        payload.userType === 'customer'
          ? new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
          : null,
      tenant,
      branch,
      isActive: true,
    });

    const savedUser = await this.usersRepository.save(user);

    if (branch) {
      branch.admin = savedUser;
      await this.branchRepository.save(branch);
    }

    if (payload.userType === 'customer') {
      try {
        await this.mailer.sendMail({
          to: email,
          subject: 'Your OTP for Registration',
          text: `Your OTP is ${otp}. It is valid for ${OTP_TTL_MINUTES} minutes.`,
        });
      } catch (error) {
        await this.usersRepository.remove(savedUser);
        throw error;
      }
    }

    return {
      message:
        payload.userType === 'customer'
          ? 'Registration successful. Please verify your OTP.'
          : 'Registration successful.',
    };
  }

  async verifyOtp(payload: VerifyOtpDto): Promise<AuthTokens> {
    const email = payload.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['tenant', 'branch'],
    });

    if (!user) {
      throw new NotFoundException('Account not found');
    }

    if (!user.otp || !user.otpExpiry) {
      throw new BadRequestException('No OTP is associated with this account.');
    }

    if (user.otpExpiry.getTime() < Date.now()) {
      throw new BadRequestException('OTP expired.');
    }

    if (user.otp !== this.hashOtp(payload.otp)) {
      throw new BadRequestException('Invalid OTP.');
    }

    user.otp = null;
    user.otpExpiry = null;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    await this.usersRepository.save(user);

    return this.issueTokens(user, true);
  }

  async checkOtp(payload: CheckOtpDto): Promise<{ valid: boolean }> {
    const email = payload.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user || !user.otp || !user.otpExpiry) {
      return { valid: false };
    }

    if (user.otpExpiry.getTime() < Date.now()) {
      return { valid: false };
    }

    return { valid: user.otp === this.hashOtp(payload.otp) };
  }

  async login(payload: LoginDto): Promise<AuthTokens> {
    const email = payload.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['tenant', 'branch'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000),
      );
      throw new ForbiddenException(
        `Account is locked. Try again in ${remainingMinutes} minutes.`,
      );
    }

    if (user.otp) {
      throw new ForbiddenException(
        'Account is not verified. Please verify your email or reset your password.',
      );
    }

    if (
      (user.userType === 'restaurant' && !user.tenant) ||
      (user.userType === 'branch' && !user.branch)
    ) {
      throw new ForbiddenException(
        'Your account is not fully configured. Please contact your administrator.',
      );
    }

    const passwordValid = await bcrypt.compare(payload.password, user.password);

    if (!passwordValid) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
        await this.usersRepository.save(user);
        throw new ForbiddenException(
          'Account locked due to multiple failed attempts. Try again later.',
        );
      }
      await this.usersRepository.save(user);
      throw new UnauthorizedException('Invalid email or password.');
    }

    user.failedAttempts = 0;
    user.lockedUntil = null;
    await this.usersRepository.save(user);

    return this.issueTokens(user, true);
  }

  async logout(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.refreshTokenHash = null;
    await this.usersRepository.save(user);
  }

  async refreshToken(payload: RefreshTokenDto): Promise<AuthTokens> {
    let decoded: { sub: string };
    try {
      decoded = await this.jwtService.verifyAsync(payload.refreshToken, {
        secret:
          process.env.JWT_REFRESH_SECRET ??
          process.env.JWT_SECRET ??
          'change-me-refresh',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.usersRepository.findOne({
      where: { id: decoded.sub },
      relations: ['tenant', 'branch'],
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const match = await bcrypt.compare(
      payload.refreshToken,
      user.refreshTokenHash,
    );

    if (!match) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    return this.issueTokens(user, true);
  }

  async requestPasswordReset(
    payload: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    const email = payload.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Account not found');
    }

    const otp = this.generateOtp();
    user.otp = this.hashOtp(otp);
    user.otpExpiry = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await this.usersRepository.save(user);

    await this.mailer.sendMail({
      to: email,
      subject: 'Password reset OTP',
      text: `Use OTP ${otp} to reset your password. It expires in ${OTP_TTL_MINUTES} minutes.`,
    });

    return { message: 'OTP sent successfully.' };
  }

  async resetPassword(payload: ResetPasswordDto): Promise<{ message: string }> {
    const email = payload.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user || !user.otp || !user.otpExpiry) {
      throw new NotFoundException('Account not found or no OTP set.');
    }

    if (user.otpExpiry.getTime() < Date.now()) {
      throw new BadRequestException('OTP expired.');
    }

    if (user.otp !== this.hashOtp(payload.otp)) {
      throw new BadRequestException('Invalid OTP.');
    }

    user.password = await bcrypt.hash(payload.newPassword, 12);
    user.otp = null;
    user.otpExpiry = null;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    await this.usersRepository.save(user);

    return { message: 'Password reset successful.' };
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['tenant', 'branch'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['tenant', 'branch'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, payload: UpdateAccountDto): Promise<User> {
    const user = await this.findOne(id);

    if (payload.fullName !== undefined) {
      user.fullName = payload.fullName;
    }
    if (payload.phone !== undefined) {
      user.phone = payload.phone;
    }
    if (payload.birthday !== undefined) {
      user.birthday = payload.birthday ? new Date(payload.birthday) : null;
    }
    if (payload.tinNo !== undefined) {
      user.tinNo = payload.tinNo;
    }
    if (payload.optInPromotions !== undefined) {
      user.optInPromotions = payload.optInPromotions;
    }
    if (payload.enableEmailNotifications !== undefined) {
      user.enableEmailNotifications = payload.enableEmailNotifications;
    }
    if (payload.enableInAppNotifications !== undefined) {
      user.enableInAppNotifications = payload.enableInAppNotifications;
    }

    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  private generateOtp(): string {
    return String(randomInt(100000, 999999));
  }

  private hashOtp(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
  }

  private async issueTokens(user: User, includeRefresh = true): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      tenant: user.tenant ? user.tenant.id : null,
      branch: user.branch ? user.branch.id : null,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: `${ACCESS_TOKEN_TTL}m`,
    });

    let refreshToken = '';

    if (includeRefresh) {
      refreshToken = await this.jwtService.signAsync(payload, {
        expiresIn: `${REFRESH_TOKEN_TTL}m`,
        secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'change-me-refresh',
      });

      user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
      await this.usersRepository.save(user);
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        userType: user.userType,
      },
    };
  }
}
