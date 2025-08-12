import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Notification = {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: any;
};

interface NotificationState {
  items: Notification[];
}

const initialState: NotificationState = {
  items: [],
};

export const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, "id" | "read" | "timestamp">>
    ) => {
      state.items.unshift({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      });
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((n) => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsRead: (state) => {
      state.items.forEach((n) => (n.read = true));
    },
    clearNotifications: (state) => {
      state.items = [];
    },
  },
});

export const {
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
