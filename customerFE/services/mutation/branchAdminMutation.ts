import { useQuery, useMutation } from "@tanstack/react-query";
import {
  GetBranchAdmins,
  CreateBranchAdmin,
  GetBranchAdmin,
  UpdateBranchAdmin,
} from "../api/branchAdminApi";
import { BranchAdmin } from "@/types/branchAdmin";

export const useGetBranchAdmins = () =>
  useQuery<BranchAdmin[]>({
    queryKey: ["branchAdmins"],
    queryFn: GetBranchAdmins,
  });

export const useGetBranchAdmin = (adminId: string) =>
  useQuery<BranchAdmin>({
    queryKey: ["branchAdmin", adminId],
    queryFn: () => GetBranchAdmin(adminId),
  });

export const useCreateBranchAdmin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ["createBranchAdmin"],
    mutationFn: CreateBranchAdmin,
    onSuccess: onSuccess,
    onError,
  });

export const useUpdateBranchAdmin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ["updateBranchAdmin"],
    mutationFn: UpdateBranchAdmin,
    onSuccess: onSuccess,
    onError,
  });
