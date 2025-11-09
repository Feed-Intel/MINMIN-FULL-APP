import { useState, useEffect, useCallback } from 'react';
import {
  GetCombos,
  GetComboById,
  CreateCombo,
  UpdateCombo,
  DeleteCombo,
} from '../api/comboApi';
import { Combo, ComboQueryParams } from '@/types/comboTypes';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useTime } from '@/context/time';

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

export const useGetCombos = (
  params?: ComboQueryParams | undefined,
  enabled: boolean = true
) => {
  const { time } = useTime();
  const [data, setData] = useState<
    { next: string | null; results: Combo[]; count: number } | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!enabled) return;

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
        const response = await GetCombos(searchParams.toString());
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
  }, [params, time, enabled]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

export const useGetComboById = (id: string) => {
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
        const response = await GetComboById(id);
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

// --- Mutations ---

export function useCreateCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
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
        const result = await CreateCombo(variables);
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

export function useUpdateCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
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
        const result = await UpdateCombo(variables);
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

export function useDeleteCombo(
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) {
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
        const result = await DeleteCombo(variables);
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
