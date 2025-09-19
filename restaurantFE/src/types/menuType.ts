import { Branch } from "./branchType";

export interface MenuType {
  id?: string;
  name: string;
  description: string;
  categories: string[];
  category?: string;
  price: string;
  tags: string[];
  is_side: boolean;
  image: string;
  created_at?: string;
}

export type MenuAvailability = {
  id?: string;
  branch: string | Branch;
  menu_item: string | MenuType;
  is_available: boolean;
  special_notes?: string;
};

export type RelatedMenu = {
  id?: string;
  menu_item?: string | MenuType;
  related_item?: string | MenuType;
  tag?: string;
};
