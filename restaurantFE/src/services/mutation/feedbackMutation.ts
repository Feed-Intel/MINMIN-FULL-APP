import { useState, useEffect, useCallback } from 'react';
import { CreateFeedback, GetFeedback } from '../api/feedback';
import { useTime } from '@/context/time';

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

// --- Queries ---

export const useGetFeedback = (page?: number | undefined) => {
  const { time } = useTime();
  const [data, setData] = useState<
    { next: string | null; results: any[]; count: number } | undefined
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
        const response = await GetFeedback(page);
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
  }, [page, time]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

// --- Mutations ---

export const useCreateFeedback = () => {
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: any) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      try {
        const result = await CreateFeedback(variables);
        setData(result);
        manualInvalidate(setTime); // Simulate invalidateQueries/refetchQueries
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsPending(false);
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
};
