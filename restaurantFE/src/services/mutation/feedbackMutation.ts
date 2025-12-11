import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query';
import { CreateFeedback, GetFeedback } from '../api/feedback';

interface FeedbackResponse {
  next: string | null;
  results: any[];
  count: number;
}

const feedbackKeys = {
  all: ['feedback'] as const,
  lists: () => [...feedbackKeys.all, 'list'] as const,
  list: (page: number | undefined) =>
    [...feedbackKeys.lists(), { page }] as const,
};

export const useGetFeedback = (page?: number | undefined) => {
  const queryKey = feedbackKeys.list(page);

  const queryFn: QueryFunction<FeedbackResponse, typeof queryKey> = ({
    queryKey: [, , { page: currentPage }],
  }) => GetFeedback(currentPage);

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useCreateFeedback = () => {
  const queryClient = useQueryClient();

  const mutationFn: MutationFunction<any, any> = (variables) =>
    CreateFeedback(variables);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.lists() });
    },
  });
};
