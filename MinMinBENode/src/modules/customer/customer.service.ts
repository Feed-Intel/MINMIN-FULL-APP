import { Injectable, NotFoundException } from '@nestjs/common';

import { RegisterCustomerDto } from './dto/register-customer.dto';

@Injectable()
export class CustomerService {
  private readonly customers = new Map<string, RegisterCustomerDto>();

  findOne(id: string) {
    const customer = this.customers.get(id);

    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found`);
    }

    return { id, ...customer };
  }

  register(payload: RegisterCustomerDto) {
    const id = payload.phoneNumber;
    this.customers.set(id, payload);

    return { id, ...payload };
  }
}
