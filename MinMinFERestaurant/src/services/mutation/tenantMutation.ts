import { useQuery, useMutation } from "@tanstack/react-query";
import {
  GetDashboardData,
  GetTenantProfile,
  GetTopMenuItems,
  UpdateTenantProfile,
  UpdateTenantProfileImage,
} from "../api/tenantApi";

export const useDashboardData = (params?: {
  period?: 'today' | 'month' | 'year';
  start_date?: string;
  end_date?: string;
  branch_id?: string;
}) => {
  return useQuery({
    queryKey: ["dashboard", params],
    queryFn: () => GetDashboardData(params),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useTopMenuItems = (params?: {
  start_date?: string;
  end_date?: string;
  // branch_id?: string;
}) => {
  console.log(params);
  return useQuery({
    queryKey: ["topMenuItems", params],
    queryFn: () => GetTopMenuItems(params),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

export const useGetTenantProfile = (id: string) =>
  useQuery({
    queryKey: ["tenantProfile"],
    queryFn: () => GetTenantProfile(id),
    staleTime: 0,
  });

export const useUpdateTenantProfile = () =>
  useMutation({
    mutationFn: UpdateTenantProfile,
  });

export const useUpdateTenantProfileImage = () =>
  useMutation({
    mutationFn: UpdateTenantProfileImage,
  });
