import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/utils/asyncHandler";
import { Branch } from "@/types/branchType";
import { useAppSelector } from "@/lib/reduxStore/hooks";

export const GetBranches = asyncHandler(async () => {
  const resp = await apiClient.get("/branch/");
  //(resp.data.results);
  return resp.data.results;
});

export const GetBranch = asyncHandler(async (id: string) => {
  const resp = await apiClient.get(`/branch/${id}/`);
  //(resp.data.results);
  return resp.data;
});
export const GetBranchByLocation = asyncHandler(
  async (lon: string, lat: string) => {
    // const { latitude, longitude } = useAppSelector((state) => state.location);

    //   if (!longitude || !latitude) return { data: [] };
    const resp = await apiClient.get(`/branch/nearby/?lat=${lat}&lon=${lon}`);
    //////("error: ", resp)
    return resp.data;
  }
);

export const GetBranchByDistance = asyncHandler(
  async (lon: string, lat: string) => {
    const resp = await apiClient.get(
      `/branch/all-with-distance/?lat=${lat}&lon=${lon}`
    );
    return resp.data;
  }
);

export const CreateAWaiterCall = asyncHandler(async (data: any) => {
  ////("data: ", data);
  const resp = await apiClient.post("/branch/call_waiter/", data);
  return resp.data;
});

export const CreateBranch = asyncHandler(async (data: Branch) => {
  const resp = await apiClient.post("/branch/", data);
  return resp.data;
});

export const UpdateBranch = asyncHandler(async (data: Branch) => {
  const resp = await apiClient.patch(`/branch/${data.id}/`, data);
  return resp.data;
});

export const DeleteBranch = asyncHandler(async (id: string) => {
  const resp = await apiClient.delete(`/branch/${id}/`);
  return resp.data;
});
