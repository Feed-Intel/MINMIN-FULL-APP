import { useMutation, useQuery } from "@tanstack/react-query";
import {
  GetDashboardData,
  GetTenants,
  GetTenantById,
  GetTenantsByPrice,
} from "../api/tenantApi";
import { Restaurant } from "@/types/restaurantType";

export const useGetDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: GetDashboardData,
  });
export const useGetTenants = (searchTerm?: string) =>
  useQuery<Restaurant[]>({
    queryKey: ["tenant", searchTerm],
    queryFn: () => GetTenants(searchTerm),
  });

export const useGetTenantsByPrice = () =>
  useQuery({
    queryKey: ["tenantByPrice"],
    queryFn: GetTenantsByPrice,
  });
// export const useSearchRestaurant = () =>
//   useMutation({
//     mutationKey: ["searchRestaurant"],
//     mutationFn: GetTenantByName,
//   });

export const useGetTenantById = (id: string) =>
  useQuery<any>({
    queryKey: ["tenant", id],
    queryFn: () => GetTenantById(id),
    enabled: Boolean(id),
  });
