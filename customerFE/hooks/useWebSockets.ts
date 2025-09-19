import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/auth";

export const useWebSockets = () => {
  const { user } = useAuth();
  // Failover WS scheme for localhost
  const envAddress = process.env.EXPO_PUBLIC_WS_URL;
  const address = envAddress
    ? envAddress.replace(/^wss:\/\/(localhost|127\.0\.0\.1)/i, "ws://$1")
    : undefined;
  const dispatch = useDispatch();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) return;

    const wsUrl = `${address}/${user.id}/`;
    wsRef.current = new WebSocket(wsUrl);

    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const { type, message } = data;

        // // Check user permissions
        // if (["restaurant", "admin"].includes(restaurant.user_type ?? "")) {
        // Show toast notification
        Toast.show({
          type: "info",
          text1: type || "Notification",
          text2: message || "No additional data",
        });

        // Dispatch the event if needed
        //   dispatch(setEvent({ action, data: payload }));
        // }
      } catch (error) {
        console.error("WebSocket message parsing failed:", error);
      }
    };

    wsRef.current.onmessage = handleWebSocketMessage;

    // Clean up WebSocket on unmount
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [user, address, dispatch]);

  return null; // This hook doesn't render anything
};
