import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/utils/asyncHandler";

export const CreateFeedback = asyncHandler(async (data: any) => {
  const resp = await apiClient.post("/feedback/", data);
  return resp.data;
});

export const GetFeedback = asyncHandler(async (order: string) => {
  const resp = await apiClient.get(`/feedback/?order=${order}`);
  return resp.data;
});
