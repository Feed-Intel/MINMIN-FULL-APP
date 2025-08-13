import { useMutation, useQuery } from "@tanstack/react-query";
import {
  addPost,
  deletePost,
  getPost,
  getPosts,
  getPostStats,
  updatePost,
} from "../api/feedApi";
import { Post } from "@/types/postType";

export const useGetPosts = () => {
  return useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: getPosts,
  });
};

export const useGetPostsStats = (id: string) => {
  return useQuery({
    queryKey: ["postStats", id],
    queryFn: () => getPostStats(id),
  });
};

export const useGetPostById = (id: any) => {
  return useQuery({
    queryKey: ["posts", id],
    queryFn: () => getPost(id),
  });
};

export const useAddPost = () =>
  useMutation({
    mutationFn: addPost,
  });

export const useUpdatePost = (id: string) =>
  useMutation({
    mutationKey: ["update-post", id],
    mutationFn: updatePost.bind(null, id),
  });

export const useDeletePost = () =>
  useMutation({
    mutationFn: deletePost,
  });
