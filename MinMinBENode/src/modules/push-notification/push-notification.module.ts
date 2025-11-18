import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { PushNotificationController } from './push-notification.controller';
import { PushNotificationService } from './push-notification.service';
import { PushNotification } from '../../database/entities/push-notification.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([PushNotification, Tenant]),
    JwtModule.register({ secret: process.env.JWT_SECRET ?? 'change-me' }),
  ],
  controllers: [PushNotificationController],
  providers: [PushNotificationService, ApiKeyGuard, JwtGuard],
  exports: [PushNotificationService],
})
export class PushNotificationModule {}
