import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

export type AddressLabel = 'home' | 'office' | 'other';

@Entity({ name: 'customer_address_address' })
@Unique(['user', 'label'])
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'address_line', type: 'text' })
  addressLine!: string;

  @Column({ name: 'gps_coordinates', type: 'varchar', length: 255 })
  gpsCoordinates!: string;

  @Column({ name: 'label', type: 'varchar', length: 10, default: 'home' })
  label!: AddressLabel;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
