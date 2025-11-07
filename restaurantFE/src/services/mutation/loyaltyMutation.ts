import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getLoyaltyConversionRate,
  getLoyaltySettings,
  updateLoyaltySettings,
} from '../api/loayltyApi';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useTime } from '@/context/time';

export const useGetLoyaltySettings = () => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['loyaltySettings', time],
    queryFn: getLoyaltySettings,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useGetLoyaltyConversionRate = () => {
  const { time } = useTime();
  return useQuery({
    queryKey: ['loyaltyConversionRate', time],
    queryFn: getLoyaltyConversionRate,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });
};

export const useUpdateLoyaltySettings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const { setTime } = useTime();
  return useMutation({
    mutationFn: updateLoyaltySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyaltySettings'] });
      queryClient.refetchQueries({
        queryKey: ['loyaltySettings'],
        type: 'active',
      });
      queryClient.invalidateQueries({ queryKey: ['loyaltyConversionRate'] });
      queryClient.refetchQueries({
        queryKey: ['loyaltyConversionRate'],
        type: 'active',
      });
      setTime(Date.now());
    },
    onMutate: () => dispatch(showLoader()),
    onError: () => dispatch(hideLoader()),
    onSettled: () => dispatch(hideLoader()),
  });
};
