import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GetNotifications,
  updateMarkNotificationAsRead,
} from "../api/notificationApi";

export const useGetNotifications = (nextPage?: string) =>
  useQuery<
    { results: any[]; next: string; count: number; unread_count: number },
    any
  >({
    queryKey: ["getNotifications", nextPage],
    queryFn: () => GetNotifications(nextPage),
    refetchInterval: 60000,
  });

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return updateMarkNotificationAsRead(id);
    },
    onError: (error: any) => {
      console.error("Error updating notification:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification"] });
    },
    onSettled: () => {},
  });
}
