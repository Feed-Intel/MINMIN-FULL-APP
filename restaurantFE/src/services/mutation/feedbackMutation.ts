import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateFeedback, GetFeedback } from '../api/feedback';

export const useCreateFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['createFeedback'],
    mutationFn: CreateFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getFeedback'] });
      queryClient.refetchQueries({
        queryKey: ['getFeedback'],
        type: 'active',
      });
    },
  });
};

export const useGetFeedback = (page?: number | undefined) =>
  useQuery<{ next: string | null; results: any[]; count: number }>({
    queryKey: ['getFeedback', page],
    queryFn: () => GetFeedback(page),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
