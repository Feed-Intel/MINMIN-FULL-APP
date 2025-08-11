import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/util/asyncHandler";

export const GetComboById = asyncHandler(async (id: string) => {
  const resp = await apiClient.get(`/combo/${id}/`);
  return resp.data;
});

export const GetCombos = asyncHandler(async () => {
  const resp = await apiClient.get("/combo/");
  return resp.data.results;
});

export const CreateCombo = asyncHandler(async (data: any) => {
  const resp = await apiClient.post("/combo/", data);
  return resp.data;
});

export const GetComboItems = asyncHandler(async () => {
  const resp = await apiClient.get("/combo-item/");
  return resp.data.results;
});

export const UpdateCombo = asyncHandler(async (data: any) => {
  const resp = await apiClient.patch(`/combo/${data.id}/`, data);
  return resp.data;
});

export const DeleteCombo = asyncHandler(async (id: string) => {
  const resp = await apiClient.delete(`/combo/${id}/`);
  return resp.data;
});
