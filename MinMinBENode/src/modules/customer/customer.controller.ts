import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CustomerService } from './customer.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Controller('customer')
@UseGuards(ApiKeyGuard, JwtGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('addresses')
  listAddresses(@Req() request: any) {
    return this.customerService.listAddresses(request.user.sub);
  }

  @Post('addresses')
  createAddress(@Req() request: any, @Body() payload: CreateAddressDto) {
    return this.customerService.createAddress(request.user.sub, payload);
  }

  @Get('addresses/:id')
  getAddress(@Req() request: any, @Param('id') id: string) {
    return this.customerService.getAddress(id, request.user.sub);
  }

  @Put('addresses/:id')
  updateAddress(
    @Req() request: any,
    @Param('id') id: string,
    @Body() payload: UpdateAddressDto,
  ) {
    return this.customerService.updateAddress(id, request.user.sub, payload);
  }

  @Delete('addresses/:id')
  removeAddress(@Req() request: any, @Param('id') id: string) {
    return this.customerService.removeAddress(id, request.user.sub);
  }
}
