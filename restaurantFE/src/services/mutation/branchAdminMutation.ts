import { useState, useEffect, useCallback } from 'react';
import {
  GetBranchAdmins,
  CreateBranchAdmin,
  GetBranchAdmin,
  UpdateBranchAdmin,
  DeleteBranchAdmin,
} from '../api/branchAdminApi';
import { BranchAdmin } from '@/types/branchAdmin';
import { useTime } from '@/context/time';

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

export const useGetBranchAdmins = (page: number | undefined) => {
  const { time } = useTime();
  const [data, setData] = useState<
    | {
        next: string | null;
        results: BranchAdmin[];
        count: number;
      }
    | undefined
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
        const response = await GetBranchAdmins(page);
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

export const useGetBranchAdmin = (adminId: string) => {
  const { time } = useTime();
  const [data, setData] = useState<BranchAdmin | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!adminId) return;

    let isMounted = true;
    const fetchData = async () => {
      if (!data) {
        setIsLoading(true);
      } else {
        setIsPending(true);
      }
      setError(null);

      try {
        const response = await GetBranchAdmin(adminId);
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
  }, [adminId, time]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

export const useCreateBranchAdmin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
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
        const result = await CreateBranchAdmin(variables);
        setData(result);
        manualInvalidate(setTime);
        onSuccess?.(result);
        return result;
      } catch (err) {
        setError(err);
        onError?.(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [onSuccess, onError, setTime]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
};

export const useUpdateBranchAdmin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) => {
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
        const result = await UpdateBranchAdmin(variables);
        setData(result);
        manualInvalidate(setTime);
        onSuccess?.(result);
        return result;
      } catch (err) {
        setError(err);
        onError?.(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [onSuccess, onError, setTime]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
};

export const useDeleteBranchAdmin = () => {
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
        const result = await DeleteBranchAdmin(variables);
        setData(result);
        manualInvalidate(setTime);
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
