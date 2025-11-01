import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity({ name: 'loyalty_loyaltytransaction' })
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant | null;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: User;

  @Column({ name: 'points', type: 'double precision', default: 0 })
  points!: number;

  @Column({ name: 'transaction_type', type: 'varchar', length: 255 })
  transactionType!: 'redemption' | 'earning';

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;
}
