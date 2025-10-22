import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

// export const useTables = () =>
//   useQuery({
//     queryKey: ["tables"],
//     queryFn: fetchTables,
//   });
export const useQRs = () =>
  useQuery({
    queryKey: ['qrs'],
    queryFn: () => fetchQRs(),
    staleTime: 0,
  });
export function useCreateQR() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return createQR(data);
    },
    onError: (error: any) => {
      console.error('Error creating QR:', error);
    },
    onSuccess: () => {
      //("QR created successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['qrs'] });
      }
      dispatch(hideLoader());
    },
  });
}
export function useUpdateQr() {
  return useMutation({
    mutationFn: (data: { id: string; qr: Partial<any> }) => {
      return updateQr(data.id, data.qr);
    },
  });
}
export const useGetTables = (param?: TableQueryParams | null) =>
  useQuery<{ next: string | null; results: Table[]; count: number }>({
    queryKey: ['tables', param],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(param ?? {}).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });
      return fetchTables(searchParams.toString());
    },
    staleTime: 0,
    refetchOnMount: true,
  });

export const useGetTableById = (id: string) =>
  useQuery<Table>({
    queryKey: ['table', id],
    queryFn: () => fetchTableById(id),
    staleTime: 0,
  });
export function useCreateTable() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: (data: Partial<Table>) => {
      dispatch(showLoader());
      return createTable(data);
    },
    onError: (error: any) => {
      console.error('Error creating table:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['tables'] });
      }
      dispatch(hideLoader());
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: updateTable,
    onError: (error: any) => {
      console.error('Error creating table:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['tables'] });
      }
      dispatch(hideLoader());
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: (id: string) => {
      dispatch(showLoader());
      return deleteTable(id);
    },
    onError: (error: any) => {
      console.error('Error deleting table:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
    onSettled: async (_: any, error: any) => {
      dispatch(hideLoader());
    },
  });
}
