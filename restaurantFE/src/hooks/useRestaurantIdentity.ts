import { useMemo } from "react";

import { useAppSelector } from "@/lib/reduxStore/hooks";

export const useRestaurantIdentity = () => {
  const restaurant = useAppSelector((state) => state.auth.restaurant);

  return useMemo(() => {
    const userType = restaurant?.user_type ?? "";
    const tenantId = restaurant?.id ?? null;
    const branchId = restaurant?.branch ?? null;

    return {
      restaurant,
      userType,
      tenantId,
      branchId,
      isRestaurant: userType === "restaurant",
      isBranch: userType === "branch",
    };
  }, [restaurant]);
};

