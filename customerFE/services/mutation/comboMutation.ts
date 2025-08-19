import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GetCombos,
  GetComboById,
  CreateCombo,
  UpdateCombo,
  DeleteCombo,
} from "../api/comboApi";
import { Combo } from "@/types/comboTypes";

export const useGetCombos = () =>
  useQuery<Combo[]>({
    queryKey: ["combos"],
    queryFn: GetCombos,
  });
export const useGetComboById = (id: string) =>
  useQuery({
    queryKey: ["combos", id],
    queryFn: () => GetComboById(id),
  });
export function useCreateCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  return useMutation({
    mutationKey: ["create-combo"],
    mutationFn: CreateCombo,
    onSuccess,
    onError,
  });
}

export function useUpdateCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  return useMutation({
    mutationFn: UpdateCombo,
    onSuccess,
    onError,
  });
}

export function useDeleteCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DeleteCombo,
    onSuccess,
    onError,
  });
}
