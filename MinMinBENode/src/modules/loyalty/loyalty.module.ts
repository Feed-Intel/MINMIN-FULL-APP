import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { LoyaltyController } from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';
import { CustomerLoyalty } from '../../database/entities/customer-loyalty.entity';
import { TenantLoyalty } from '../../database/entities/tenant-loyalty.entity';
import { LoyaltyTransaction } from '../../database/entities/loyalty-transaction.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { User } from '../../database/entities/user.entity';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerLoyalty,
      TenantLoyalty,
      LoyaltyTransaction,
      Tenant,
      User,
    ]),
    JwtModule.register({ secret: process.env.JWT_SECRET ?? 'change-me' }),
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService, ApiKeyGuard, JwtGuard],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
