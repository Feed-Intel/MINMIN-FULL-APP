import { Injectable } from '@nestjs/common';

@Injectable()
export class FeedService {
  getFeed(restaurantId?: string) {
    return {
      restaurantId: restaurantId ?? null,
      items: [],
      generatedAt: new Date().toISOString(),
    };
  }
}
