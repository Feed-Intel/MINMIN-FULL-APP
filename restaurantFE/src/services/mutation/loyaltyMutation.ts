import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getLoyaltyConversionRate,
  getLoyaltySettings,
  updateLoyaltySettings,
} from '../api/loayltyApi';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';

export const useGetLoyaltySettings = () =>
  useQuery({
    queryKey: ['loyaltySettings'],
    queryFn: getLoyaltySettings,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });

export const useGetLoyaltyConversionRate = () =>
  useQuery({
    queryKey: ['loyaltyConversionRate'],
    queryFn: getLoyaltyConversionRate,
    gcTime: 0,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000,
  });

export const useUpdateLoyaltySettings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
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
    },
    onMutate: () => dispatch(showLoader()),
    onError: () => dispatch(hideLoader()),
    onSettled: () => dispatch(hideLoader()),
  });
};
