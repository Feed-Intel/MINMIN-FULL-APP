import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tenant } from '../../database/entities/tenant.entity';
import { Branch } from '../../database/entities/branch.entity';
import { User } from '../../database/entities/user.entity';
import { RegisterRestaurantDto } from './dto/register-restaurant.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async listTenants(requestUserId: string): Promise<Tenant[]> {
    const user = await this.loadUser(requestUserId);

    if (user.userType === 'admin' || user.userType === 'customer') {
      return this.tenantRepository.find({ relations: ['branches'] });
    }

    if (user.userType === 'restaurant' && user.tenant) {
      return this.tenantRepository.find({
        where: { id: user.tenant.id },
        relations: ['branches'],
      });
    }

    if (user.userType === 'branch' && user.branch) {
      return this.tenantRepository.find({
        where: { id: user.branch.tenant.id },
        relations: ['branches'],
      });
    }

    return [];
  }

  async getTenant(id: string, requestUserId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['branches', 'admin'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const user = await this.loadUser(requestUserId);

    if (user.userType === 'admin' || user.userType === 'customer') {
      return tenant;
    }

    if (user.userType === 'restaurant' && user.tenant?.id === tenant.id) {
      return tenant;
    }

    if (user.userType === 'branch' && user.branch?.tenant.id === tenant.id) {
      return tenant;
    }

    throw new ForbiddenException();
  }

  async registerTenant(
    requestUserId: string,
    payload: RegisterRestaurantDto,
  ): Promise<Tenant> {
    const requester = await this.loadUser(requestUserId);
    if (requester.userType !== 'admin') {
      throw new ForbiddenException('Only administrators can create tenants.');
    }

    const adminUser = await this.usersRepository.findOne({
      where: { id: payload.adminUserId },
      relations: ['tenant'],
    });

    if (!adminUser) {
      throw new NotFoundException('Admin user not found');
    }

    if (adminUser.tenant) {
      throw new BadRequestException('User already manages another tenant.');
    }

    const tenant = this.tenantRepository.create({
      restaurantName: payload.restaurantName,
      profile: payload.profile,
      admin: adminUser,
      chapaApiKey: payload.chapaApiKey ?? null,
      chapaPublicKey: payload.chapaPublicKey ?? null,
      tax: payload.tax ?? 0,
      serviceCharge: payload.serviceCharge ?? 0,
      maxDiscountLimit: payload.maxDiscountLimit ?? 0,
    });

    const saved = await this.tenantRepository.save(tenant);

    adminUser.userType = 'restaurant';
    adminUser.tenant = saved;
    await this.usersRepository.save(adminUser);

    return saved;
  }

  async updateTenant(
    id: string,
    requestUserId: string,
    payload: Partial<RegisterRestaurantDto>,
  ): Promise<Tenant> {
    const tenant = await this.getTenant(id, requestUserId);

    if (payload.restaurantName !== undefined) {
      tenant.restaurantName = payload.restaurantName;
    }
    if (payload.profile !== undefined) {
      tenant.profile = payload.profile;
    }
    if (payload.chapaApiKey !== undefined) {
      tenant.chapaApiKey = payload.chapaApiKey;
    }
    if (payload.chapaPublicKey !== undefined) {
      tenant.chapaPublicKey = payload.chapaPublicKey;
    }
    if (payload.tax !== undefined) {
      tenant.tax = payload.tax;
    }
    if (payload.serviceCharge !== undefined) {
      tenant.serviceCharge = payload.serviceCharge;
    }
    if (payload.maxDiscountLimit !== undefined) {
      tenant.maxDiscountLimit = payload.maxDiscountLimit;
    }

    return this.tenantRepository.save(tenant);
  }

  async removeTenant(id: string, requestUserId: string): Promise<void> {
    const tenant = await this.getTenant(id, requestUserId);

    const relatedCounts = await this.branchRepository.count({
      where: { tenant: { id: tenant.id } },
    });

    if (relatedCounts > 0) {
      throw new BadRequestException(
        'This tenant cannot be deleted because it has related branches.',
      );
    }

    await this.tenantRepository.remove(tenant);
  }

  async listBranches(tenantId: string, requestUserId: string): Promise<Branch[]> {
    await this.getTenant(tenantId, requestUserId);
    return this.branchRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async createBranch(
    requestUserId: string,
    payload: CreateBranchDto,
  ): Promise<Branch> {
    const tenant = await this.getTenant(payload.tenantId, requestUserId);

    const branch = this.branchRepository.create({
      tenant,
      address: payload.address,
      isDefault: Boolean(payload.isDefault),
      location: payload.location
        ? this.pointToWkt(payload.location.latitude, payload.location.longitude)
        : null,
    });

    if (branch.isDefault) {
      await this.branchRepository
        .createQueryBuilder()
        .update(Branch)
        .set({ isDefault: false })
        .where('tenant_id = :tenantId', { tenantId: tenant.id })
        .execute();
    }

    return this.branchRepository.save(branch);
  }

  async updateBranch(
    id: string,
    requestUserId: string,
    payload: UpdateBranchDto,
  ): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    await this.getTenant(branch.tenant.id, requestUserId);

    if (payload.address !== undefined) {
      branch.address = payload.address;
    }
    if (payload.location) {
      branch.location = this.pointToWkt(
        payload.location.latitude,
        payload.location.longitude,
      );
    }
    if (payload.isDefault !== undefined) {
      branch.isDefault = payload.isDefault;
    }

    if (branch.isDefault) {
      await this.branchRepository
        .createQueryBuilder()
        .update(Branch)
        .set({ isDefault: false })
        .where('tenant_id = :tenantId AND id <> :id', {
          tenantId: branch.tenant.id,
          id: branch.id,
        })
        .execute();
    }

    return this.branchRepository.save(branch);
  }

  async removeBranch(id: string, requestUserId: string): Promise<void> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    await this.getTenant(branch.tenant.id, requestUserId);

    await this.branchRepository.remove(branch);
  }

  private async loadUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['tenant', 'branch', 'branch.tenant'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private pointToWkt(latitude: number, longitude: number): string {
    return `SRID=4326;POINT(${longitude} ${latitude})`;
  }
}
