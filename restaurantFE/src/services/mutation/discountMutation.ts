import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from '../api/discountApi';
import { Coupon, Discount, DiscountQueryParams } from '@/types/discountTypes';
import { AppDispatch } from '@/lib/reduxStore/store';
import { useDispatch } from 'react-redux';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useTime } from '@/context/time';

export const useDiscounts = (params?: DiscountQueryParams | null) => {
  const { time } = useTime();
  return useQuery<{ next: string | null; results: Discount[]; count: number }>({
    queryKey: ['discounts', params, time],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(params ?? {}).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });
      return fetchDiscounts(searchParams.toString());
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};
export function useCreateDiscount() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      dispatch(showLoader());
      return createDiscount(data);
    },
    onError: (error: any) => {
      console.error('Error creating discount:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      queryClient.refetchQueries({
        queryKey: ['discounts'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['discounts'] });
        await queryClient.refetchQueries({
          queryKey: ['discounts'],
          type: 'active',
        });
      }
      dispatch(hideLoader());
    },
  });
}

export const useGetDiscountById = (id: string) => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['discount', id, time],
    queryFn: () => fetchDiscount(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export function useUpdateDiscount() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: updateDiscount,
    onMutate: () => dispatch(showLoader()),
    onError: (error: any) => {
      console.error('Error updating discount:', error);
    },
    onSuccess: () => {
      //("Discount updated successfully");
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      queryClient.refetchQueries({
        queryKey: ['discounts'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useDeleteDiscount() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (id: string) => {
      dispatch(showLoader());
      return deleteDiscount(id);
    },
    onError: (error: any) => {
      console.error('Error deleting discount:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      queryClient.refetchQueries({
        queryKey: ['discounts'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['discounts'] });
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
export const useDiscountRules = (page?: number, noPage?: boolean) => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['discountRules', time],
    queryFn: () => fetchDiscountRules(page, noPage),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetDiscountRuleById = (id: string) => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['discountRule', id, time],
    queryFn: () => fetchDiscountRule(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetCoupons = (param?: DiscountQueryParams | null) => {
  const { time } = useTime();
  return useQuery<{ next: string | null; results: Coupon[]; count: number }>({
    queryKey: ['coupons', param, time],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      Object.entries(param ?? {}).forEach(([key, value]) => {
        if (value) {
          searchParams.append(key, String(value));
        }
      });
      return fetchCoupons(searchParams.toString());
    },
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetCoupon = (id: string) => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['coupon', id, time],
    queryFn: () => fetchCoupon(id),
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};
export function useCreateDiscountRule(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      dispatch(showLoader());
      return createDiscountRule(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountRules'] });
      queryClient.refetchQueries({
        queryKey: ['discountRules'],
        type: 'active',
      });
      setTime(Date.now());
      if (onSuccess) onSuccess;
    },
    onError,
    onSettled: () => dispatch(hideLoader()),
  });
}

export function useUpdateDiscountRule() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: updateDiscountRule,
    onMutate: () => dispatch(showLoader()),
    onError: (error: any) => {
      console.error('Error updating discountRule:', error);
    },
    onSuccess: () => {
      //("DiscountRule updated successfully");
      queryClient.invalidateQueries({ queryKey: ['discountRules'] });
      queryClient.refetchQueries({
        queryKey: ['discountRules'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useDeleteDiscountRule() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (id: any) => {
      dispatch(showLoader());
      return deleteDiscountRule(id);
    },
    onError: (error: any) => {
      console.error('Error deleting discountRule:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountRules'] });
      queryClient.refetchQueries({
        queryKey: ['discountRules'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['discountRules'] });
      }
      dispatch(hideLoader());
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      dispatch(showLoader());
      return createCoupon(data);
    },
    onError: (error: any) => {
      console.error('Error creating discount:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.refetchQueries({
        queryKey: ['coupons'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['coupons'] });
      }
      dispatch(hideLoader());
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (data: { id: string; coupon: Partial<any> }) => {
      dispatch(showLoader());
      return updateCoupon(data.id, data.coupon);
    },
    onError: (error: any) => {
      console.error('Error updating Coupon:', error);
    },
    onSuccess: () => {
      //("Coupon updated successfully");
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.refetchQueries({
        queryKey: ['coupons'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: (id: string) => {
      dispatch(showLoader());
      return deleteCoupon(id);
    },
    onError: (error: any) => {
      console.error('Error deleting Coupon:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.refetchQueries({
        queryKey: ['coupons'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['coupon'] });
      }
      dispatch(hideLoader());
    },
  });
}
