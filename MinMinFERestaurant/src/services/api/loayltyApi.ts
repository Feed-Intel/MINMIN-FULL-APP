import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/util/asyncHandler";

export const getLoyaltySettings = asyncHandler(async () => {
  const { data } = await apiClient.get("/restaurant-loyalty-settings/");
  return data.results[0];
});

export const getLoyaltyConversionRate = asyncHandler(async () => {
  const { data } = await apiClient.get("/loyalty-conversion-rate/");
  return data.results[0];
});

export const updateLoyaltySettings = asyncHandler(async (data: any) => {
  const res = await apiClient.post("/restaurant-loyalty-settings/", data);
  return res.data;
});
