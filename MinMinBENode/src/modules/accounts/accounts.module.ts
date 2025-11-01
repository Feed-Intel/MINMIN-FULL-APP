import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { User } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { Branch } from '../../database/entities/branch.entity';
import { MailerService } from '../../common/services/mailer.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant, Branch]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'change-me',
    }),
  ],
  controllers: [AccountsController],
  providers: [AccountsService, MailerService, ApiKeyGuard, JwtGuard],
  exports: [AccountsService],
})
export class AccountsModule {}
