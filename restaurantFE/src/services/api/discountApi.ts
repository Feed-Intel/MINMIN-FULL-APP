import { apiClient } from '@/config/axiosConfig';
import { asyncHandler } from '@/util/asyncHandler';

export const fetchDiscounts = asyncHandler(
  async (param?: string | null): Promise<any[]> => {
    const resp = await apiClient.get(`/discount?${param}`);
    return resp.data;
  }
);

export const fetchDiscount = asyncHandler(
  async (id: string): Promise<any[]> => {
    const resp = await apiClient.get(`/discount/${id}/`);
    return resp.data;
  }
);

export const fetchCoupons = asyncHandler(
  async (param?: string | null): Promise<any[]> => {
    const resp = await apiClient.get(`/coupon?${param}`);
    return resp.data || [];
  }
);

export const fetchCoupon = asyncHandler(async (id: string): Promise<any[]> => {
  const resp = await apiClient.get(`/coupon/${id}/`);
  return resp.data;
});

// Create a discount
export const createDiscount = asyncHandler(
  async (discount: Partial<any>): Promise<any> => {
    const { data } = await apiClient.post('/discount/', discount);
    return data;
  }
);

// Update a discount
export const updateDiscount = asyncHandler(
  async (discount: Partial<any>): Promise<any> => {
    const { data } = await apiClient.put(`/discount/${discount.id}/`, discount);
    return data;
  }
);

// export const fetchDiscountRules = asyncHandler(async (): Promise<any[]> => {
//   const resp = await apiClient.get("/discount-rule/", {
//     baseURL: BACKEND_URL,
//   });
//   return resp.data.results || [];
// });

export const fetchDiscountRules = asyncHandler(
  async (page?: number, noPage?: boolean): Promise<any[]> => {
    if (noPage) {
      const resp = await apiClient.get(`/discount-rule/?nopage=1`);
      return resp.data || [];
    }
    const resp = await apiClient.get(`/discount-rule/?page=${page || 1}`);
    return resp.data.results || [];
  }
);

export const fetchDiscountRule = asyncHandler(
  async (id: string): Promise<any[]> => {
    const resp = await apiClient.get(`/discount-rule/${id}/`);
    return resp.data;
  }
);

// Create a discountrule
export const createDiscountRule = asyncHandler(
  async (discount: Partial<any>): Promise<any> => {
    const { data } = await apiClient.post('/discount-rule/', discount);
    return data;
  }
);

// Update a discountrule
export const updateDiscountRule = asyncHandler(
  async (discount: Partial<any>): Promise<any> => {
    const { data } = await apiClient.patch(
      `/discount-rule/${discount.id}/`,
      discount
    );
    return data;
  }
);

// Delete a discount
export const deleteDiscount = asyncHandler(
  async (id: string): Promise<void> => {
    await apiClient.delete(`/discount/${id}/`);
  }
);

export const createCoupon = asyncHandler(
  async (coupon: Partial<any>): Promise<any> => {
    const { data } = await apiClient.post('/coupon/', coupon);
    return data;
  }
);

// Update a coupon
export const updateCoupon = asyncHandler(
  async (id: string, coupon: Partial<any>): Promise<any> => {
    console.log(coupon);
    const { data } = await apiClient.put(`/coupon/${id}/`, coupon);
    return data;
  }
);

export const deleteDiscountRule = asyncHandler(
  async (id: string): Promise<void> => {
    await apiClient.delete(`/discount-rule/${id}/`);
  }
);

export const deleteCoupon = asyncHandler(async (id: string): Promise<void> => {
  await apiClient.delete(`/coupon/${id}/`);
});

export const createCheckDiscount = asyncHandler(
  async (discount: Partial<any>) => {
    const response = await apiClient.post('/order/check-discount/', discount);
    if (!response.data) {
      throw new Error('No data returned from discount check');
    }
    return response.data;
  }
);
