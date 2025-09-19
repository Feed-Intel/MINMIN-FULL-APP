import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/util/asyncHandler";

// export const GetDashboardData = asyncHandler(async () => {
//   const resp = await apiClient.get("/tenant/dashboard");
//   return resp.data;
// });
type DashboardParams = {
  period?: "today" | "month" | "year" | "custom";
  start_date?: string;
  end_date?: string;
  branch_id?: string;
};

export const GetDashboardData = asyncHandler(async (params?: DashboardParams) => {
  const query = { ...params } as DashboardParams;
  if (!query.branch_id) delete query.branch_id;

  const resp = await apiClient.get("/dashboard/stats/", { params: query });
  return resp.data;
});

type TopMenuParams = {
  start_date?: string;
  end_date?: string;
  branch_id?: string;
};

export const GetTopMenuItems = asyncHandler(async (params?: TopMenuParams) => {
  const query = { ...params } as TopMenuParams;
  if (!query.branch_id) delete query.branch_id;

  const resp = await apiClient.get("/dashboard/top-items/", { params: query });
  return resp.data;
});
export const GetTenantProfile = asyncHandler(async (id: string) => {
  const resp = await apiClient.get(`/tenant/${id}/`);
  return resp.data;
});

export const UpdateTenantProfile = asyncHandler(async (data: any) => {
  const resp = await apiClient.patch(`/tenant/${data.id}/`, data);
  return resp.data;
});

export const UpdateTenantProfileImage = asyncHandler(async (data: any) => {
  const resp = await apiClient.patch(
    `/tenant/${data.id || data.get("id")}/`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return resp.data;
});
