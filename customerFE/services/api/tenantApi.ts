import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/utils/asyncHandler";

export const GetDashboardData = asyncHandler(async () => {
  const resp = await apiClient.get("/tenant/dashboard");
  return resp.data;
});

export const GetTenants = asyncHandler(async (searchTerm?: string) => {
  if (searchTerm) {
    const resp = await apiClient.get(`/tenant/?restaurant_name=${searchTerm}`);
    return resp.data.results;
  }
  const resp = await apiClient.get("/tenant/");
  return resp.data.results;
});

export const GetTenantsByPrice = asyncHandler(async () => {
  const resp = await apiClient.get("/tenant/price-stats");
  return resp.data;
});

export const GetTenantById = asyncHandler(async (id: string) => {
  const resp = await apiClient.get(`/tenant/${id}/`);
  return resp.data;
});

// export const GetTenantByName = asyncHandler(async (name: string) => {
//   const resp = await apiClient.get(`/tenant/?restaurant_name=${name}}`);
//   return resp.data.results;
// });
