import { useState, useEffect, useCallback } from 'react';
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
import { useTime } from '@/context/time';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

// --- Discounts Queries ---

export const useDiscounts = (params?: DiscountQueryParams | null) => {
  const { time } = useTime();
  const [data, setData] = useState<
    { next: string | null; results: Discount[]; count: number } | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!data) {
        setIsLoading(true);
      } else {
        setIsPending(true);
      }
      setError(null);

      try {
        const searchParams = new URLSearchParams();
        Object.entries(params ?? {}).forEach(([key, value]) => {
          if (value) {
            searchParams.append(key, String(value));
          }
        });
        const response = await fetchDiscounts(searchParams.toString());
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsPending(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [params, time]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

export const useGetDiscountById = (id: string) => {
  const { time } = useTime();
  const [data, setData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const fetchData = async () => {
      if (!data) {
        setIsLoading(true);
      } else {
        setIsPending(true);
      }
      setError(null);

      try {
        const response = await fetchDiscount(id);
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsPending(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, time]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

// --- Discount Rules Queries ---

export const useDiscountRules = (page?: number, noPage?: boolean) => {
  const { time } = useTime();
  const [data, setData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!data) {
        setIsLoading(true);
      } else {
        setIsPending(true);
      }
      setError(null);

      try {
        const response = await fetchDiscountRules(page, noPage);
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsPending(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [page, noPage, time]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

export const useGetDiscountRuleById = (id: string) => {
  const { time } = useTime();
  const [data, setData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const fetchData = async () => {
      if (!data) {
        setIsLoading(true);
      } else {
        setIsPending(true);
      }
      setError(null);

      try {
        const response = await fetchDiscountRule(id);
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsPending(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, time]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

// --- Coupons Queries ---

export const useGetCoupons = (param?: DiscountQueryParams | null) => {
  const { time } = useTime();
  const [data, setData] = useState<
    { next: string | null; results: Coupon[]; count: number } | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!data) {
        setIsLoading(true);
      } else {
        setIsPending(true);
      }
      setError(null);

      try {
        const searchParams = new URLSearchParams();
        Object.entries(param ?? {}).forEach(([key, value]) => {
          if (value) {
            searchParams.append(key, String(value));
          }
        });
        const response = await fetchCoupons(searchParams.toString());
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsPending(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [param, time]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

export const useGetCoupon = (id: string) => {
  const { time } = useTime();
  const [data, setData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const fetchData = async () => {
      if (!data) {
        setIsLoading(true);
      } else {
        setIsPending(true);
      }
      setError(null);

      try {
        const response = await fetchCoupon(id);
        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsPending(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, time]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

// --- Discounts Mutations ---

export function useCreateDiscount() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: Partial<any>) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader());
      try {
        const result = await createDiscount(variables);
        setData(result);
        manualInvalidate(setTime);
        return result;
      } catch (err) {
        setError(err);
        console.error('Error creating discount:', err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader());
      }
    },
    [setTime, dispatch]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
}

export function useUpdateDiscount() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: any) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader());
      try {
        const result = await updateDiscount(variables);
        setData(result);
        manualInvalidate(setTime);
        return result;
      } catch (err) {
        setError(err);
        console.error('Error updating discount:', err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader());
      }
    },
    [setTime, dispatch]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
}

export function useDeleteDiscount() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (id: string) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader());
      try {
        const result = await deleteDiscount(id);
        setData(result);
        manualInvalidate(setTime);
        return result;
      } catch (err) {
        setError(err);
        console.error('Error deleting discount:', err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader());
      }
    },
    [setTime, dispatch]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
}

// --- Discount Rules Mutations ---

export function useCreateDiscountRule(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: Partial<any>) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader());
      try {
        const result = await createDiscountRule(variables);
        setData(result);
        manualInvalidate(setTime);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        setError(err);
        if (onError) onError(err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader());
      }
    },
    [onSuccess, onError, setTime, dispatch]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
}

export function useUpdateDiscountRule() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: any) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader());
      try {
        const result = await updateDiscountRule(variables);
        setData(result);
        manualInvalidate(setTime);
        return result;
      } catch (err) {
        setError(err);
        console.error('Error updating discountRule:', err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader());
      }
    },
    [setTime, dispatch]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
}

export function useDeleteDiscountRule() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (id: any) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader());
      try {
        const result = await deleteDiscountRule(id);
        setData(result);
        manualInvalidate(setTime);
        return result;
      } catch (err) {
        setError(err);
        console.error('Error deleting discountRule:', err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader());
      }
    },
    [setTime, dispatch]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
}

// --- Coupons Mutations ---

export function useCreateCoupon() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: Partial<any>) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader());
      try {
        const result = await createCoupon(variables);
        setData(result);
        manualInvalidate(setTime);
        return result;
      } catch (err) {
        setError(err);
        console.error('Error creating discount:', err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader());
      }
    },
    [setTime, dispatch]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
}

export function useUpdateCoupon() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: { id: string; coupon: Partial<any> }) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader());
      try {
        const result = await updateCoupon(variables.id, variables.coupon);
        setData(result);
        manualInvalidate(setTime);
        return result;
      } catch (err) {
        setError(err);
        console.error('Error updating Coupon:', err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader());
      }
    },
    [setTime, dispatch]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
}

export function useDeleteCoupon() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (id: string) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader());
      try {
        const result = await deleteCoupon(id);
        setData(result);
        manualInvalidate(setTime);
        return result;
      } catch (err) {
        setError(err);
        console.error('Error deleting Coupon:', err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader());
      }
    },
    [setTime, dispatch]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
}

export function useCheckDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<any>) => {
      return createCheckDiscount(data);
    },
    onError: (error: any) => {
      console.error('Error checking discount:', error);
    },
    onSuccess: () => {
      ('Discount created successfully');
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['discounts'] });
      }
    },
  });
}
