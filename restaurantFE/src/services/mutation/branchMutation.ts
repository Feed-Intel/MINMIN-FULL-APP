import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query';
import {
  CreateBranch,
  DeleteBranch,
  GetBranch,
  GetBranches,
  UpdateBranch,
} from '../api/branchApi';
import { Branch } from '@/types/branchType';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';

interface BranchesResponse {
  next: string | null;
  results: Branch[];
  count: number;
}
const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (params: any, noPage: boolean | undefined) =>
    [...branchKeys.lists(), { params, noPage }] as const,
  details: () => [...branchKeys.all, 'detail'] as const,
  detail: (id: string) => [...branchKeys.details(), id] as const,
};

// ------------------------------------
// ## Query Hooks (Data Fetching)
// ------------------------------------

export const useGetBranches = (params?: any, noPage?: boolean) => {
  const queryKey = branchKeys.list(params, noPage);

  const queryFn: QueryFunction<BranchesResponse, typeof queryKey> = ({
    queryKey: [, , { params: currentParams, noPage: currentNoPage }],
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(currentParams ?? {}).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, String(value));
      }
    });
    return GetBranches(searchParams.toString(), currentNoPage);
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled: true,
  });
};

export const useGetBranch = (id: string) => {
  const queryKey = branchKeys.detail(id);
  const queryFn: QueryFunction<Branch, typeof queryKey> = ({
    queryKey: [, , branchId],
  }) => GetBranch(branchId);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id, // Only run the query if the ID is provided
  });
};

// ------------------------------------
// ## Mutation Hooks (CUD)
// ------------------------------------

export const useCreateBranch = (
  onSuccess?: (data?: any) => void,
  onError?: (error?: any) => void
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  const mutationFn: MutationFunction<any, any> = (variables) =>
    CreateBranch(variables);

  return useMutation({
    mutationFn,
    onMutate: () => {
      dispatch(showLoader()); // Show loader before the mutation starts
    },
    onSuccess: (data) => {
      // Invalidate the branches list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
    },
    onSettled: () => {
      // Hide loader regardless of success or failure
      dispatch(hideLoader());
    },
  });
};

export const useUpdateBranch = (
  onSuccess?: (data?: any) => void,
  onError?: (error?: any) => void
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  const mutationFn: MutationFunction<any, any> = (variables) =>
    UpdateBranch(variables);

  return useMutation({
    mutationFn,
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: (data, variables) => {
      // Invalidate the branches list
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      // Optionally update the single branch detail in the cache
      const branchId = variables.id; // Assuming variables contains the ID
      if (branchId) {
        queryClient.setQueryData(branchKeys.detail(branchId), data);
      }
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
};

export const useDeleteBranch = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  const mutationFn: MutationFunction<any, any> = (variables) =>
    DeleteBranch(variables);

  return useMutation({
    mutationFn,
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: (data) => {
      // Invalidate the branches list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
};
