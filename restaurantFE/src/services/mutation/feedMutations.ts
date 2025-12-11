import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query';
import {
  addPost,
  deletePost,
  getPost,
  getPosts,
  getPostStats,
  updatePost,
} from '../api/feedApi';
import { Post } from '@/types/postType';

interface PostsResponse {
  next: string | null;
  results: Post[];
  count: number;
}

const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (page: number | null | undefined) =>
    [...postKeys.lists(), { page }] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string | any) => [...postKeys.details(), id] as const,
  stats: (id: string | any) => [...postKeys.all, 'stats', id] as const,
};

export const useGetPosts = (page?: number | null | undefined) => {
  const queryKey = postKeys.list(page);

  const queryFn: QueryFunction<PostsResponse, typeof queryKey> = ({
    queryKey: [, , { page: currentPage }],
  }) => getPosts(currentPage);

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useGetPostById = (id: any) => {
  const queryKey = postKeys.detail(id);

  const queryFn: QueryFunction<Post, typeof queryKey> = ({
    queryKey: [, , postId],
  }) => getPost(postId);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
  });
};

export const useGetPostsStats = (id: string) => {
  const queryKey = postKeys.stats(id);

  const queryFn: QueryFunction<any, typeof queryKey> = ({
    queryKey: [postId],
  }) => getPostStats(postId);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
  });
};

// ------------------------------------
// ## Post Mutations
// ------------------------------------

export const useAddPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: any) => addPost(variables),
    onSuccess: () => {
      // Invalidate the post list to refetch and show the new post
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

export const useUpdatePost = (id: string) => {
  const queryClient = useQueryClient();

  // The mutation function now takes only the update variables,
  // as the ID is closed over by the hook's scope.
  const mutationFn: MutationFunction<any, any> = (variables) =>
    updatePost(id, variables);

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.setQueryData(postKeys.detail(id), data);
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};
