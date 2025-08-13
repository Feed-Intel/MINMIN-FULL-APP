import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";
import { useAppSelector } from "@/lib/reduxStore/hooks";
import { setUnreadOrders } from "@/lib/reduxStore/orderSlice";
import { addNotification } from "@/lib/reduxStore/notificationSlice";

export const useWebSockets = () => {
  const restaurant = useAppSelector((state) => state.auth.restaurant);
  const address = process.env.EXPO_PUBLIC_WS_URL;
  const dispatch = useDispatch();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!restaurant) return;
    let wsUrl = address?.startsWith("ws://")
      ? address.replace("ws://", "ws://")
      : address;
    wsUrl = `${wsUrl}${restaurant.id}/`;
    console.log(wsUrl);
    wsRef.current = new WebSocket(wsUrl);

    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data); // Parse JSON if the server sends it in JSON format
        const { type, branch, message, table_id } = data;
        if (restaurant.user_type === "branch" && branch !== restaurant.branch) {
          return;
        }
        dispatch(
          addNotification({
            type: data.type,
            message: data.message,
            metadata: {
              branch: data.branch,
              table_id: data.table_id,
            },
          })
        );
        if (
          type.toLowerCase().includes("order") &&
          type.toLowerCase().includes("created")
        ) {
          dispatch(setUnreadOrders());
          const sound = new Audio(require("../assets/sounds/notification.wav"));
          sound.play();
        } else if (type === "Waiter Call") {
          // Play a different sound for waiter calls
          const waiterSound = new Audio(
            require("../assets/sounds/waiterBell.mp3")
          );
          waiterSound.play();

          // Show custom toast for waiter calls
          Toast.show({
            type: "info", // or create a custom 'waiter' type
            text1: "Waiter Request",
            text2: message || `Table ${table_id} needs assistance`,
            position: "top",
            visibilityTime: 5000,
          });

          return; // Skip general notification for waiter calls
        }
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
  }, [restaurant, address, dispatch]);

  return null; // This hook doesn't render anything
};
