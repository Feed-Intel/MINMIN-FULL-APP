import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { Tenant } from '../../database/entities/tenant.entity';
import { Branch } from '../../database/entities/branch.entity';
import { User } from '../../database/entities/user.entity';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Branch, User]),
    JwtModule.register({ secret: process.env.JWT_SECRET ?? 'change-me' }),
  ],
  controllers: [RestaurantController],
  providers: [RestaurantService, ApiKeyGuard, JwtGuard],
  exports: [RestaurantService],
})
export class RestaurantModule {}
