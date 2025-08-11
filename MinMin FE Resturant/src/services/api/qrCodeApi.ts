import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/util/asyncHandler";

export const getQRCodes = asyncHandler(async () => {
  const { data } = await apiClient.get("/qr-code");
  return data.results;
});

export const deleteQRCode = asyncHandler(async (id: string) => {
  const { data } = await apiClient.delete(`/qr-code/${id}/`);
  return data;
});
