import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addPost,
  deletePost,
  getPost,
  getPosts,
  getPostStats,
  updatePost,
} from '../api/feedApi';
import { Post } from '@/types/postType';

export const useGetPosts = (page?: number | null | undefined) => {
  return useQuery<{ next: string | null; results: Post[]; count: number }>({
    queryKey: ['posts', page],
    queryFn: () => getPosts(page),
  });
};

export const useGetPostsStats = (id: string) => {
  return useQuery({
    queryKey: ['postStats', id],
    queryFn: () => getPostStats(id),
  });
};

export const useGetPostById = (id: any) => {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: () => getPost(id),
  });
};

export const useAddPost = () => {
  const queryClient = useQueryClient();
  useMutation({
    mutationFn: addPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useUpdatePost = (id: string) => {
  const queryClient = useQueryClient();
  useMutation({
    mutationKey: ['update-post', id],
    mutationFn: updatePost.bind(null, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
