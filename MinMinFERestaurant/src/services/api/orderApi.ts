import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/util/asyncHandler";
import { Order } from "@/types/orderTypes";

export const fetchOrders = asyncHandler(async (): Promise<Order[]> => {
  try {
    const resp = await apiClient.get(`/order/`);
    return resp.data.results || [];
  } catch (error) {
    throw error;
  }
});

export const createOrder = asyncHandler(async (order: any): Promise<any> => {
  const { data } = await apiClient.post(`/order/`, order);
  return data;
});

export const fetchOrder = asyncHandler(async (id: string): Promise<Order[]> => {
  try {
    const resp = await apiClient.get(`/order/${id}/`);
    return resp.data;
  } catch (error) {
    throw error;
  }
});

export const fetchTenant = asyncHandler(async (): Promise<Order[]> => {
  try {
    const resp = await apiClient.get(`/tenant/`);
    return resp.data.results || [];
  } catch (error) {
    console.error("Error fetching tenant:", error);
    throw error;
  }
});

// Update an order
export const updateOrder = asyncHandler(
  async (id: string, order: any): Promise<any> => {
    const { data } = await apiClient.patch(`/order/${id}/`, order);
    return data;
  }
);

// Delete an order
export const deleteOrder = asyncHandler(async (id: string): Promise<void> => {
  await apiClient.delete(`/order/${id}/`);
});
