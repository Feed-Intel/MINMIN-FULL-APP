import { apiClient } from '@/config/axiosConfig';
import { asyncHandler } from '@/util/asyncHandler';
import { BranchAdmin } from '@/types/branchAdmin';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';

export const GetBranchAdmins = asyncHandler(async (next?: number | null) => {
  if (Boolean(next)) {
    const resp = await apiClient.get(`/auth/branchAdmins/?page=${next}`, {
      baseURL: BACKEND_URL,
    });
    return resp.data || [];
  }
  const resp = await apiClient.get('/auth/branchAdmins/', {
    baseURL: BACKEND_URL,
  });
  return resp.data || [];
});

export const GetBranchAdmin = asyncHandler(async (adminId: string) => {
  const resp = await apiClient.get(`/auth/user/${adminId}/`, {
    baseURL: BACKEND_URL,
  });
  return resp.data;
});

export const CreateBranchAdmin = asyncHandler(async (data: BranchAdmin) => {
  const resp = await apiClient.post('/auth/register/', data, {
    baseURL: BACKEND_URL,
  });
  return resp.data;
});

export const UpdateBranchAdmin = asyncHandler(async (data: BranchAdmin) => {
  const resp = await apiClient.put(`/auth/user/${data.id}/`, data, {
    baseURL: BACKEND_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.EXPO_PUBLIC_API_KEY || '',
    },
  });
  return resp.data;
});

export const DeleteBranchAdmin = asyncHandler(async (id: string) => {
  const resp = await apiClient.delete(`/auth/user/${id}/`, {
    baseURL: BACKEND_URL,
  });
  return resp.data;
});
