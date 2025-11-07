import { Branch } from './branchType';

export interface BranchAdmin {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  branch: string | Branch;
  user_type?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}
