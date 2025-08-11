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
  fetchDiscount,
  fetchDiscountRule,
} from "../api/discountApi";
import { Coupon, Discount } from "@/types/discountTypes";
import { AppDispatch } from "@/lib/reduxStore/store";
import { useDispatch } from "react-redux";
import { hideLoader, showLoader } from "@/lib/reduxStore/loaderSlice";

// export const useDiscounts = () =>
//   useQuery({
//     queryKey: ["discounts"],
//     queryFn: fetchDiscounts,
//   });
export const useDiscounts = () =>
  useQuery<Discount[]>({
    queryKey: ["discounts"],
    queryFn: () => fetchDiscounts(),
    staleTime: 0,
    refetchInterval: 30000,
  });
export function useCreateDiscount() {
  const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (data: Partial<any>) => {
      dispatch(showLoader());
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
      dispatch(hideLoader());
    },
  });
}

export const useGetDiscountById = (id: string) =>
  useQuery({
    queryKey: ["discount", id],
    queryFn: () => fetchDiscount(id),
    staleTime: 0,
  });

export function useUpdateDiscount() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: updateDiscount,
    onMutate: () => dispatch(showLoader()),
    onError: (error: any) => {
      console.error("Error updating discount:", error);
    },
    onSuccess: () => {
      //("Discount updated successfully");
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (id: string) => {
      dispatch(showLoader())
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
      dispatch(hideLoader());
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
    staleTime: 0,
  });

export const useGetDiscountRuleById = (id: string) =>
  useQuery({
    queryKey: ["discountRule", id],
    queryFn: () => fetchDiscountRule(id),
    staleTime: 0,
  });

export const useGetCoupons = () =>
  useQuery<Coupon[]>({
    queryKey: ["coupons"],
    queryFn: () => fetchCoupons(),
    staleTime: 0,
  });

export const useGetCoupon = (id: string) =>
  useQuery({
    queryKey: ["coupon", id],
    queryFn: () => fetchCoupon(id),
    staleTime: 0,
  });
export function useCreateDiscountRule(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
    const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      dispatch(showLoader());
      return createDiscountRule(data);
    },
    onSuccess,
    onError,
    onSettled: () => dispatch(hideLoader()),
  });
}

export function useUpdateDiscountRule() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: updateDiscountRule,
    onMutate: () => dispatch(showLoader()),
    onError: (error: any) => {
      console.error("Error updating discountRule:", error);
    },
    onSuccess: () => {
      //("DiscountRule updated successfully");
      queryClient.invalidateQueries({ queryKey: ["discountRules"] });
    },
    onSettled: () => {
            dispatch(hideLoader());

    },
  });
}

export function useDeleteDiscountRule() {
  const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: (id: any) => {
      dispatch(showLoader());
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
      dispatch(hideLoader());
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (data: Partial<any>) => {
      dispatch(showLoader());
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
      dispatch(hideLoader());
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (data: { id: string; coupon: Partial<any> }) => {
      dispatch(showLoader());
      return updateCoupon(data.id, data.coupon);
    },
    onError: (error: any) => {
      console.error("Error updating Coupon:", error);
    },
    onSuccess: () => {
      //("Coupon updated successfully");
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
    const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: (id: string) => {
      dispatch(showLoader());
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
      dispatch(hideLoader());
    },
  });
}
