import { useMutation, useQuery } from "@tanstack/react-query";
import { CreateFeedback, GetFeedback } from "../api/feedback";

export const useCreateFeedback = () =>
  useMutation({
    mutationKey: ["createFeedback"],
    mutationFn: CreateFeedback,
  });

export const useGetFeedback = (orderId: string) =>
  useQuery({
    queryKey: ["getFeedback", orderId],
    queryFn: () => GetFeedback(orderId),
  });
