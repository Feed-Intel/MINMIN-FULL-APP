import { useState, useEffect, useCallback } from 'react';
import { deleteQRCode, getQRCodes } from '../api/qrCodeApi';
import { QRCodeType } from '@/types/qrCodeType';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { useTime } from '@/context/time';

const manualInvalidate = (setTime: (time: number) => void) => {
  setTime(Date.now());
};

// --- QR Code Query ---

export const useGetQRCodes = () => {
  const { time } = useTime();
  const [data, setData] = useState<QRCodeType[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      // Show loading only on initial fetch, pending on subsequent fetches
      if (data === undefined) {
        setIsLoading(true);
      } else {
        setIsPending(true);
      }
      setError(null);

      try {
        const response = await getQRCodes();
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

// --- QR Code Mutation ---

export const useDeleteQRCode = () => {
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
        const result = await deleteQRCode(id);
        setData(result);
        manualInvalidate(setTime); // onSuccess invalidates 'qrCodes'
        // Note: Original hook also invalidated 'tables' on success/settled.
        // We manually invalidate 'qrCodes' and rely on other 'tables' hooks
        // to update based on the global 'time' change.
        return result;
      } catch (err) {
        setError(err);
        console.error('Error creating table:', err); // onError equivalent
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
