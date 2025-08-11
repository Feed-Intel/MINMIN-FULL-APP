import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CreateAWaiterCall,
  CreateBranch,
  GetBranch,
  GetBranchByDistance,
  GetBranchByLocation,
  GetBranches,
  UpdateBranch,
} from "../api/branchApi";
import { Branch } from "@/types/branchType";
import { useAppSelector } from "@/lib/reduxStore/hooks";

export const useGetBranches = () =>
  useQuery<Branch[]>({
    queryKey: ["branches"],
    queryFn: GetBranches,
  });

export const useGetBranch = (id: string) =>
  useQuery<Branch>({
    queryKey: ["branch", id],
    queryFn: () => GetBranch(id),
  });

export const useGetBranchByLocation = () => {
  const { latitude, longitude } = useAppSelector((state) => state.location);
  return useQuery<Branch[]>({
    queryKey: ["branchNear", longitude, latitude],
    enabled: Boolean(latitude && longitude),
    queryFn: () => GetBranchByLocation(longitude!, latitude!),
  });
};

export const useGetBranchByDistance = () => {
  const { latitude, longitude } = useAppSelector((state) => state.location);
  return useQuery<Branch[]>({
    queryKey: ["branchDistance", longitude, latitude],
    enabled: Boolean(latitude && longitude),
    queryFn: () => GetBranchByDistance(longitude!, latitude!),
  });
};

export const useCreateAWaiterCall = (
  onSuccess?: (data?: any) => void,
  onError?: (error?: any) => void
) =>
  useMutation({
    mutationKey: ["createAWaiterCall"],
    mutationFn: CreateAWaiterCall,
    onSuccess,
    onError,
  });

export const useCreateBranch = (
  onSuccess?: (data?: any) => void,
  onError?: (error?: any) => void
) =>
  useMutation({
    mutationKey: ["createBranch"],
    mutationFn: CreateBranch,
    onSuccess,
    onError,
  });

export const useUpdateBranch = (
  onSuccess?: (data?: any) => void,
  onError?: (error?: any) => void
) =>
  useMutation({
    mutationKey: ["updateBranch"],
    mutationFn: UpdateBranch,
    onSuccess,
    onError,
  });
