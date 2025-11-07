import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchOrders,
  updateOrder,
  deleteOrder,
  fetchTenant,
  fetchOrder,
  createOrder,
} from '../api/orderApi';
import { Order, OrderQueryParams } from '@/types/orderTypes';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useTime } from '@/context/time';

export const useOrders = (params?: OrderQueryParams) => {
  const { time } = useTime();
  return useQuery<{ next: string | null; results: Order[]; count: number }>({
    queryKey: ['orders', params, time],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });
      return fetchOrders(searchParams.toString());
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetOrder = (id: string) => {
  const { time } = useTime();
  return useQuery<Order>({
    queryKey: ['order', id, time],
    queryFn: () => fetchOrder(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      return createOrder(data);
    },
    onError: (error: any) => {
      console.error('Error creating Order:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.refetchQueries({
        queryKey: ['orders'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
    },
  });
}

export const useTenant = () => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['tenant', time],
    queryFn: fetchTenant,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (data: { id: string; order: any }) => {
      dispatch(showLoader());
      return updateOrder(data.id, data.order);
    },
    onError: (error: any) => {
      console.error('Error updating order:', error);
    },
    onSuccess: () => {
      //("Order updated successfully");
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.refetchQueries({
        queryKey: ['orders'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (id: string) => {
      dispatch(showLoader());
      return deleteOrder(id);
    },
    onError: (error: any) => {
      console.error('Error deleting order:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.refetchQueries({
        queryKey: ['orders'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
      dispatch(hideLoader());
    },
  });
}
