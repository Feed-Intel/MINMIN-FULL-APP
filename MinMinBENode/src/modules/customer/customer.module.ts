import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { Address } from '../../database/entities/address.entity';
import { User } from '../../database/entities/user.entity';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Address, User]),
    JwtModule.register({ secret: process.env.JWT_SECRET ?? 'change-me' }),
  ],
  controllers: [CustomerController],
  providers: [CustomerService, ApiKeyGuard, JwtGuard],
  exports: [CustomerService],
})
export class CustomerModule {}
