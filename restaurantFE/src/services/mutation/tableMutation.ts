import { useState, useEffect, useCallback } from 'react';
import {
  fetchTables,
  createTable,
  updateTable,
  deleteTable,
  createQR,
  fetchQRs,
  updateQr,
  fetchTableById,
} from '../api/tableApi';
import { Table, TableQueryParams } from '@/types/tableTypes';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useTime } from '@/context/time';

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

// --- QR Queries ---

export const useQRs = () => {
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
        const response = await fetchQRs();
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

// --- Table Queries ---

export const useGetTables = (
  param?: TableQueryParams | null,
  noPage?: boolean
) => {
  const { time } = useTime();
  const [data, setData] = useState<
    { next: string | null; results: Table[]; count: number } | undefined
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
        const response = await fetchTables(searchParams.toString(), noPage);
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

export const useGetTableById = (id: string) => {
  const { time } = useTime();
  const [data, setData] = useState<Table | undefined>(undefined);
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
        const response = await fetchTableById(id);
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

// --- QR Mutations ---

export function useCreateQR() {
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
        const result = await createQR(variables);
        setData(result);
        manualInvalidate(setTime); // onSuccess logic
        return result;
      } catch (err) {
        setError(err);
        console.error('Error creating QR:', err); // onError logic
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

export function useUpdateQr() {
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: { id: string; qr: Partial<any> }) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      try {
        const result = await updateQr(variables.id, variables.qr);
        setData(result);
        manualInvalidate(setTime); // onSuccess logic
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
}

// --- Table Mutations ---

export function useCreateTable() {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: Partial<Table>) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader());
      try {
        const result = await createTable(variables);
        setData(result);
        manualInvalidate(setTime); // onSuccess logic
        return result;
      } catch (err) {
        setError(err);
        console.error('Error creating table:', err); // onError logic
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

export function useUpdateTable() {
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
      // Note: Original hook had no onMutate/showLoader, but onSettled had hideLoader. Added showLoader for symmetry/completeness.
      dispatch(showLoader());
      try {
        const result = await updateTable(variables);
        setData(result);
        manualInvalidate(setTime); // onSuccess logic
        return result;
      } catch (err) {
        setError(err);
        console.error('Error creating table:', err); // onError logic
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

export function useDeleteTable() {
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
        const result = await deleteTable(id);
        setData(result);
        manualInvalidate(setTime); // onSuccess logic
        return result;
      } catch (err) {
        setError(err);
        console.error('Error deleting table:', err); // onError logic
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
