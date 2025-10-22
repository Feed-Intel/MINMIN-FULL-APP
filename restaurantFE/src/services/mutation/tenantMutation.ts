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
    staleTime: 1000 * 60 * 5, // 5 minutes cache
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
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useGetTenantProfile = (id?: string) =>
  useQuery({
    queryKey: ['tenantProfile', id],
    queryFn: () => GetTenantProfile(id!),
    enabled: Boolean(id),
    staleTime: 0,
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
    },
  });
};
