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
import { useTime } from '@/context/time';

// export const useTables = () =>
//   useQuery({
//     queryKey: ["tables"],
//     queryFn: fetchTables,
//   });
export const useQRs = () => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['qrs', time],
    queryFn: () => fetchQRs(),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};
export function useCreateQR() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (data: any) => {
      dispatch(showLoader());
      return createQR(data);
    },
    onError: (error: any) => {
      console.error('Error creating QR:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrs'] });
      setTime(Date.now());
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
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (data: { id: string; qr: Partial<any> }) => {
      return updateQr(data.id, data.qr);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrs'] });
      setTime(Date.now());
    },
  });
}
export const useGetTables = (param?: TableQueryParams | null) => {
  const { time } = useTime();
  return useQuery<{ next: string | null; results: Table[]; count: number }>({
    queryKey: ['tables', param, time],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(param ?? {}).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });
      return fetchTables(searchParams.toString());
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetTableById = (id: string) => {
  const { time } = useTime();
  return useQuery<Table>({
    queryKey: ['table', id, time],
    queryFn: () => fetchTableById(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};
export function useCreateTable() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
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
      setTime(Date.now());
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['tables'] });
        await queryClient.refetchQueries({
          queryKey: ['tables'],
          type: 'active',
        });
      }
      dispatch(hideLoader());
    },
  });
}

export function useUpdateTable() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: updateTable,
    onError: (error: any) => {
      console.error('Error creating table:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setTime(Date.now());
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['tables'] });
        await queryClient.refetchQueries({
          queryKey: ['tables'],
          type: 'active',
        });
      }
      dispatch(hideLoader());
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
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
      queryClient.refetchQueries({
        queryKey: ['tables'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: async (_: any, error: any) => {
      dispatch(hideLoader());
    },
  });
}
