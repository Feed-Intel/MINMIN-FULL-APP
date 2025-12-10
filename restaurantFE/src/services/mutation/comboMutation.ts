import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query';
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

interface CombosResponse {
  next: string | null;
  results: Combo[];
  count: number;
}
const comboKeys = {
  all: ['combos'] as const,
  lists: () => [...comboKeys.all, 'list'] as const,
  list: (params: ComboQueryParams | undefined) =>
    [...comboKeys.lists(), { params }] as const,
  details: () => [...comboKeys.all, 'detail'] as const,
  detail: (id: string) => [...comboKeys.details(), id] as const,
};

// ------------------------------------
// ## Query Hooks (Data Fetching)
// ------------------------------------

export const useGetCombos = (
  params?: ComboQueryParams | undefined,
  enabled: boolean = true
) => {
  const queryKey = comboKeys.list(params);

  const queryFn: QueryFunction<CombosResponse, typeof queryKey> = ({
    queryKey: [, , { params: currentParams }],
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(currentParams ?? {}).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, String(value));
      }
    });
    return GetCombos(searchParams.toString());
  };

  return useQuery({
    queryKey,
    queryFn,
    enabled,
  });
};

export const useGetComboById = (id: string) => {
  const queryKey = comboKeys.detail(id);
  const queryFn: QueryFunction<Combo, typeof queryKey> = ({
    queryKey: [, , comboId],
  }) => GetComboById(comboId);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
  });
};

// ------------------------------------
// ## Mutation Hooks (CUD)
// ------------------------------------

export function useCreateCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  const mutationFn: MutationFunction<any, any> = (variables) =>
    CreateCombo(variables);

  return useMutation({
    mutationFn,
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: (data) => {
      // Invalidate the combos list query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: comboKeys.lists() });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
    },
    onSettled: () => {
      // Hide loader regardless of success or failure
      dispatch(hideLoader());
    },
  });
}

export function useUpdateCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  const mutationFn: MutationFunction<any, any> = (variables) =>
    UpdateCombo(variables);

  return useMutation({
    mutationFn,
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: (data, variables) => {
      // Invalidate the combos list
      queryClient.invalidateQueries({ queryKey: comboKeys.lists() });
      // Optionally update the single combo detail in the cache
      const comboId = variables.id; // Assuming variables contains the ID
      if (comboId) {
        queryClient.setQueryData(comboKeys.detail(comboId), data);
      }
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useDeleteCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  const mutationFn: MutationFunction<any, any> = (variables) =>
    DeleteCombo(variables);

  return useMutation({
    mutationFn,
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: comboKeys.lists() });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}
