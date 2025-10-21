import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export const useGetBranches = (params?: any, noPage?: boolean) =>
  useQuery<{ next: string | null; results: Branch[]; count: number }>({
    queryKey: ['branches', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });
      return GetBranches(searchParams.toString(), noPage);
    },
    staleTime: 0,
  });

export const useGetBranch = (id: string) =>
  useQuery<Branch>({
    queryKey: ['branch', id],
    queryFn: () => GetBranch(id),
    staleTime: 0,
  });

export const useCreateBranch = (
  onSuccess?: (data?: any) => void,
  onError?: (error?: any) => void
) => {
  const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationKey: ['createBranch'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return CreateBranch(data);
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useUpdateBranch = (
  onSuccess?: (data?: any) => void,
  onError?: (error?: any) => void
) => {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationKey: ['updateBranch'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return UpdateBranch(data);
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};

export const useDeleteBranch = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationKey: ['deleteBranch'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return DeleteBranch(data);
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};
