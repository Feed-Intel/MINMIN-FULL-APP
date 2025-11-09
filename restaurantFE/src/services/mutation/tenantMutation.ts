import { useState, useEffect, useCallback } from 'react';
import {
  GetDashboardData,
  GetTenantProfile,
  GetTopMenuItems,
  UpdateTenantProfile,
  UpdateTenantProfileImage,
} from '../api/tenantApi';
import { useTime } from '@/context/time';

type DashboardParams = {
  period?: 'today' | 'month' | 'year' | 'custom';
  start_date?: string;
  end_date?: string;
  branch_id?: string;
};

type TopMenuItemsParams = {
  start_date?: string;
  end_date?: string;
  branch_id?: string;
};

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

export const useDashboardData = (params?: DashboardParams) => {
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
        const response = await GetDashboardData(params);
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
  }, [params, time]); // Dependency on 'params' and 'time'

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

export const useTopMenuItems = (params?: TopMenuItemsParams) => {
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
        const response = await GetTopMenuItems(params);
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
  }, [params]); // Dependency on 'params' only (no 'time' in original queryKey)

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

// --- Tenant Profile Queries ---

export const useGetTenantProfile = (id?: string) => {
  const { time } = useTime();
  const [data, setData] = useState<any>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  // 'enabled: Boolean(id)' equivalent
  const isEnabled = Boolean(id);

  useEffect(() => {
    if (!isEnabled) {
      setData(undefined);
      return;
    }

    let isMounted = true;
    const fetchData = async () => {
      if (!data) {
        setIsLoading(true);
      } else {
        setIsPending(true);
      }
      setError(null);

      try {
        // Use non-null assertion 'id!' because we check 'isEnabled'
        const response = await GetTenantProfile(id!);
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
  }, [id, time, isEnabled]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

// --- Tenant Profile Mutations ---

export const useUpdateTenantProfile = () => {
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
        const result = await UpdateTenantProfile(variables);
        setData(result);
        manualInvalidate(setTime); // onSuccess invalidates 'tenantProfile'
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

export const useUpdateTenantProfileImage = () => {
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: FormData) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      try {
        const result = await UpdateTenantProfileImage(variables);
        setData(result);
        manualInvalidate(setTime); // onSuccess invalidates 'tenantProfile'
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
