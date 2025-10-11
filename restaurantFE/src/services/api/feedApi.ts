import { apiClient } from '@/config/axiosConfig';
import { asyncHandler } from '@/util/asyncHandler';

export const getPosts = asyncHandler(
  async (page?: number | undefined | null) => {
    if (Boolean(page)) {
      const response = await apiClient.get(`/posts/?page=${page}`);
      return response.data;
    }
    const response = await apiClient.get('/posts/');
    return response.data;
  }
);

export const getPost = asyncHandler(async (id: string) => {
  const response = await apiClient.get(`/posts/${id}`);
  return response.data;
});

export const getPostStats = asyncHandler(async (id: string) => {
  const response = await apiClient.get(`/posts/${id}/stats`);
  return response.data;
});

export const addPost = asyncHandler(async (post: any) => {
  const response = await apiClient.post('/posts/', post, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
});

export const updatePost = asyncHandler(async (id: string, post: any) => {
  const response = await apiClient.patch(`/posts/${id}/`, post, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
});

export const deletePost = asyncHandler(async (id: string) => {
  const response = await apiClient.delete(`/posts/${id}/`);
  return response.data;
});
