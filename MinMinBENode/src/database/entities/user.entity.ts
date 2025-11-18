import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Branch } from './branch.entity';
import { Tenant } from './tenant.entity';

type UserType = 'customer' | 'restaurant' | 'branch' | 'admin';

@Entity({ name: 'accounts_user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName!: string | null;

  @Column({ name: 'phone', type: 'varchar', length: 15, nullable: true })
  phone!: string | null;

  @Index({ unique: true })
  @Column({ name: 'email', type: 'varchar', length: 254, nullable: true })
  email!: string | null;

  @Column({ name: 'password', type: 'varchar', length: 128 })
  password!: string;

  @Column({
    name: 'user_type',
    type: 'varchar',
    length: 10,
    default: 'customer',
  })
  userType!: UserType;

  @Column({ name: 'image', type: 'varchar', length: 512, nullable: true })
  image!: string | null;

  @Column({ name: 'push_token', type: 'varchar', length: 255, nullable: true })
  pushToken!: string | null;

  @Column({ name: 'birthday', type: 'date', nullable: true })
  birthday!: Date | null;

  @OneToOne(() => Branch, (branch) => branch.admin, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch | null;

  @Column({ name: 'otp', type: 'varchar', length: 255, nullable: true })
  otp!: string | null;

  @Column({ name: 'otp_expiry', type: 'timestamp with time zone', nullable: true })
  otpExpiry!: Date | null;

  @Column({ name: 'failed_attempts', type: 'int', default: 0 })
  failedAttempts!: number;

  @Column({ name: 'locked_until', type: 'timestamp with time zone', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'opt_in_promotions', type: 'boolean', default: true })
  optInPromotions!: boolean;

  @Column({ name: 'enable_email_notifications', type: 'boolean', default: true })
  enableEmailNotifications!: boolean;

  @Column({ name: 'enable_in_app_notifications', type: 'boolean', default: true })
  enableInAppNotifications!: boolean;

  @Column({ name: 'tin_no', type: 'varchar', length: 15, nullable: true })
  tinNo!: string | null;

  @Column({ name: 'is_staff', type: 'boolean', default: false })
  isStaff!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'push_token_last_synced_at', type: 'timestamp with time zone', nullable: true })
  pushTokenLastSyncedAt!: Date | null;

  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true })
  refreshTokenHash!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @OneToOne(() => Tenant, (tenant) => tenant.admin)
  managedTenant?: Tenant | null;
}
