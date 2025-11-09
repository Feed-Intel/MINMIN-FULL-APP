import { useState, useEffect, useCallback } from 'react';
import {
  addPost,
  deletePost,
  getPost,
  getPosts,
  getPostStats,
  updatePost,
} from '../api/feedApi';
import { Post } from '@/types/postType';
import { useTime } from '@/context/time';

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

// --- Posts Queries ---

export const useGetPosts = (page?: number | null | undefined) => {
  const { time } = useTime();
  const [data, setData] = useState<
    { next: string | null; results: Post[]; count: number } | undefined
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
        const response = await getPosts(page);
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

export const useGetPostsStats = (id: string) => {
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
        const response = await getPostStats(id);
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

export const useGetPostById = (id: any) => {
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
        const response = await getPost(id);
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

// --- Posts Mutations ---

export const useAddPost = () => {
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
        const result = await addPost(variables);
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

export const useUpdatePost = (id: string) => {
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
        // Note: The original hook used updatePost.bind(null, id). We pass 'id' explicitly here.
        const result = await updatePost(id, variables);
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
    [id, setTime]
  );

  return {
    mutate,
    data,
    isPending,
    error,
  };
};

export const useDeletePost = () => {
  const { setTime } = useTime();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(undefined);

  const mutate = useCallback(
    async (id: string) => {
      setIsPending(true);
      setError(null);
      setData(undefined);
      try {
        const result = await deletePost(id);
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
