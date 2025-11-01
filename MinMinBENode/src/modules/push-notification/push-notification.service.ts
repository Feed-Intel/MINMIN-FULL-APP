import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SendNotificationDto } from './dto/send-notification.dto';
import { PushNotification } from '../../database/entities/push-notification.entity';
import { Tenant } from '../../database/entities/tenant.entity';

@Injectable()
export class PushNotificationService {
  constructor(
    @InjectRepository(PushNotification)
    private readonly notificationsRepository: Repository<PushNotification>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async send(payload: SendNotificationDto) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: payload.tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const notification = this.notificationsRepository.create({
      tenant,
      title: payload.title,
      message: payload.message,
    });

    const saved = await this.notificationsRepository.save(notification);

    // In production this is where integration with FCM/Expo/etc would happen.
    return {
      id: saved.id,
      tenantId: tenant.id,
      title: saved.title,
      message: saved.message,
      queuedAt: saved.createdAt,
    };
  }

  async list(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const notifications = await this.notificationsRepository.find({
      where: { tenant: { id: tenantId } },
      order: { createdAt: 'DESC' },
    });

    return notifications;
  }
}
