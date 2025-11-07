import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GetBranchAdmins,
  CreateBranchAdmin,
  GetBranchAdmin,
  UpdateBranchAdmin,
  DeleteBranchAdmin,
} from '../api/branchAdminApi';
import { BranchAdmin } from '@/types/branchAdmin';
import { useTime } from '@/context/time';

export const useGetBranchAdmins = (page: number | undefined) => {
  const { time } = useTime();
  return useQuery<{
    next: string | null;
    results: BranchAdmin[];
    count: number;
  }>({
    queryKey: ['branchAdmins', page, time],
    queryFn: () => GetBranchAdmins(page),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetBranchAdmin = (adminId: string) => {
  const { time } = useTime();
  return useQuery<BranchAdmin>({
    queryKey: ['branchAdmin', adminId, time],
    queryFn: () => GetBranchAdmin(adminId),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useCreateBranchAdmin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationKey: ['createBranchAdmin'],
    mutationFn: CreateBranchAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
      queryClient.refetchQueries({
        queryKey: ['branchAdmins'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onError,
  });
};

export const useUpdateBranchAdmin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationKey: ['updateBranchAdmin'],
    mutationFn: UpdateBranchAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
      queryClient.refetchQueries({
        queryKey: ['branchAdmins'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onError,
  });
};

export const useDeleteBranchAdmin = () => {
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationKey: ['deleteBranchAdmin'],
    mutationFn: DeleteBranchAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
      queryClient.refetchQueries({
        queryKey: ['branchAdmins'],
        type: 'active',
      });
      setTime(Date.now());
    },
  });
};
