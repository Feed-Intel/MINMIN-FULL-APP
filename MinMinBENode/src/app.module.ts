import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AiModule } from './modules/ai/ai.module';
import { CoreModule } from './modules/core/core.module';
import { CustomerModule } from './modules/customer/customer.module';
import { FeedModule } from './modules/feed/feed.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { PushNotificationModule } from './modules/push-notification/push-notification.module';
import { RestaurantModule } from './modules/restaurant/restaurant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<TypeOrmModuleOptions>('database'),
    }),
    CoreModule,
    AccountsModule,
    CustomerModule,
    RestaurantModule,
    FeedModule,
    LoyaltyModule,
    PushNotificationModule,
    AiModule,
  ],
})
export class AppModule {}
