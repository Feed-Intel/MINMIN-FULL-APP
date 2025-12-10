import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
} from '@tanstack/react-query';
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

interface PaginatedOrdersResponse {
  next: string | null;
  results: Order[];
  count: number;
}

const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (params?: OrderQueryParams) =>
    [...orderKeys.lists(), { params }] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  tenant: () => ['tenant'] as const, // Separate key for global tenant data
};

export const useOrders = (params?: OrderQueryParams) => {
  const queryKey = orderKeys.list(params);

  const queryFn: QueryFunction<PaginatedOrdersResponse, typeof queryKey> = ({
    queryKey: [, , { params: currentParams }],
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(currentParams ?? {}).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, String(value));
      }
    });
    return fetchOrders(searchParams.toString());
  };

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useGetOrder = (id: string) => {
  const queryKey = orderKeys.detail(id);

  const queryFn: QueryFunction<Order, typeof queryKey> = ({
    queryKey: [, , orderId],
  }) => fetchOrder(orderId);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
  });
};

export const useTenant = () => {
  const queryKey = orderKeys.tenant();

  const queryFn: QueryFunction<any, typeof queryKey> = () => fetchTenant();

  return useQuery({
    queryKey,
    queryFn,
  });
};

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: Partial<any>) => createOrder(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (err) => {
      console.error('Error creating Order:', err);
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: { id: string; order: any }) =>
      updateOrder(variables.id, variables.order),
    onMutate: () => dispatch(showLoader()),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.setQueryData(orderKeys.detail(variables.id), data);
    },
    onError: (err) => {
      console.error('Error updating order:', err);
    },
    onSettled: () => dispatch(hideLoader()),
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onMutate: () => dispatch(showLoader()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
    onError: (err) => {
      console.error('Error deleting order:', err);
    },
    onSettled: () => dispatch(hideLoader()),
  });
}
