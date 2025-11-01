import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Tag } from './tag.entity';
import { Comment } from './comment.entity';
import { Share } from './share.entity';

@Entity({ name: 'feed_post' })
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'image', type: 'varchar', length: 512 })
  image!: string;

  @Column({ name: 'caption', type: 'text' })
  caption!: string;

  @CreateDateColumn({ name: 'time_ago', type: 'timestamp with time zone' })
  createdAt!: Date;

  @Column({ name: 'location', type: 'varchar', length: 255 })
  location!: string;

  @Column({ name: 'share_count', type: 'int', default: 0 })
  shareCount!: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @ManyToMany(() => User, { eager: true })
  @JoinTable({
    name: 'feed_post_likes',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  likes!: User[];

  @ManyToMany(() => User, { eager: true })
  @JoinTable({
    name: 'feed_post_bookmarks',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  bookmarks!: User[];

  @ManyToMany(() => Tag, (tag) => tag.posts, { cascade: true })
  @JoinTable({
    name: 'feed_post_tags',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags!: Tag[];

  @OneToMany(() => Share, (share) => share.post)
  shares!: Share[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments!: Comment[];
}
