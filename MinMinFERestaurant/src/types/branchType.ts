export interface Branch {
  id?: string;
  address?: string;
  gps_coordinates?: string;
  location?: {
    lat: string;
    lng: string;
  };
  is_default?: boolean;
  created_at?: string;
}
