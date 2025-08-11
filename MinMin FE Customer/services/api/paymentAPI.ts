import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/utils/asyncHandler";

export const CreatePayment = asyncHandler(async (data: any) => {
  const resp = await apiClient.post("/payment/", {
    ...data,
  });
  return resp.data;
});
