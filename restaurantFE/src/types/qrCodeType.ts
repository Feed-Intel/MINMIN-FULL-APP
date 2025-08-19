import { Branch } from "./branchType";
import { Table } from "./tableTypes";

export type QRCodeType = {
  id: string;
  branch: Branch;
  table: Table;
  qr_code_url: string;
};
