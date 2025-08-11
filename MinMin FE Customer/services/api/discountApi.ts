import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/utils/asyncHandler";

export const fetchDiscounts = asyncHandler(async (): Promise<any[]> => {
  const resp = await apiClient.get(`/discount/`);
  return resp.data.results || [];
});

export const fetchBigDiscountItems = asyncHandler(async (): Promise<any[]> => {
  const resp = await apiClient.get(`/discount/big_discount_items/`);
  return resp.data || [];
});

export const fetchDiscount = asyncHandler(
  async (id: string): Promise<any[]> => {
    const resp = await apiClient.get(`/discount/${id}/`);
    return resp.data.results || [];
  }
);

export const fetchCoupons = asyncHandler(async (): Promise<any[]> => {
  const resp = await apiClient.get(`/coupon/`);
  return resp.data.results || [];
});

export const fetchCoupon = asyncHandler(async (id: string): Promise<any[]> => {
  const resp = await apiClient.get(`/coupon/${id}/`);
  return resp.data.results || [];
});

// Create a discount
export const createDiscount = asyncHandler(
  async (discount: Partial<any>): Promise<any> => {
    const { data } = await apiClient.post("/discount/", discount);
    return data;
  }
);

export const createApplyDiscount = asyncHandler(
  async (discount: Partial<any>): Promise<any> => {
    const { data } = await apiClient.post(
      "/discount/apply-discount/",
      discount
    );
    return data;
  }
);

export const createCheckDiscount = asyncHandler(
  async (discount: Partial<any>) => {
    const response = await apiClient.post("/order/check-discount/", discount);
    if (!response.data) {
      throw new Error("No data returned from discount check");
    }
    //////("data resp",response.data);
    return response.data;
  }
);

// Update a discount
export const updateDiscount = asyncHandler(
  async (id: string, discount: Partial<any>): Promise<any> => {
    const { data } = await apiClient.put(`/discount/${id}/`, discount);
    return data;
  }
);

// export const fetchDiscountRules = asyncHandler(async (): Promise<any[]> => {
//   const resp = await apiClient.get("/discount-rule/", {
//     baseURL: BACKEND_URL,
//   });
//   return resp.data.results || [];
// });

export const fetchDiscountRules = asyncHandler(async (): Promise<any[]> => {
  const resp = await apiClient.get(`/discount-rule/`);
  return resp.data.results || [];
});

// Create a discountrule
export const createDiscountRule = asyncHandler(
  async (discount: Partial<any>): Promise<any> => {
    const { data } = await apiClient.post("/discount-rule/", discount);
    return data;
  }
);

// Update a discountrule
export const updateDiscountRule = asyncHandler(
  async (id: string, discount: Partial<any>): Promise<any> => {
    const { data } = await apiClient.put(`/discount-rule/${id}/`, discount);
    return data;
  }
);

// Delete a discount
export const deleteDiscount = async (id: string): Promise<void> => {
  await apiClient.delete(`/discounts/${id}/`);
};

export const createCoupon = asyncHandler(
  async (coupon: Partial<any>): Promise<any> => {
    const { data } = await apiClient.post("/coupon/", coupon);
    return data;
  }
);

// Update a coupon
export const updateCoupon = asyncHandler(
  async (id: string, coupon: Partial<any>): Promise<any> => {
    const { data } = await apiClient.put(`/coupon/${id}/`, coupon);
    return data;
  }
);

export const deleteDiscountRule = async (id: string): Promise<void> => {
  await apiClient.delete(`/discount-rule/${id}/`);
};

export const deleteCoupon = async (id: string): Promise<void> => {
  await apiClient.delete(`/coupon/${id}/`);
};
