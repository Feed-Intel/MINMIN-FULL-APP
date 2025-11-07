import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GetDashboardData,
  GetTenantProfile,
  GetTopMenuItems,
  UpdateTenantProfile,
  UpdateTenantProfileImage,
} from '../api/tenantApi';
import { useTime } from '@/context/time';

export const useDashboardData = (params?: {
  period?: 'today' | 'month' | 'year' | 'custom';
  start_date?: string;
  end_date?: string;
  branch_id?: string;
}) => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['dashboard', params, time],
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

export const useGetTenantProfile = (id?: string) => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['tenantProfile', id, time],
    queryFn: () => GetTenantProfile(id!),
    enabled: Boolean(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useUpdateTenantProfile = () => {
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: UpdateTenantProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantProfile'] });
      queryClient.refetchQueries({
        queryKey: ['tenantProfile'],
        type: 'active',
      });
      setTime(Date.now());
    },
  });
};

export const useUpdateTenantProfileImage = () => {
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: UpdateTenantProfileImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantProfile'] });
      queryClient.refetchQueries({
        queryKey: ['tenantProfile'],
        type: 'active',
      });
      setTime(Date.now());
    },
  });
};
