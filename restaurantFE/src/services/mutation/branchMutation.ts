import { useState, useEffect, useCallback } from 'react';
import {
  CreateBranch,
  DeleteBranch,
  GetBranch,
  GetBranches,
  UpdateBranch,
} from '../api/branchApi';
import { Branch } from '@/types/branchType';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useTime } from '@/context/time';

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

export const useGetBranches = (params?: any, noPage?: boolean) => {
  const { time } = useTime();
  const [data, setData] = useState<
    { next: string | null; results: Branch[]; count: number } | undefined
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
        const response = await GetBranches(searchParams.toString(), noPage);
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
  }, [params, time, noPage]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

export const useGetBranch = (id: string) => {
  const { time } = useTime();
  const [data, setData] = useState<Branch | undefined>(undefined);
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
        const response = await GetBranch(id);
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

export const useCreateBranch = (
  onSuccess?: (data?: any) => void,
  onError?: (error?: any) => void
) => {
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
        const result = await CreateBranch(variables);
        setData(result);
        manualInvalidate(setTime);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        setError(err);
        dispatch(hideLoader());
        if (onError) onError(err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader()); // onSettled equivalent
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
};

export const useUpdateBranch = (
  onSuccess?: (data?: any) => void,
  onError?: (error?: any) => void
) => {
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
        const result = await UpdateBranch(variables);
        setData(result);
        manualInvalidate(setTime);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        setError(err);
        dispatch(hideLoader());
        if (onError) onError(err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader()); // onSettled equivalent
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
};

export const useDeleteBranch = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
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
        const result = await DeleteBranch(variables);
        setData(result);
        manualInvalidate(setTime);
        if (onSuccess) onSuccess(result);
        return result;
      } catch (err) {
        setError(err);
        dispatch(hideLoader());
        if (onError) onError(err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader()); // onSettled equivalent
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
};
