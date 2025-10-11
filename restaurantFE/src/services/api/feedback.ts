import { apiClient } from '@/config/axiosConfig';
import { asyncHandler } from '@/util/asyncHandler';

export const CreateFeedback = asyncHandler(async (data: any) => {
  const resp = await apiClient.post('/feedback/', data);
  return resp.data;
});

export const GetFeedback = asyncHandler(async (page?: number | undefined) => {
  if (Boolean(page)) {
    const resp = await apiClient.get(`/feedback/?page=${page}`);
    return resp.data;
  }
  const resp = await apiClient.get(`/feedback/`);
  return resp.data;
});
