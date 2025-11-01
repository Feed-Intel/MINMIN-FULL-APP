import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { FeedService } from './feed.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtGuard } from '../../common/guards/jwt.guard';

@Controller('feed')
@UseGuards(ApiKeyGuard, JwtGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  list() {
    return this.feedService.listFeed();
  }

  @Post()
  create(@Req() request: any, @Body() payload: CreatePostDto) {
    return this.feedService.createPost(request.user.sub, payload);
  }

  @Post(':id/like')
  toggleLike(@Req() request: any, @Param('id') id: string) {
    return this.feedService.toggleLike(id, request.user.sub);
  }

  @Post(':id/bookmark')
  toggleBookmark(@Req() request: any, @Param('id') id: string) {
    return this.feedService.toggleBookmark(id, request.user.sub);
  }

  @Post(':id/comments')
  addComment(
    @Req() request: any,
    @Param('id') id: string,
    @Body() payload: CreateCommentDto,
  ) {
    return this.feedService.addComment(id, request.user.sub, payload);
  }

  @Delete('comments/:id')
  deleteComment(@Req() request: any, @Param('id') id: string) {
    return this.feedService.deleteComment(id, request.user.sub);
  }

  @Post(':id/share')
  share(@Req() request: any, @Param('id') id: string) {
    return this.feedService.sharePost(id, request.user.sub);
  }
}
