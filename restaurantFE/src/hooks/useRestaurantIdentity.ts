import { useMemo } from 'react';

import { useAppSelector } from '@/lib/reduxStore/hooks';
import type { RootState } from '@/lib/reduxStore/store';

const FALLBACK_IDENTITY = {
  restaurant: null,
  userType: '',
  tenantId: null as string | null,
  branchId: null as string | null,
  isRestaurant: false,
  isBranch: false,
};

export const useRestaurantIdentity = () => {
  let restaurant: RootState['auth']['restaurant'] | null = null;

  try {
    restaurant = useAppSelector((state) => state.auth.restaurant);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('could not find react-redux context value')
    ) {
      if (__DEV__) {
        console.warn(
          'useRestaurantIdentity: Redux store not available; using fallback identity.'
        );
      }
      restaurant = null;
    } else {
      throw error;
    }
  }

  return useMemo(() => {
    if (!restaurant) {
      return FALLBACK_IDENTITY;
    }

    const userType = restaurant.user_type ?? '';
    const tenantId = restaurant.id ?? null;
    const branchId = restaurant.branch ?? null;
    return {
      restaurant,
      userType,
      tenantId,
      branchId,
      isRestaurant: userType === 'restaurant',
      isBranch: userType === 'branch',
    };
  }, [restaurant]);
};
