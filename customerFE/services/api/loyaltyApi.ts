import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/utils/asyncHandler";

export const GetLoyalties = asyncHandler(async (id?: string) => {
  if (!Boolean(id)) {
    return [];
  }
  const resp = await apiClient.get(`/customer-loyalty/?customer=${id}`);
  //(resp.data.results);
  return resp.data.results;
});

export const GetTenantLoyalties = asyncHandler(async () => {
  const resp = await apiClient.get("/restaurant-loyalty-settings/");
  //(resp.data.results);
  return resp.data.results;
});

export const GetTransactionLoyalties = asyncHandler(async () => {
  const resp = await apiClient.get("/loyalty-transaction/");
  //(resp.data.results);
  return resp.data.results;
});
