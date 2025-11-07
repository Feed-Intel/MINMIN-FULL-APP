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
import { useTime } from '@/context/time';

export const useGetBranches = (params?: any, noPage?: boolean) => {
  const { time } = useTime();
  return useQuery<{ next: string | null; results: Branch[]; count: number }>({
    queryKey: ['branches', params, time],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });
      return GetBranches(searchParams.toString(), noPage);
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetBranch = (id: string) => {
  const { time } = useTime();
  return useQuery<Branch>({
    queryKey: ['branch', id, time],
    queryFn: () => GetBranch(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useCreateBranch = (
  onSuccess?: (data?: any) => void,
  onError?: (error?: any) => void
) => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationKey: ['createBranch'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return CreateBranch(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.refetchQueries({
        queryKey: ['branches'],
        type: 'active',
      });
      setTime(Date.now());
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
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationKey: ['updateBranch'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return UpdateBranch(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.refetchQueries({
        queryKey: ['branches'],
        type: 'active',
      });
      setTime(Date.now());
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
  const { setTime } = useTime();
  return useMutation({
    mutationKey: ['deleteBranch'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return DeleteBranch(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.refetchQueries({
        queryKey: ['branches'],
        type: 'active',
      });
      setTime(Date.now());
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};
