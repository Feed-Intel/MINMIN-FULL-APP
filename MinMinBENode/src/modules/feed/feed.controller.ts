import { Controller, Get, Query } from '@nestjs/common';

import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  getFeed(@Query('restaurantId') restaurantId?: string) {
    return this.feedService.getFeed(restaurantId);
  }
}
