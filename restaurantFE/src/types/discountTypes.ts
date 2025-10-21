import { Branch } from './branchType';

export interface Coupon {
  id: string;
  discount_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface Discount {
  id: string;
  tenant: string | null;
  branch: any;
  name: string | null;
  description: string | null;
  type: 'volume' | 'combo' | 'bogo' | 'freeItem' | 'coupon';
  off_peak_hours: boolean;
  priority: number | null | undefined;
  is_stackable: boolean;
  coupon: Coupon | null;
  valid_from: Date | undefined;
  valid_until: Date | undefined;
  created_at: string;
  updated_at: string;
}

export interface DiscountRule {
  id?: string;
  discount_id: string | Discount;
  min_items: number;
  max_items: number;
  min_price: number;
  applicable_items: string[];
  excluded_items: string[];
  combo_size: number;
  buy_quantity: number;
  get_quantity: number;
  is_percentage: boolean;
  max_discount_amount: number;
  created_at?: string;
  updated_at?: string;
}

export type DiscountQueryParams = {
  page: number;
  branch?: string | null;
  search?: string;
};
