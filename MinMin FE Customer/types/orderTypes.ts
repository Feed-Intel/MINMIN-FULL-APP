// Orders

import { MenuType } from "./menuType";

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
  table: string; // Table ID
  customer: string | Customer; // Customer/User ID
  status: "placed" | "progress" | "delivered" | "cancelled";
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  order: string; // Order ID
  menu_item: string | MenuType; // Menu item ID
  quantity: number;
  price: number;
}
