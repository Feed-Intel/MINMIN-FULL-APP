import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  updateDiscountRule,
  createDiscountRule,
  fetchDiscountRules,
  updateCoupon,
  createCoupon,
  fetchCoupons,
  deleteDiscountRule,
  deleteCoupon,
  fetchCoupon,
  createApplyDiscount,
  fetchBigDiscountItems,
  createCheckDiscount,
} from "../api/discountApi";
import { Coupon, Discount } from "@/types/discountTypes";
import { MenuAvailability, MenuType } from "@/types/menuType";

// export const useDiscounts = () =>
//   useQuery({
//     queryKey: ["discounts"],
//     queryFn: fetchDiscounts,
//   });
export const useDiscounts = () =>
  useQuery<Discount[]>({
    queryKey: ["discounts"],
    queryFn: () => fetchDiscounts(),
  });
export function useCreateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      return createDiscount(data);
    },
    onError: (error: any) => {
      console.error("Error creating discount:", error);
    },
    onSuccess: () => {
      //("Discount created successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["discounts"] });
      }
    },
  });
}

export function useCheckDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      return createCheckDiscount(data);
    },
    onError: (error: any) => {
      console.error("Error checking discount:", error);
    },
    onSuccess: () => {
      ("Discount created successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["discounts"] });
      }
    },
  });
}

export const useGetBigDiscountItems = () =>
  useQuery<MenuAvailability[]>({
    queryKey: ["big_discount_items"],
    queryFn: fetchBigDiscountItems,
  });

export function useCreateApplyDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      return createApplyDiscount(data);
    },
    onError: (error: any) => {
      console.error("Error creating apply-discount:", error);
    },
    onSuccess: () => {
      //("Discount created successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["apply-discounts"] });
      }
    },
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; discount: Partial<any> }) => {
      return updateDiscount(data.id, data.discount);
    },
    onError: (error: any) => {
      console.error("Error updating discount:", error);
    },
    onSuccess: () => {
      //("Discount updated successfully");
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
    onSettled: () => {},
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return deleteDiscount(id);
    },
    onError: (error: any) => {
      console.error("Error deleting discount:", error);
    },
    onSuccess: () => {
      //("Discount deleted successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["discounts"] });
      }
    },
  });
}

// export const useDiscountRules = () =>
//   useQuery({
//     queryKey: ["discountRules"],
//     queryFn: fetchDiscountRules,
//   });
export const useDiscountRules = () =>
  useQuery({
    queryKey: ["discountRules"],
    queryFn: () => fetchDiscountRules(),
  });

export const useGetCoupons = () =>
  useQuery<Coupon[]>({
    queryKey: ["coupons"],
    queryFn: () => fetchCoupons(),
  });

export const useGetCoupon = (id: string) =>
  useQuery({
    queryKey: ["coupon", id],
    queryFn: () => fetchCoupon(id),
  });
export function useCreateDiscountRule(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      return createDiscountRule(data);
    },
    onSuccess,
    onError,
  });
}

export function useUpdateDiscountRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; discount: Partial<any> }) => {
      return updateDiscountRule(data.id, data.discount);
    },
    onError: (error: any) => {
      console.error("Error updating discountRule:", error);
    },
    onSuccess: () => {
      //("DiscountRule updated successfully");
      queryClient.invalidateQueries({ queryKey: ["discountRules"] });
    },
    onSettled: () => {},
  });
}

export function useDeleteDiscountRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: any) => {
      return deleteDiscountRule(id);
    },
    onError: (error: any) => {
      console.error("Error deleting discountRule:", error);
    },
    onSuccess: () => {
      //("DiscountRule deleted successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["discountRules"] });
      }
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      return createCoupon(data);
    },
    onError: (error: any) => {
      console.error("Error creating discount:", error);
    },
    onSuccess: () => {
      //("Coupon created successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["coupons"] });
      }
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; coupon: Partial<any> }) => {
      return updateCoupon(data.id, data.coupon);
    },
    onError: (error: any) => {
      console.error("Error updating Coupon:", error);
    },
    onSuccess: () => {
      //("Coupon updated successfully");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onSettled: () => {},
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return deleteCoupon(id);
    },
    onError: (error: any) => {
      console.error("Error deleting Coupon:", error);
    },
    onSuccess: () => {
      //("Coupon deleted successfully");
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ["coupon"] });
      }
    },
  });
}
