import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/utils/asyncHandler";

export const GetPosts = asyncHandler(async () => {
  const resp = await apiClient.get("/posts/");
  return resp.data.results || [];
});

export const GetBookMarkPosts = asyncHandler(async () => {
  const resp = await apiClient.get("/user/bookmarks/");
  return resp.data.results || [];
});

export const likePost = asyncHandler(async (id: string) => {
  const resp = await apiClient.post(`/posts/${id}/like/`);
  return resp.data;
});

export const addComment = asyncHandler(
  async (data: { post: string; text: string }) => {
    const resp = await apiClient.post(`/comments/`, data);
    return resp.data;
  }
);

export const addBookMark = asyncHandler(async (post_id: string) => {
  const resp = await apiClient.post(`/posts/${post_id}/bookmark/`);
  return resp.data;
});

export const sharePost = asyncHandler(async (post_id: string) => {
  const resp = await apiClient.post(`/posts/${post_id}/share/`);
  return resp.data;
});
