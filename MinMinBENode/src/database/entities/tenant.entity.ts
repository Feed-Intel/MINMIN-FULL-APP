import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Branch } from './branch.entity';
import { RestaurantLoyaltySettings } from './restaurant-loyalty-settings.entity';
import { TenantLoyalty } from './tenant-loyalty.entity';
import { LoyaltyConversionRate } from './loyalty-conversion-rate.entity';

@Entity({ name: 'restaurant_tenant_tenant' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'image', type: 'varchar', length: 512, nullable: true })
  image!: string | null;

  @Column({ name: 'restaurant_name', type: 'varchar', length: 255 })
  restaurantName!: string;

  @Column({ name: 'profile', type: 'text' })
  profile!: string;

  @Column({ name: 'CHAPA_API_KEY', type: 'text', nullable: true })
  chapaApiKey!: string | null;

  @Column({ name: 'CHAPA_PUBLIC_KEY', type: 'text', nullable: true })
  chapaPublicKey!: string | null;

  @Column({ name: 'tax', type: 'double precision', default: 0 })
  tax!: number;

  @Column({ name: 'service_charge', type: 'double precision', default: 0 })
  serviceCharge!: number;

  @Column({ name: 'max_discount_limit', type: 'double precision', default: 0 })
  maxDiscountLimit!: number;

  @OneToOne(() => User, (user) => user.tenant, { eager: true })
  @JoinColumn({ name: 'admin_id' })
  admin!: User;

  @OneToMany(() => Branch, (branch) => branch.tenant)
  branches!: Branch[];

  @OneToMany(
    () => RestaurantLoyaltySettings,
    (settings) => settings.tenant,
  )
  loyaltySettings!: RestaurantLoyaltySettings[];

  @OneToMany(() => TenantLoyalty, (tenantLoyalty) => tenantLoyalty.tenant)
  tenantLoyalty!: TenantLoyalty[];

  @OneToMany(
    () => LoyaltyConversionRate,
    (conversionRate) => conversionRate.tenant,
  )
  conversionRates!: LoyaltyConversionRate[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt!: Date;

  @OneToMany(() => User, (user) => user.tenant)
  users!: User[];
}
