import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/utils/asyncHandler";

export const GetNotifications = asyncHandler(async (nextPage?: string) => {
  if (nextPage) {
    const page = nextPage.split("page=")[1];
    const resp = await apiClient.get(`/notification/?page=${page}`);
    return resp.data || [];
  } else {
    const resp = await apiClient.get("/notification/");
    return resp.data || [];
  }
});

export const updateMarkNotificationAsRead = async (
  id: string
): Promise<any> => {
  const { data } = await apiClient.post(`/notification/${id}/read/`);
  return data;
};
