import { Injectable, NotFoundException } from '@nestjs/common';

import { RegisterRestaurantDto } from './dto/register-restaurant.dto';

@Injectable()
export class RestaurantService {
  private readonly restaurants = new Map<string, RegisterRestaurantDto>();

  findOne(id: string) {
    const restaurant = this.restaurants.get(id);

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${id} not found`);
    }

    return { id, ...restaurant };
  }

  register(payload: RegisterRestaurantDto) {
    const id = payload.slug;
    this.restaurants.set(id, payload);

    return { id, ...payload };
  }
}
