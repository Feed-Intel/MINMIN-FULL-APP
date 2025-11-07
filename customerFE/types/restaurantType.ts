import { Branch } from './branchType';
import { MenuType } from './menuType';

export type Restaurant = {
  id?: string;
  restaurant_name?: string;
  branch?: string;
  user_type?: string;
  phone?: string;
  email?: string;
  profile?: string;
  average_rating?: string;
  distance?: number;
  review_count?: number;
  branches?: Branch[];
  menus?: MenuType[];
  CHAPA_API_KEY?: string;
  CHAPA_PUBLIC_KEY?: string;
  tax?: number;
  service_charge?: number;
  image?: string;
};
