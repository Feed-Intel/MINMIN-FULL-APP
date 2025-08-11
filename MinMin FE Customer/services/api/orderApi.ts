import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/utils/asyncHandler";
import { Order } from "@/types/orderTypes";

export const fetchOrders = asyncHandler(
  async (nextPage?: string): Promise<Order[]> => {
    if (nextPage) {
      const page = nextPage.split("page=")[1];
      const resp = await apiClient.get(`/order/?page=${page}`);
      return resp.data || [];
    } else {
      const resp = await apiClient.get(`/order/`);
      return resp.data || [];
    }
  }
);

export const fetchTenant = asyncHandler(async (): Promise<Order[]> => {
  try {
    const resp = await apiClient.get(`/tenant/`);
    return resp.data.results || [];
  } catch (error) {
    console.error("Error fetching tenant:", error);
    throw error;
  }
});

// create an order
export const createOrder = asyncHandler(async (order: any): Promise<any> => {
  const { data } = await apiClient.post(`/order/`, order);
  return data;
});

// Update an order
export const updateOrder = async (id: string, order: any): Promise<any> => {
  const { data } = await apiClient.patch(`/order/${id}/`, order);
  return data;
};

// Delete an order
export const deleteOrder = async (id: string): Promise<void> => {
  await apiClient.delete(`/order/${id}/`);
};
