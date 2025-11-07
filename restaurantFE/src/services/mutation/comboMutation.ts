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
import { useTime } from '@/context/time';

export const useGetCombos = (
  params?: ComboQueryParams | undefined,
  enabled?: boolean
) => {
  const { time } = useTime();
  return useQuery<{ next: string | null; results: Combo[]; count: number }>({
    queryKey: ['combos', params, time],
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
};

export const useGetComboById = (id: string) => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['combos', id, time],
    queryFn: () => GetComboById(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export function useCreateCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationKey: ['create-combo'],
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return CreateCombo(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      setTime(Date.now());
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
  const { setTime } = useTime();
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
      setTime(Date.now());
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
  const { setTime } = useTime();
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
      setTime(Date.now());
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      dispatch(hideLoader());
      if (onError) onError(error);
    },
    onSettled: () => dispatch(hideLoader()),
  });
}
