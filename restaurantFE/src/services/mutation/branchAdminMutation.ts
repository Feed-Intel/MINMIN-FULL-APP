import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GetBranchAdmins,
  CreateBranchAdmin,
  GetBranchAdmin,
  UpdateBranchAdmin,
  DeleteBranchAdmin,
} from '../api/branchAdminApi';
import { BranchAdmin } from '@/types/branchAdmin';

export const useGetBranchAdmins = (page: number | undefined) =>
  useQuery<{ next: string | null; results: BranchAdmin[]; count: number }>({
    queryKey: ['branchAdmins', page],
    queryFn: () => GetBranchAdmins(page),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });

export const useGetBranchAdmin = (adminId: string) =>
  useQuery<BranchAdmin>({
    queryKey: ['branchAdmin', adminId],
    queryFn: () => GetBranchAdmin(adminId),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });

export const useCreateBranchAdmin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['createBranchAdmin'],
    mutationFn: CreateBranchAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
      queryClient.refetchQueries({
        queryKey: ['branchAdmins'],
        type: 'active',
      });
    },
    onError,
  });
};

export const useUpdateBranchAdmin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['updateBranchAdmin'],
    mutationFn: UpdateBranchAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
      queryClient.refetchQueries({
        queryKey: ['branchAdmins'],
        type: 'active',
      });
    },
    onError,
  });
};

export const useDeleteBranchAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteBranchAdmin'],
    mutationFn: DeleteBranchAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
      queryClient.refetchQueries({
        queryKey: ['branchAdmins'],
        type: 'active',
      });
    },
  });
};
