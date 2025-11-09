import { useState, useEffect, useCallback } from 'react';
import {
  getLoyaltyConversionRate,
  getLoyaltySettings,
  updateLoyaltySettings,
} from '../api/loayltyApi';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useTime } from '@/context/time';

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

// --- Loyalty Queries ---

export const useGetLoyaltySettings = () => {
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
        const response = await getLoyaltySettings();
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
  }, [time]); // Dependency on 'time' for manual invalidation/refetch

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

export const useGetLoyaltyConversionRate = () => {
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
        const response = await getLoyaltyConversionRate();
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

    const intervalId = setInterval(() => {
      fetchData();
    }, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [time]); // Dependency on 'time' for manual invalidation/refetch

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

// --- Loyalty Mutations ---

export const useUpdateLoyaltySettings = () => {
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
      dispatch(showLoader()); // onMutate equivalent

      try {
        const result = await updateLoyaltySettings(variables);
        setData(result);
        manualInvalidate(setTime); // onSuccess equivalent (invalidates both settings and rate)
        return result;
      } catch (err) {
        setError(err);
        dispatch(hideLoader()); // onError equivalent
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader()); // onSettled equivalent
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
};
