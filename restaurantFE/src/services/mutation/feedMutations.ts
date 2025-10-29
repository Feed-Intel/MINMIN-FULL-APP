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
import { useTime } from '@/context/time';

export const useGetPosts = (page?: number | null | undefined) => {
  const { time } = useTime();
  return useQuery<{ next: string | null; results: Post[]; count: number }>({
    queryKey: ['posts', page, time],
    queryFn: () => getPosts(page),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetPostsStats = (id: string) => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['postStats', id, time],
    queryFn: () => getPostStats(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetPostById = (id: any) => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['posts', id, time],
    queryFn: () => getPost(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useAddPost = () => {
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: addPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.refetchQueries({
        queryKey: ['posts'],
        type: 'active',
      });
      setTime(Date.now());
    },
  });
};

export const useUpdatePost = (id: string) => {
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationKey: ['update-post', id],
    mutationFn: updatePost.bind(null, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.refetchQueries({
        queryKey: ['posts'],
        type: 'active',
      });
      setTime(Date.now());
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.refetchQueries({
        queryKey: ['posts'],
        type: 'active',
      });
      setTime(Date.now());
    },
  });
};
