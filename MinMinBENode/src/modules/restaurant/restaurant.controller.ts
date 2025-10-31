import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { RestaurantService } from './restaurant.service';
import { RegisterRestaurantDto } from './dto/register-restaurant.dto';

@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantService.findOne(id);
  }

  @Post()
  register(@Body() payload: RegisterRestaurantDto) {
    return this.restaurantService.register(payload);
  }
}
