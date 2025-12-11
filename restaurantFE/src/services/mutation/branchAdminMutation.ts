import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query';
import {
  GetBranchAdmins,
  CreateBranchAdmin,
  GetBranchAdmin,
  UpdateBranchAdmin,
  DeleteBranchAdmin,
} from '../api/branchAdminApi';
import { BranchAdmin } from '@/types/branchAdmin';

interface BranchAdminsResponse {
  next: string | null;
  results: BranchAdmin[];
  count: number;
}

const branchAdminKeys = {
  all: ['branchAdmins'] as const,
  lists: () => [...branchAdminKeys.all, 'list'] as const,
  list: (page: number | undefined) =>
    [...branchAdminKeys.lists(), { page }] as const,
  details: () => [...branchAdminKeys.all, 'detail'] as const,
  detail: (adminId: string) => [...branchAdminKeys.details(), adminId] as const,
};

export const useGetBranchAdmins = (page: number | undefined) => {
  const queryKey = branchAdminKeys.list(page);
  const queryFn: QueryFunction<BranchAdminsResponse, typeof queryKey> = ({
    queryKey: [, , { page: currentPage }],
  }) => GetBranchAdmins(currentPage);

  return useQuery({
    queryKey,
    queryFn,
    enabled: true,
  });
};

export const useGetBranchAdmin = (adminId: string) => {
  const queryKey = branchAdminKeys.detail(adminId);
  const queryFn: QueryFunction<BranchAdmin, typeof queryKey> = ({
    queryKey: [, , adminIdValue],
  }) => GetBranchAdmin(adminIdValue);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!adminId,
  });
};

export const useCreateBranchAdmin = () => {
  const queryClient = useQueryClient();
  const mutationFn: MutationFunction<any, any> = (variables) =>
    CreateBranchAdmin(variables);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchAdminKeys.lists() });
    },
  });
};

export const useUpdateBranchAdmin = () => {
  const queryClient = useQueryClient();
  const mutationFn: MutationFunction<any, any> = (variables) =>
    UpdateBranchAdmin(variables);

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: branchAdminKeys.lists() });
      const adminId = variables.id;
      if (adminId) {
        queryClient.setQueryData(branchAdminKeys.detail(adminId), data);
      }
    },
  });
};

export const useDeleteBranchAdmin = () => {
  const queryClient = useQueryClient();
  const mutationFn: MutationFunction<any, any> = (variables) =>
    DeleteBranchAdmin(variables);

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchAdminKeys.lists() });
    },
  });
};
