import { apiClient } from '@/config/axiosConfig';
import { asyncHandler } from '@/util/asyncHandler';
import { Branch } from '@/types/branchType';

export const GetBranches = asyncHandler(
  async (param?: string, noPage?: boolean) => {
    if (noPage) {
      const resp = await apiClient.get(`/branch/?nopage=1`);
      return { results: resp.data || [] };
    }
    const resp = await apiClient.get(`/branch?${param}`);
    return resp.data;
  }
);

export const GetBranch = asyncHandler(async (id: string) => {
  const resp = await apiClient.get(`/branch/${id}/`);
  return resp.data;
});

export const CreateBranch = asyncHandler(async (data: Branch) => {
  const resp = await apiClient.post('/branch/', data);
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
