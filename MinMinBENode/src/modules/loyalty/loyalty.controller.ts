import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { LoyaltyService } from './loyalty.service';
import { UpdatePointsDto } from './dto/update-points.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Controller('loyalty')
@UseGuards(ApiKeyGuard, JwtGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('points')
  updatePoints(@Req() request: any, @Body() payload: UpdatePointsDto) {
    return this.loyaltyService.updatePoints(request.user.sub, payload);
  }

  @Get('customer')
  getCurrentCustomer(@Req() request: any) {
    return this.loyaltyService.getCustomerSummary(request.user.sub);
  }

  @Get('customer/:id')
  getCustomer(@Param('id') id: string) {
    return this.loyaltyService.getCustomerSummary(id);
  }

  @Get('tenant/:tenantId')
  getTenant(@Param('tenantId') tenantId: string) {
    return this.loyaltyService.getTenantSummary(tenantId);
  }
}
