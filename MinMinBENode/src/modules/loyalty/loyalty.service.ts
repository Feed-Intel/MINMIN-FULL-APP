import { Injectable } from '@nestjs/common';

import { UpdatePointsDto } from './dto/update-points.dto';

@Injectable()
export class LoyaltyService {
  private readonly points = new Map<string, number>();

  updatePoints({ accountId, delta }: UpdatePointsDto) {
    const current = this.points.get(accountId) ?? 0;
    const next = current + delta;
    this.points.set(accountId, next);

    return { accountId, points: next };
  }
}
