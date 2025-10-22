import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateFeedback, GetFeedback } from '../api/feedback';

export const useCreateFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['createFeedback'],
    mutationFn: CreateFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getFeedback'] });
    },
  });
};

export const useGetFeedback = (page?: number | undefined) =>
  useQuery<{ next: string | null; results: any[]; count: number }>({
    queryKey: ['getFeedback', page],
    queryFn: () => GetFeedback(page),
  });
