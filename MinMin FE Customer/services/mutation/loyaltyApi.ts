import { useMutation, useQuery } from "@tanstack/react-query";
import {
  GetLoyalties,
  GetTenantLoyalties,
  GetTransactionLoyalties,
} from "../api/loyaltyApi";

export const useGetLoyalties = (id: string) =>
  useQuery<any>({
    queryKey: ["customerLoyalty", id],
    queryFn: () => GetLoyalties(id),
  });

export const useGetTenantLoyalties = () =>
  useQuery<any[]>({
    queryKey: ["tenantLoyalty"],
    queryFn: GetTenantLoyalties,
  });

export const useGetTransactionLoyalties = () =>
  useQuery<any[]>({
    queryKey: ["transactionLoyalty"],
    queryFn: GetTransactionLoyalties,
  });
