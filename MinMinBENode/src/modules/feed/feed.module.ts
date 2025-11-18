import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { Post } from '../../database/entities/post.entity';
import { User } from '../../database/entities/user.entity';
import { Tag } from '../../database/entities/tag.entity';
import { Comment } from '../../database/entities/comment.entity';
import { Share } from '../../database/entities/share.entity';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, User, Tag, Comment, Share]),
    JwtModule.register({ secret: process.env.JWT_SECRET ?? 'change-me' }),
  ],
  controllers: [FeedController],
  providers: [FeedService, ApiKeyGuard, JwtGuard],
  exports: [FeedService],
})
export class FeedModule {}
