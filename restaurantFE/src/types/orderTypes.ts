// Orders

import { MenuType } from './menuType';
import { Table } from './tableTypes';

type Customer = {
  id: string;
  full_name: string;
  phone?: string;
};

type Branch = {
  id: string;
  address: string;
};
export interface Order {
  id: string;
  tenant: string; // Tenant ID
  branch: string | Branch; // Branch ID
  table: Table; // Table ID
  order_id: string;
  customer: string | Customer; // Customer/User ID
  status:
    | 'pending_payment'
    | 'placed'
    | 'progress'
    | 'payment_complete'
    | 'delivered'
    | 'cancelled';
  total_price: number;
  discount_amount?: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order: string; // Order ID
  menu_item: string | MenuType; // Menu item ID
  menu_item_name?: string;
  quantity: number;
  price: number;
  remarks?: string;
}

export type ChannelFilterId = 'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type OrderQueryParams = {
  page: number;
  status?: string; // e.g., 'pending_payment,placed'
  channel?: ChannelFilterId;
  from?: string | null;
  to?: string | null;
  branchId?: string | null;
  search?: string;
};
