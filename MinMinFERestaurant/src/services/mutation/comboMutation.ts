import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GetCombos,
  GetComboById,
  CreateCombo,
  UpdateCombo,
  DeleteCombo,
} from "../api/comboApi";
import { Combo } from "@/types/comboTypes";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/reduxStore/store";
import { hideLoader, showLoader } from "@/lib/reduxStore/loaderSlice";

export const useGetCombos = () =>
  useQuery<Combo[]>({
    queryKey: ["combos"],
    queryFn: GetCombos,
  });

export const useGetComboById = (id: string) =>
  useQuery({
    queryKey: ["combos", id],
    queryFn: () => GetComboById(id),
    staleTime: 0,
  });

export function useCreateCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationKey: ["create-combo"],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return CreateCombo(data);
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
}

export function useUpdateCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return UpdateCombo(data);
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
}

export function useDeleteCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return DeleteCombo(data);
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
      queryClient.invalidateQueries({ queryKey: ["combos"] });
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
}
