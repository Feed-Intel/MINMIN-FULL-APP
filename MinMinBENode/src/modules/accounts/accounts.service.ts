import { Injectable, NotFoundException } from '@nestjs/common';

import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
  private readonly accounts = new Map<string, CreateAccountDto>();

  findOne(id: string) {
    const account = this.accounts.get(id);

    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }

    return { id, ...account };
  }

  create(payload: CreateAccountDto) {
    const id = payload.email;
    this.accounts.set(id, payload);

    return { id, ...payload };
  }
}
