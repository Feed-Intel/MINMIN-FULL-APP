import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Post } from './post.entity';

@Entity({ name: 'feed_tag' })
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 100, unique: true })
  name!: string;

  @ManyToMany(() => Post, (post) => post.tags)
  posts!: Post[];
}
