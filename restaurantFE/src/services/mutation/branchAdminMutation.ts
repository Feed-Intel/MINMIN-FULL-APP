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
    staleTime: 0,
  });

export const useGetBranchAdmin = (adminId: string) =>
  useQuery<BranchAdmin>({
    queryKey: ['branchAdmin', adminId],
    queryFn: () => GetBranchAdmin(adminId),
    staleTime: 0,
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
    },
  });
};
