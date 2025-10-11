import { useMutation, useQuery } from '@tanstack/react-query';
import { CreateFeedback, GetFeedback } from '../api/feedback';

export const useCreateFeedback = () =>
  useMutation({
    mutationKey: ['createFeedback'],
    mutationFn: CreateFeedback,
  });

export const useGetFeedback = (page?: number | undefined) =>
  useQuery<{ next: string | null; results: any[]; count: number }>({
    queryKey: ['getFeedback', page],
    queryFn: () => GetFeedback(page),
  });
