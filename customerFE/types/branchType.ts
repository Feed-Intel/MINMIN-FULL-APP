import { Restaurant } from "./restaurantType";

export interface Branch {
  id?: string;
  address?: string;
  tenant?: Restaurant;
  gps_coordinates?: string;
  is_default?: boolean;
  created_at?: string;
}
