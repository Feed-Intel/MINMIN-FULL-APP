// Orders

import { MenuType } from "./menuType";
import { Table } from "./tableTypes";

type Customer = {
  id: string;
  full_name: string;
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
  status: "placed" | "progress" | "delivered" | "cancelled";
  total_price: number;
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
