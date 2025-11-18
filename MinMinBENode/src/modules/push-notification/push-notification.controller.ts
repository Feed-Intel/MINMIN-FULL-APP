import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { PushNotificationService } from './push-notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Controller('push')
@UseGuards(ApiKeyGuard, JwtGuard)
export class PushNotificationController {
  constructor(private readonly pushNotificationService: PushNotificationService) {}

  @Post('send')
  send(@Body() payload: SendNotificationDto) {
    return this.pushNotificationService.send(payload);
  }

  @Get('tenant/:tenantId')
  list(@Param('tenantId') tenantId: string) {
    return this.pushNotificationService.list(tenantId);
  }
}
