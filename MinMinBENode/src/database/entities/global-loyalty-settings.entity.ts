import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'loyalty_globalloyaltysettings' })
@Unique(['event'])
export class GlobalLoyaltySettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event', type: 'varchar', length: 255, nullable: true })
  event!: string | null;

  @Column({ name: 'global_points', type: 'int', default: 0 })
  globalPoints!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
