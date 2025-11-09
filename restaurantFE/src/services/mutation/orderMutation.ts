import { useState, useEffect, useCallback } from 'react';
import {
  fetchOrders,
  updateOrder,
  deleteOrder,
  fetchTenant,
  fetchOrder,
  createOrder,
} from '../api/orderApi';
import { Order, OrderQueryParams } from '@/types/orderTypes';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useTime } from '@/context/time';

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

// --- Order Queries ---

export const useOrders = (params?: OrderQueryParams) => {
  const { time } = useTime();
  const [data, setData] = useState<
    { next: string | null; results: Order[]; count: number } | undefined
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
        const response = await fetchOrders(searchParams.toString());
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

export const useGetOrder = (id: string) => {
  const { time } = useTime();
  const [data, setData] = useState<Order | undefined>(undefined);
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
        const response = await fetchOrder(id);
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

// --- Tenant Query ---

export const useTenant = () => {
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
        const response = await fetchTenant();
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
  }, [time]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

// --- Order Mutations ---

export function useCreateOrder() {
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: Partial<any>) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      try {
        const result = await createOrder(variables);
        setData(result);
        manualInvalidate(setTime); // onSuccess/onSettled invalidate logic
        return result;
      } catch (err) {
        setError(err);
        console.error('Error creating Order:', err); // onError logic
        throw err;
      } finally {
        setIsPending(false); // onSettled logic
      }
    },
    [setTime]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
}

export function useUpdateOrder() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: { id: string; order: any }) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader()); // onMutate equivalent
      try {
        const result = await updateOrder(variables.id, variables.order);
        setData(result);
        manualInvalidate(setTime); // onSuccess invalidate logic
        return result;
      } catch (err) {
        setError(err);
        console.error('Error updating order:', err); // onError logic
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader()); // onSettled logic
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

export function useDeleteOrder() {
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
      dispatch(showLoader()); // onMutate equivalent
      try {
        const result = await deleteOrder(id);
        setData(result);
        manualInvalidate(setTime); // onSuccess/onSettled invalidate logic
        return result;
      } catch (err) {
        setError(err);
        console.error('Error deleting order:', err); // onError logic
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader()); // onSettled logic
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
