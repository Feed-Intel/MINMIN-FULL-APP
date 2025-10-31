import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CustomerService } from './customer.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Post()
  register(@Body() payload: RegisterCustomerDto) {
    return this.customerService.register(payload);
  }
}
