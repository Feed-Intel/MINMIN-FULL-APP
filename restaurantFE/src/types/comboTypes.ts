import { Branch } from './branchType';
import { MenuType } from './menuType';
import { Tenant } from './menuType';

// Combos
export interface Combo {
  id: string;
  name: string;
  branch: Branch | string; // Branch ID
  is_custom: boolean;
  combo_price?: number;
  created_at: string;
  combo_items: ComboItem[];
  tenant: Tenant;
}

export interface ComboItem {
  id?: string;
  combo?: string | Combo; // Combo ID
  menu_item: string | MenuType; // Menu item ID
  quantity: number;
  is_half: boolean;
}
