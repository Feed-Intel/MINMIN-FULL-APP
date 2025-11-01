import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Post } from './post.entity';
import { User } from './user.entity';

@Entity({ name: 'feed_share' })
export class Share {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Post, (post) => post.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @CreateDateColumn({ name: 'shared_at', type: 'timestamp with time zone' })
  sharedAt!: Date;
}
