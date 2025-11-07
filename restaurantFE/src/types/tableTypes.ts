import { Branch } from './branchType';

// Tables
export interface Table {
  id?: string;
  branch: string | Branch; // Branch ID
  table_code?: string;
  is_fast_table: boolean;
  is_delivery_table: boolean;
  is_inside_table: boolean;
  created_at?: string;
  updated_at?: string;
}

export type TableQueryParams = {
  page: number;
  branch?: string | null;
  search?: string;
};
