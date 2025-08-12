import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrders,
  updateOrder,
  deleteOrder,
  fetchTenant,
  createOrder,
} from "../api/orderApi";

export const useOrders = (nextPage?: string) =>
  useQuery<{ results: any[]; next: string }>({
    queryKey: ["orders", nextPage],
    queryFn: () => fetchOrders(nextPage),
    refetchInterval: 20000,
  });

export const useTenant = () =>
  useQuery({
    queryKey: ["tenant"],
    queryFn: fetchTenant,
  });

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      return createOrder(data);
    },
    onError: (error: any) => {
      console.error("Error creating Order:", error);
    },
    onSuccess: () => {
      //("Order created successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; order: any }) => {
      return updateOrder(data.id, data.order);
    },
    onError: (error: any) => {
      console.error("Error updating order:", error);
    },
    onSuccess: () => {
      //("Order updated successfully");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onSettled: () => {},
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return deleteOrder(id);
    },
    onError: (error: any) => {
      console.error("Error deleting order:", error);
    },
    onSuccess: () => {
      //("Order deleted successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    },
  });
}
