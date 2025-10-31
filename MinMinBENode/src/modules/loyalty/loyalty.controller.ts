import { Body, Controller, Post } from '@nestjs/common';

import { LoyaltyService } from './loyalty.service';
import { UpdatePointsDto } from './dto/update-points.dto';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post('points')
  updatePoints(@Body() payload: UpdatePointsDto) {
    return this.loyaltyService.updatePoints(payload);
  }
}
