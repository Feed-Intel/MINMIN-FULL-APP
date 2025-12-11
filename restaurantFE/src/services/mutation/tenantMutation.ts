import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query';
import {
  GetDashboardData,
  GetTenantProfile,
  GetTopMenuItems,
  UpdateTenantProfile,
  UpdateTenantProfileImage,
} from '../api/tenantApi';

type DashboardParams = {
  period?: 'today' | 'month' | 'year' | 'custom';
  start_date?: string;
  end_date?: string;
  branch_id?: string;
};

type TopMenuItemsParams = {
  start_date?: string;
  end_date?: string;
  branch_id?: string;
};

const tenantKeys = {
  all: ['tenant'] as const,
  profile: (id?: string) => [...tenantKeys.all, 'profile', id] as const,
  dashboard: () => [...tenantKeys.all, 'dashboard'] as const,
  dashboardData: (params?: DashboardParams) =>
    [...tenantKeys.dashboard(), { params }] as const,
  topMenuItems: (params?: TopMenuItemsParams) =>
    [...tenantKeys.dashboard(), 'topMenuItems', { params }] as const,
};

export const useDashboardData = (params?: DashboardParams) => {
  const queryKey = tenantKeys.dashboardData(params);
  const queryFn: QueryFunction<any, typeof queryKey> = ({
    queryKey: [, , { params: currentParams }],
  }) => GetDashboardData(currentParams);

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useTopMenuItems = (params?: TopMenuItemsParams) => {
  const queryKey = tenantKeys.topMenuItems(params);
  const queryFn: QueryFunction<any, typeof queryKey> = ({
    queryKey: [, , , { params: currentParams }],
  }) => GetTopMenuItems(currentParams);

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useGetTenantProfile = (id?: string) => {
  const queryKey = tenantKeys.profile(id);

  const queryFn: QueryFunction<any, typeof queryKey> = ({
    queryKey: [, , profileId],
  }) => GetTenantProfile(profileId!);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
  });
};

export const useUpdateTenantProfile = (profileId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: any) => UpdateTenantProfile(variables),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: tenantKeys.profile(profileId),
      });
      queryClient.setQueryData(tenantKeys.profile(profileId), data);
    },
  });
};

export const useUpdateTenantProfileImage = (profileId?: string) => {
  const queryClient = useQueryClient();

  const mutationFn: MutationFunction<any, FormData> = (variables) =>
    UpdateTenantProfileImage(variables);

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: tenantKeys.profile(profileId),
      });
      queryClient.setQueryData(tenantKeys.profile(profileId), data);
    },
  });
};
