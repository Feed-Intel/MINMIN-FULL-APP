import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrders,
  updateOrder,
  deleteOrder,
  fetchTenant,
  fetchOrder,
  createOrder,
} from "../api/orderApi";
import { Order } from "@/types/orderTypes";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/reduxStore/store";
import { hideLoader, showLoader } from "@/lib/reduxStore/loaderSlice";

export const useOrders = () =>
  useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
    staleTime: 0,
    refetchInterval: 15000,
  });

export const useGetOrder = (id: string) =>
  useQuery<Order>({
    queryKey: ["order", id],
    queryFn: () => fetchOrder(id),
    staleTime: 0,
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

export const useTenant = () =>
  useQuery({
    queryKey: ["tenant"],
    queryFn: fetchTenant,
    staleTime: 0,
  });

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: (data: { id: string; order: any }) => {
      dispatch(showLoader());
      return updateOrder(data.id, data.order);
    },
    onError: (error: any) => {
      console.error("Error updating order:", error);
    },
    onSuccess: () => {
      //("Order updated successfully");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: (id: string) => {
      dispatch(showLoader());
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
      dispatch(hideLoader());
    },
  });
}
