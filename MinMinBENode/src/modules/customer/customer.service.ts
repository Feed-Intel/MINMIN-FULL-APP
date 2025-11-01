import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Address } from '../../database/entities/address.entity';
import { User } from '../../database/entities/user.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async listAddresses(requestUserId: string): Promise<Address[]> {
    const requester = await this.loadUser(requestUserId);

    if (requester.userType === 'admin') {
      return this.addressRepository.find({ order: { createdAt: 'DESC' } });
    }

    return this.addressRepository.find({
      where: { user: { id: requestUserId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getAddress(id: string, requestUserId: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const requester = await this.loadUser(requestUserId);

    if (requester.userType !== 'admin' && address.user.id !== requester.id) {
      throw new ForbiddenException();
    }

    return address;
  }

  async createAddress(
    requestUserId: string,
    payload: CreateAddressDto,
  ): Promise<Address> {
    const user = await this.loadUser(requestUserId);

    const address = this.addressRepository.create({
      user,
      addressLine: payload.addressLine,
      gpsCoordinates: payload.gpsCoordinates,
      label: payload.label,
      isDefault: Boolean(payload.isDefault),
    });

    if (address.isDefault) {
      await this.clearDefaultFlag(user.id);
    }

    const saved = await this.addressRepository.save(address);

    if (saved.isDefault) {
      await this.setDefault(saved);
    }

    return saved;
  }

  async updateAddress(
    id: string,
    requestUserId: string,
    payload: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.getAddress(id, requestUserId);

    if (payload.addressLine !== undefined) {
      address.addressLine = payload.addressLine;
    }
    if (payload.gpsCoordinates !== undefined) {
      address.gpsCoordinates = payload.gpsCoordinates;
    }
    if (payload.label !== undefined) {
      address.label = payload.label;
    }
    if (payload.isDefault !== undefined) {
      address.isDefault = payload.isDefault;
    }

    if (address.isDefault) {
      await this.clearDefaultFlag(address.user.id, address.id);
    }

    const saved = await this.addressRepository.save(address);

    if (saved.isDefault) {
      await this.setDefault(saved);
    }

    return saved;
  }

  async removeAddress(id: string, requestUserId: string): Promise<void> {
    const address = await this.getAddress(id, requestUserId);

    await this.addressRepository.remove(address);
  }

  private async clearDefaultFlag(userId: string, ignoreId?: string) {
    const builder = this.addressRepository
      .createQueryBuilder()
      .update(Address)
      .set({ isDefault: false })
      .where('user_id = :userId', { userId });

    if (ignoreId) {
      builder.andWhere('id <> :ignoreId', { ignoreId });
    }

    await builder.execute();
  }

  private async setDefault(address: Address) {
    await this.addressRepository.update(
      { user: { id: address.user.id }, id: address.id },
      { isDefault: true },
    );
  }

  private async loadUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
