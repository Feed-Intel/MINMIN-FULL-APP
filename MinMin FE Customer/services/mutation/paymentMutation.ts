import { useMutation } from "@tanstack/react-query";
import { CreatePayment } from "@/services/api/paymentAPI";

export const useCreatePayment = () => {
  return useMutation({
    mutationKey: ["createPayment"],
    mutationFn: CreatePayment,
  });
};
