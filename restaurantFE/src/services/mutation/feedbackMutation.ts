import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateFeedback, GetFeedback } from '../api/feedback';
import { useTime } from '@/context/time';

export const useCreateFeedback = () => {
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationKey: ['createFeedback'],
    mutationFn: CreateFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getFeedback'] });
      queryClient.refetchQueries({
        queryKey: ['getFeedback'],
        type: 'active',
      });
      setTime(Date.now());
    },
  });
};

export const useGetFeedback = (page?: number | undefined) => {
  const { time } = useTime();
  return useQuery<{ next: string | null; results: any[]; count: number }>({
    queryKey: ['getFeedback', page, time],
    queryFn: () => GetFeedback(page),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};
