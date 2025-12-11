import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query';
import {
  getLoyaltyConversionRate,
  getLoyaltySettings,
  updateLoyaltySettings,
} from '../api/loayltyApi';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';

const loyaltyKeys = {
  all: ['loyalty'] as const,
  settings: () => [...loyaltyKeys.all, 'settings'] as const,
  conversionRate: () => [...loyaltyKeys.all, 'conversionRate'] as const,
};

export const useGetLoyaltySettings = () => {
  const queryKey = loyaltyKeys.settings();
  const queryFn: QueryFunction<any, typeof queryKey> = () =>
    getLoyaltySettings();

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useGetLoyaltyConversionRate = () => {
  const queryKey = loyaltyKeys.conversionRate();
  const queryFn: QueryFunction<any, typeof queryKey> = () =>
    getLoyaltyConversionRate();

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useUpdateLoyaltySettings = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  const mutationFn: MutationFunction<any, any> = (variables) =>
    updateLoyaltySettings(variables);

  return useMutation({
    mutationFn,
    onMutate: () => {
      dispatch(showLoader());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: loyaltyKeys.settings() });
      queryClient.invalidateQueries({
        queryKey: loyaltyKeys.conversionRate(),
      });
      queryClient.setQueryData(loyaltyKeys.settings(), data);
    },
    onError: (error) => {
      // Error handling
      console.error('Error updating loyalty settings:', error);
    },
    onSettled: () => {
      dispatch(hideLoader());
    },
  });
};
