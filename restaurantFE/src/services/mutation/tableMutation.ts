import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
} from '@tanstack/react-query';
import {
  fetchTables,
  createTable,
  updateTable,
  deleteTable,
  createQR,
  fetchQRs,
  updateQr,
  fetchTableById,
} from '../api/tableApi';
import { Table, TableQueryParams } from '@/types/tableTypes';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';

interface PaginatedTableResponse {
  next: string | null;
  results: Table[];
  count: number;
}

const tableKeys = {
  all: ['tables'] as const,
  lists: () => [...tableKeys.all, 'list'] as const,
  list: (param?: TableQueryParams | null, noPage?: boolean) =>
    [...tableKeys.lists(), { param, noPage }] as const,
  details: () => [...tableKeys.all, 'detail'] as const,
  detail: (id: string) => [...tableKeys.details(), id] as const,
};

const qrKeys = {
  all: ['qrs'] as const,
  lists: () => [...qrKeys.all, 'list'] as const,
};

export const useGetTables = (
  param?: TableQueryParams | null,
  noPage?: boolean
) => {
  const queryKey = tableKeys.list(param, noPage);

  const queryFn: QueryFunction<PaginatedTableResponse, typeof queryKey> = ({
    queryKey: [, , { param: currentParam, noPage: currentNoPage }],
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(currentParam ?? {}).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, String(value));
      }
    });
    return fetchTables(searchParams.toString(), currentNoPage);
  };

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useGetTableById = (id: string) => {
  const queryKey = tableKeys.detail(id);

  const queryFn: QueryFunction<Table, typeof queryKey> = ({
    queryKey: [, , tableId],
  }) => fetchTableById(tableId);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
  });
};

export const useQRs = () => {
  const queryKey = qrKeys.lists();
  const queryFn: QueryFunction<any, typeof queryKey> = () => fetchQRs();

  return useQuery({
    queryKey,
    queryFn,
  });
};

export function useCreateTable() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: Partial<Table>) => createTable(variables),
    onMutate: () => dispatch(showLoader()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tableKeys.lists(),
        refetchType: 'all',
      });
    },
    onError: (err) => {
      console.error('Error creating table:', err);
    },
    onSettled: () => dispatch(hideLoader()),
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: any) => updateTable(variables),
    onMutate: () => dispatch(showLoader()),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: tableKeys.lists(),
        refetchType: 'all',
      });
      if (variables.id) {
        queryClient.setQueryData(tableKeys.detail(variables.id), data);
      }
    },
    onError: (err) => {
      console.error('Error updating table:', err);
    },
    onSettled: () => dispatch(hideLoader()),
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onMutate: () => dispatch(showLoader()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tableKeys.lists(),
        refetchType: 'all',
      });
    },
    onError: (err) => {
      console.error('Error deleting table:', err);
    },
    onSettled: () => dispatch(hideLoader()),
  });
}

export function useCreateQR() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: any) => createQR(variables),
    onMutate: () => dispatch(showLoader()),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: qrKeys.lists(),
        refetchType: 'all',
      });
    },
    onError: (err) => {
      console.error('Error creating QR:', err);
    },
    onSettled: () => dispatch(hideLoader()),
  });
}

export function useUpdateQr() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { id: string; qr: Partial<any> }) =>
      updateQr(variables.id, variables.qr),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: qrKeys.lists(),
        refetchType: 'all',
      });
    },
  });
}
