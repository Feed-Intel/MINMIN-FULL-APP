import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type OrderState = {
  unreadOrders: number;
};

const initialState: OrderState = {
  unreadOrders: 0,
};

export const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setUnreadOrders: (state) => {
      state.unreadOrders += 1;
    },
    resetPendingOrders: (state) => {
      state.unreadOrders = 0;
    },
  },
});

export const { setUnreadOrders, resetPendingOrders } = orderSlice.actions;

export default orderSlice.reducer;
