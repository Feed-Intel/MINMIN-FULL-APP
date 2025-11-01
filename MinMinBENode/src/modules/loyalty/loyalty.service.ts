import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpdatePointsDto } from './dto/update-points.dto';
import { CustomerLoyalty } from '../../database/entities/customer-loyalty.entity';
import { TenantLoyalty } from '../../database/entities/tenant-loyalty.entity';
import { Tenant } from '../../database/entities/tenant.entity';
import { LoyaltyTransaction } from '../../database/entities/loyalty-transaction.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(CustomerLoyalty)
    private readonly customerLoyaltyRepository: Repository<CustomerLoyalty>,
    @InjectRepository(TenantLoyalty)
    private readonly tenantLoyaltyRepository: Repository<TenantLoyalty>,
    @InjectRepository(LoyaltyTransaction)
    private readonly loyaltyTransactionRepository: Repository<LoyaltyTransaction>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async updatePoints(
    actorId: string,
    payload: UpdatePointsDto,
  ): Promise<{ customerId: string; globalPoints: number; tenantPoints?: number }> {
    const actor = await this.loadUser(actorId);

    if (!['admin', 'restaurant', 'branch'].includes(actor.userType)) {
      throw new ForbiddenException('You are not allowed to manage loyalty points');
    }

    const customer = await this.loadUser(payload.customerId);

    let tenant = null;
    if (payload.tenantId) {
      tenant = await this.tenantRepository.findOne({ where: { id: payload.tenantId } });
      if (!tenant) {
        throw new NotFoundException('Tenant not found');
      }
    }

    const delta = payload.transactionType === 'redemption' ? -Math.abs(payload.delta) : payload.delta;

    let customerLoyalty = await this.customerLoyaltyRepository.findOne({
      where: { customer: { id: customer.id } },
    });

    const isNewCustomerLoyalty = !customerLoyalty;

    if (!customerLoyalty) {
      customerLoyalty = this.customerLoyaltyRepository.create({
        customer,
        globalPoints: 0,
      });
    }

    if (!tenant) {
      customerLoyalty.globalPoints = Math.max(
        0,
        Math.round(customerLoyalty.globalPoints + delta),
      );
    }

    if (!tenant || isNewCustomerLoyalty) {
      await this.customerLoyaltyRepository.save(customerLoyalty);
    }

    let tenantLoyalty: TenantLoyalty | undefined;

    if (tenant) {
      tenantLoyalty = await this.tenantLoyaltyRepository.findOne({
        where: { tenant: { id: tenant.id }, customer: { id: customer.id } },
      });

      if (!tenantLoyalty) {
        tenantLoyalty = this.tenantLoyaltyRepository.create({
          tenant,
          customer,
          points: 0,
        });
      }

      tenantLoyalty.points = Math.max(0, tenantLoyalty.points + delta);
      await this.tenantLoyaltyRepository.save(tenantLoyalty);
    }

    await this.loyaltyTransactionRepository.save(
      this.loyaltyTransactionRepository.create({
        tenant,
        customer,
        points: Math.abs(delta),
        transactionType: payload.transactionType,
      }),
    );

    return {
      customerId: customer.id,
      globalPoints: customerLoyalty.globalPoints,
      tenantPoints: tenantLoyalty?.points,
    };
  }

  async getCustomerSummary(customerId: string) {
    const customer = await this.loadUser(customerId);
    const global = await this.customerLoyaltyRepository.findOne({
      where: { customer: { id: customer.id } },
    });

    const tenantPoints = await this.tenantLoyaltyRepository.find({
      where: { customer: { id: customer.id } },
      relations: ['tenant'],
    });

    return {
      customerId: customer.id,
      globalPoints: global?.globalPoints ?? 0,
      tenants: tenantPoints.map((entry) => ({
        tenantId: entry.tenant.id,
        tenantName: entry.tenant.restaurantName,
        points: entry.points,
      })),
    };
  }

  async getTenantSummary(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const loyaltyEntries = await this.tenantLoyaltyRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['customer'],
    });

    return {
      tenantId,
      tenantName: tenant.restaurantName,
      customers: loyaltyEntries.map((entry) => ({
        customerId: entry.customer.id,
        email: entry.customer.email,
        points: entry.points,
      })),
    };
  }

  private async loadUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
