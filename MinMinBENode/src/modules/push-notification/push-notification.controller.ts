import { Body, Controller, Post } from '@nestjs/common';

import { PushNotificationService } from './push-notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@Controller('push')
export class PushNotificationController {
  constructor(private readonly pushNotificationService: PushNotificationService) {}

  @Post('send')
  send(@Body() payload: SendNotificationDto) {
    return this.pushNotificationService.send(payload);
  }
}
