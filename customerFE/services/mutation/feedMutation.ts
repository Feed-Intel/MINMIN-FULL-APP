import { useQuery, useMutation } from '@tanstack/react-query';
import {
  GetPosts,
  likePost,
  addComment,
  addBookMark,
  GetBookMarkPosts,
  sharePost,
  GetPost,
} from '../api/feedApi';
import { Post } from '@/types/postType';

export const useGetPosts = (searchTerm?: string) =>
  useQuery<Post[]>({
    queryKey: ['posts', searchTerm],
    queryFn: () => GetPosts(searchTerm),
  });

export const useGetPost = (id: string) =>
  useQuery<Post[]>({
    queryKey: ['post', id],
    queryFn: () => GetPost(id),
  });

export const useGetBookMarks = () =>
  useQuery<Post[]>({
    queryKey: ['bookMarkPosts'],
    queryFn: GetBookMarkPosts,
  });

export const useLikePost = () =>
  useMutation({
    mutationKey: ['likePost'],
    mutationFn: likePost,
  });

export const useAddComment = () =>
  useMutation({
    mutationKey: ['addComment'],
    mutationFn: addComment,
  });

export const useAddBookMark = () =>
  useMutation({
    mutationKey: ['addBookMark'],
    mutationFn: addBookMark,
  });

export const useSharePost = () =>
  useMutation({
    mutationKey: ['posts'],
    mutationFn: sharePost,
  });
