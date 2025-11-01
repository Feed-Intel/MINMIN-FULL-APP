import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Post } from '../../database/entities/post.entity';
import { User } from '../../database/entities/user.entity';
import { Tag } from '../../database/entities/tag.entity';
import { Comment } from '../../database/entities/comment.entity';
import { Share } from '../../database/entities/share.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Share)
    private readonly shareRepository: Repository<Share>,
  ) {}

  async listFeed(): Promise<Post[]> {
    return this.postRepository.find({
      relations: [
        'user',
        'tags',
        'likes',
        'bookmarks',
        'comments',
        'comments.user',
        'shares',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async createPost(userId: string, payload: CreatePostDto): Promise<Post> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const tags = payload.tags ? await this.ensureTags(payload.tags) : [];

    const post = this.postRepository.create({
      user,
      caption: payload.caption,
      image: payload.image,
      location: payload.location,
      tags,
    });

    return this.postRepository.save(post);
  }

  async toggleLike(postId: string, userId: string): Promise<Post> {
    const post = await this.loadPost(postId);
    const user = await this.loadUser(userId);

    const alreadyLiked = post.likes.some((like) => like.id === user.id);

    if (alreadyLiked) {
      post.likes = post.likes.filter((like) => like.id !== user.id);
    } else {
      post.likes.push(user);
    }

    await this.postRepository.save(post);
    return this.loadPost(postId);
  }

  async toggleBookmark(postId: string, userId: string): Promise<Post> {
    const post = await this.loadPost(postId);
    const user = await this.loadUser(userId);

    const bookmarked = post.bookmarks.some((bookmark) => bookmark.id === user.id);

    if (bookmarked) {
      post.bookmarks = post.bookmarks.filter((bookmark) => bookmark.id !== user.id);
    } else {
      post.bookmarks.push(user);
    }

    await this.postRepository.save(post);
    return this.loadPost(postId);
  }

  async addComment(
    postId: string,
    userId: string,
    payload: CreateCommentDto,
  ): Promise<Comment> {
    const post = await this.loadPost(postId);
    const user = await this.loadUser(userId);

    const comment = this.commentRepository.create({
      post,
      user,
      text: payload.text,
    });

    return this.commentRepository.save(comment);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user.id !== userId) {
      throw new ForbiddenException();
    }

    await this.commentRepository.remove(comment);
  }

  async sharePost(postId: string, userId: string | null): Promise<Share> {
    const post = await this.loadPost(postId);
    const user = userId ? await this.loadUser(userId) : null;

    const share = this.shareRepository.create({
      post,
      user,
    });

    post.shareCount += 1;
    await this.postRepository.save(post);

    return this.shareRepository.save(share);
  }

  private async ensureTags(names: string[]): Promise<Tag[]> {
    const normalized = names.map((name) => name.trim().toLowerCase()).filter(Boolean);

    if (!normalized.length) {
      return [];
    }

    const existing = await this.tagRepository.find({
      where: { name: In(normalized) },
    });

    const existingMap = new Map(existing.map((tag) => [tag.name, tag] as const));

    const newTags = normalized
      .filter((name) => !existingMap.has(name))
      .map((name) => this.tagRepository.create({ name }));

    const created = await this.tagRepository.save(newTags);

    return [...existing, ...created];
  }

  private async loadPost(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: [
        'user',
        'tags',
        'likes',
        'bookmarks',
        'comments',
        'comments.user',
        'shares',
      ],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  private async loadUser(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
