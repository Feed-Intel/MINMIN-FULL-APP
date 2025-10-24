import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GetDashboardData,
  GetTenantProfile,
  GetTopMenuItems,
  UpdateTenantProfile,
  UpdateTenantProfileImage,
} from '../api/tenantApi';

export const useDashboardData = (params?: {
  period?: 'today' | 'month' | 'year' | 'custom';
  start_date?: string;
  end_date?: string;
  branch_id?: string;
}) => {
  return useQuery({
    queryKey: ['dashboard', params],
    queryFn: () => GetDashboardData(params),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useTopMenuItems = (params?: {
  start_date?: string;
  end_date?: string;
  branch_id?: string;
}) => {
  return useQuery({
    queryKey: ['topMenuItems', params],
    queryFn: () => GetTopMenuItems(params),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetTenantProfile = (id?: string) =>
  useQuery({
    queryKey: ['tenantProfile', id],
    queryFn: () => GetTenantProfile(id!),
    enabled: Boolean(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });

export const useUpdateTenantProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateTenantProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantProfile'] });
    },
  });
};

export const useUpdateTenantProfileImage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateTenantProfileImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantProfile'] });
      queryClient.refetchQueries({
        queryKey: ['tenantProfile'],
        type: 'active',
      });
    },
  });
};
