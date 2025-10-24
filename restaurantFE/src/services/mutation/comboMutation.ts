import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  GetCombos,
  GetComboById,
  CreateCombo,
  UpdateCombo,
  DeleteCombo,
} from '../api/comboApi';
import { Combo, ComboQueryParams } from '@/types/comboTypes';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';

export const useGetCombos = (
  params?: ComboQueryParams | undefined,
  enabled?: boolean
) =>
  useQuery<{ next: string | null; results: Combo[]; count: number }>({
    queryKey: ['combos', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });
      return GetCombos(searchParams.toString());
    },
    enabled: enabled ?? true,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });

export const useGetComboById = (id: string) =>
  useQuery({
    queryKey: ['combos', id],
    queryFn: () => GetComboById(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });

export function useCreateCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['create-combo'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return CreateCombo(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return UpdateCombo(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      queryClient.refetchQueries({
        queryKey: ['combos'],
        type: 'active',
      });
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
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      queryClient.refetchQueries({
        queryKey: ['combos'],
        type: 'active',
      });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
}
