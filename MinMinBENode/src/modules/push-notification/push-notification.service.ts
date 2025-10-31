import { Injectable } from '@nestjs/common';

import { SendNotificationDto } from './dto/send-notification.dto';

@Injectable()
export class PushNotificationService {
  async send(payload: SendNotificationDto) {
    return {
      status: 'queued',
      notification: payload,
      queuedAt: new Date().toISOString(),
    };
  }
}
