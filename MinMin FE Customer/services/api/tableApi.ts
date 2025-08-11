import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/utils/asyncHandler";

export const fetchDeliveryTables = asyncHandler(
  async (branch: any): Promise<any[]> => {
    const resp = await apiClient.get(
      `/table/?branch=${branch}&is_delivery_table=true`
    );
    return resp.data.results || [];
  }
);

export const fetchQRs = asyncHandler(async (): Promise<any[]> => {
  const resp = await apiClient.get("/qr-code/");
  return resp.data.results || [];
});

export const createQR = asyncHandler(
  async (table: Partial<any>): Promise<any> => {
    const tableQr = {
      table: table,
    };
    const { data } = await apiClient.post("/qr-code/", tableQr);
    return data;
  }
);

export const updateQr = asyncHandler(
  async (id: string, qr: Partial<any>): Promise<any> => {
    const { data } = await apiClient.put(`/qr-code/${id}/`, qr);
    return data;
  }
);

export const fetchTables = asyncHandler(async (): Promise<any[]> => {
  const resp = await apiClient.get(`/table/`);

  return resp.data.results || [];
});

export const fetchTableById = asyncHandler(async (id: string): Promise<any> => {
  const resp = await apiClient.get(`/table/${id}/`);
  return resp.data;
});

// Create a table
export const createTable = asyncHandler(
  async (table: Partial<any>): Promise<any> => {
    const { data } = await apiClient.post("/table/", table);
    return data;
  }
);

// Update a table
export const updateTable = asyncHandler(
  async (table: Partial<any>): Promise<any> => {
    const { data } = await apiClient.put(`/table/${table.id}/`, table);
    return data;
  }
);

// Delete a table
export const deleteTable = async (id: string): Promise<void> => {
  await apiClient.delete(`/table/${id}/`);
};
