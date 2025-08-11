import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getLoyaltyConversionRate,
  getLoyaltySettings,
  updateLoyaltySettings,
} from "../api/loayltyApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/reduxStore/store";
import { hideLoader, showLoader } from "@/lib/reduxStore/loaderSlice";

export const useGetLoyaltySettings = () =>
  useQuery({
    queryKey: ["loyaltySettings"],
    queryFn: getLoyaltySettings,
    staleTime: 0,
  });

export const useGetLoyaltyConversionRate = () =>
  useQuery({
    queryKey: ["loyaltyConversionRate"],
    queryFn: getLoyaltyConversionRate,
    staleTime: 0,
  });

export const useUpdateLoyaltySettings = () => {
  const dispatch = useDispatch<AppDispatch>();

    return useMutation({
      mutationFn: updateLoyaltySettings,
      onMutate: () => dispatch(showLoader()),
      onError: () => dispatch(hideLoader()),
      onSettled: () => dispatch(hideLoader()),
    });
  };
