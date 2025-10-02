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
    mutationFn: (id: string) => updateMarkNotificationAsRead(id),
    // Optimistic update for instant UI feedback
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["getNotifications"] });
      const snapshots = queryClient.getQueriesData<any>({
        queryKey: ["getNotifications"],
      });

      const previous = snapshots.map(([key, data]) => [key, data] as const);

      snapshots.forEach(([key, data]) => {
        if (!data) return;
        const wasUnread = data.results?.some(
          (n: any) => n.id === id && !n.is_read
        );
        queryClient.setQueryData(key, {
          ...data,
          results: data.results?.map((n: any) =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unread_count: Math.max(
            0,
            (data.unread_count || 0) - (wasUnread ? 1 : 0)
          ),
        });
      });

      return { previous };
    },
    onError: (error: any, _id, context) => {
      console.error("Error updating notification:", error);
      // Revert optimistic updates
      context?.previous?.forEach(([key, data]: any) =>
        queryClient.setQueryData(key, data)
      );
    },
    // Always refetch to stay consistent with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["getNotifications"] });
    },
  });
}
