import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  CreateMenu,
  CreateRelatedItem,
  DeleteMenu,
  DeleteRelatedItem,
  GetMenu,
  GetMenuAvailabilities,
  GetMenus,
  GetRelatedItem,
  GetRelatedItems,
  UpdateMenu,
  UpdateMenuAvailability,
  UpdateRelatedItem,
} from '../api/menuApi';
import {
  MenuAvailability,
  MenuQueryParams,
  MenuType,
  RelatedMenu,
} from '@/types/menuType';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useTime } from '@/context/time';

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

// --- Menu Queries ---

export const useGetMenus = (params?: MenuQueryParams, noPage?: boolean) => {
  const { time } = useTime();
  const [data, setData] = useState<
    { next: string | null; results: MenuType[]; count: number } | undefined
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
        const response = await GetMenus(searchParams.toString(), noPage);
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
  }, [params, noPage, time]);

  return {
    data,
    isLoading,
    isPending: isPending && !!data,
    error,
  };
};

export const useGetMenu = (id: string) => {
  const { time } = useTime();
  const [data, setData] = useState<MenuType | undefined>(undefined);
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
        const response = await GetMenu(id);
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

export const useGetMenuAvailabilities = (param?: MenuQueryParams | null) => {
  const { time } = useTime();
  const [data, setData] = useState<
    | { next: string | null; results: MenuAvailability[]; count: number }
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
        const searchParams = new URLSearchParams();
        Object.entries(param ?? {}).forEach(([key, value]) => {
          if (value) {
            searchParams.append(key, String(value));
          }
        });
        const response = await GetMenuAvailabilities(searchParams.toString());
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

// --- Related Menus Queries ---

export const useGetRelatedMenus = (
  page?: number | undefined,
  noPage?: boolean
) => {
  const { time } = useTime();
  const [data, setData] = useState<RelatedMenu[] | undefined>(undefined);
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
        const response = await GetRelatedItems(page, noPage);
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

export const useGetRelatedMenuItem = (id: string) => {
  const { time } = useTime();
  const [data, setData] = useState<RelatedMenu | undefined>(undefined);
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
        const response = await GetRelatedItem(id);
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

// --- Menu Mutations ---

export const useCreateMenu = (
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
        const result = await CreateMenu(variables);
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
};

export const useUpdateMenu = (id: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (variables: FormData) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      dispatch(showLoader());
      try {
        const result = await UpdateMenu(id, variables);
        setData(result);
        manualInvalidate(setTime);
        return result;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setIsPending(false);
        dispatch(hideLoader());
      }
    },
    [id, setTime, dispatch]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
};

export const useDeleteMenu = () => {
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
        const result = await DeleteMenu(variables);
        setData(result);
        manualInvalidate(setTime);
        return result;
      } catch (err) {
        setError(err);
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
};

export const useUpdateMenuAvailability = (
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
        const result = await UpdateMenuAvailability(variables);
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
};

// --- Related Menu Mutations ---

export const useAddRelatedMenuItem = (
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
        const result = await CreateRelatedItem(variables);
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
};

export const useUpdateRelatedMenuItem = (
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
        const result = await UpdateRelatedItem(variables);
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
};

export const useDeleteRelatedMenu = () => {
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
        const result = await DeleteRelatedItem(variables);
        setData(result);
        manualInvalidate(setTime);
        return result;
      } catch (err) {
        setError(err);
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
};
