import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
} from '@tanstack/react-query';
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
  createCheckDiscount,
} from '../api/discountApi';
import { Coupon, Discount, DiscountQueryParams } from '@/types/discountTypes';
import { AppDispatch } from '@/lib/reduxStore/store';
import { useDispatch } from 'react-redux';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';

interface PaginatedResponse<T> {
  next: string | null;
  results: T[];
  count: number;
}

export const discountKeys = {
  all: ['discounts'] as const,
  lists: () => [...discountKeys.all, 'list'] as const,
  list: (params: DiscountQueryParams | null | undefined) =>
    [...discountKeys.lists(), { params }] as const,
  details: () => [...discountKeys.all, 'detail'] as const,
  detail: (id: string) => [...discountKeys.details(), id] as const,
};

const discountRuleKeys = {
  all: ['discountRules'] as const,
  lists: () => [...discountRuleKeys.all, 'list'] as const,
  list: (page: number | undefined, noPage: boolean | undefined) =>
    [...discountRuleKeys.lists(), { page, noPage }] as const,
  details: () => [...discountRuleKeys.all, 'detail'] as const,
  detail: (id: string) => [...discountRuleKeys.details(), id] as const,
};

const couponKeys = {
  all: ['coupons'] as const,
  lists: () => [...couponKeys.all, 'list'] as const,
  list: (params: DiscountQueryParams | null | undefined) =>
    [...couponKeys.lists(), { params }] as const,
  details: () => [...couponKeys.all, 'detail'] as const,
  detail: (id: string) => [...couponKeys.details(), id] as const,
};

// ------------------------------------
// ## Discount Hooks (Queries)
// ------------------------------------

export const useDiscounts = (params?: DiscountQueryParams | null) => {
  const queryKey = discountKeys.list(params);

  const queryFn: QueryFunction<
    PaginatedResponse<Discount>,
    typeof queryKey
  > = ({ queryKey: [, , { params: currentParams }] }) => {
    const searchParams = new URLSearchParams();
    Object.entries(currentParams ?? {}).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, String(value));
      }
    });
    return fetchDiscounts(searchParams.toString());
  };

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useGetDiscountById = (id: string) => {
  const queryKey = discountKeys.detail(id);
  const queryFn: QueryFunction<Discount, typeof queryKey> = ({
    queryKey: [, , discountId],
  }) => fetchDiscount(discountId);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
  });
};

// ------------------------------------
// ## Discount Rule Hooks (Queries)
// ------------------------------------

export const useDiscountRules = (page?: number, noPage?: boolean) => {
  const queryKey = discountRuleKeys.list(page, noPage);

  const queryFn: QueryFunction<any, typeof queryKey> = ({
    queryKey: [, , { page: currentPage, noPage: currentNoPage }],
  }) => fetchDiscountRules(currentPage, currentNoPage);

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useGetDiscountRuleById = (id: string) => {
  const queryKey = discountRuleKeys.detail(id);
  const queryFn: QueryFunction<any, typeof queryKey> = ({
    queryKey: [, , ruleId],
  }) => fetchDiscountRule(ruleId);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
  });
};

// ------------------------------------
// ## Coupon Hooks (Queries)
// ------------------------------------

export const useGetCoupons = (param?: DiscountQueryParams | null) => {
  const queryKey = couponKeys.list(param);

  const queryFn: QueryFunction<PaginatedResponse<Coupon>, typeof queryKey> = ({
    queryKey: [, , { params: currentParams }],
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(currentParams ?? {}).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, String(value));
      }
    });
    return fetchCoupons(searchParams.toString());
  };

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useGetCoupon = (id: string) => {
  const queryKey = couponKeys.detail(id);
  const queryFn: QueryFunction<Coupon, typeof queryKey> = ({
    queryKey: [, , couponId],
  }) => fetchCoupon(couponId);

  return useQuery({
    queryKey,
    queryFn,
    enabled: !!id,
  });
};

// ------------------------------------
// ## Discount Hooks (Mutations)
// ------------------------------------

export function useCreateDiscount() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: Partial<any>) => createDiscount(variables),
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.lists() });
    },
    onError: (error) => {
      console.error('Error creating discount:', error);
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useUpdateDiscount() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: any) => updateDiscount(variables),
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: discountKeys.lists() });
      if (variables.id) {
        queryClient.setQueryData(discountKeys.detail(variables.id), data);
      }
    },
    onError: (error) => {
      console.error('Error updating discount:', error);
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
    mutationFn: (id: string) => deleteDiscount(id),
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.lists() });
    },
    onError: (error) => {
      console.error('Error deleting discount:', error);
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useCheckDiscount() {
  // This hook already used useMutation, but we'll clean up the onSettled logic
  return useMutation({
    mutationFn: (data: Partial<any>) => createCheckDiscount(data),
    onError: (error: any) => {
      console.error('Error checking discount:', error);
    },
    // Invalidating queries here is generally not necessary unless checking triggers a list change
    // If it *is* meant to trigger a list refresh, we'd use:
    // onSuccess: () => queryClient.invalidateQueries({ queryKey: discountKeys.lists() }),
  });
}

// ------------------------------------
// ## Discount Rule Hooks (Mutations)
// ------------------------------------

export function useCreateDiscountRule(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: Partial<any>) => createDiscountRule(variables),
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: discountRuleKeys.lists() });
      if (onSuccess) onSuccess(data);
    },
    onError: (error) => {
      if (onError) onError(error);
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useUpdateDiscountRule() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: any) => updateDiscountRule(variables),
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: discountRuleKeys.lists() });
      if (variables.id) {
        queryClient.setQueryData(discountRuleKeys.detail(variables.id), data);
      }
    },
    onError: (error) => {
      console.error('Error updating discountRule:', error);
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
    mutationFn: (id: string) => deleteDiscountRule(id),
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountRuleKeys.lists() });
    },
    onError: (error) => {
      console.error('Error deleting discountRule:', error);
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

// ------------------------------------
// ## Coupon Hooks (Mutations)
// ------------------------------------

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  return useMutation({
    mutationFn: (variables: Partial<any>) => createCoupon(variables),
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
    onError: (error) => {
      console.error('Error creating coupon:', error);
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  // Updated to match the existing API call structure: updateCoupon(id, coupon)
  return useMutation({
    mutationFn: (variables: { id: string; coupon: Partial<any> }) =>
      updateCoupon(variables.id, variables.coupon),
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
      queryClient.setQueryData(couponKeys.detail(variables.id), data);
    },
    onError: (error) => {
      console.error('Error updating Coupon:', error);
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
    mutationFn: (id: string) => deleteCoupon(id),
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
    onError: (error) => {
      console.error('Error deleting Coupon:', error);
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}
