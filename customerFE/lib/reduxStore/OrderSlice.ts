import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = 0;

const orderSlice = createSlice({
  name: "pendingOrders",
  initialState,
  reducers: {
    updatePendingOrders(
      state,
      action: PayloadAction<{
        pendingOrders: number;
      }>
    ) {
      const { pendingOrders } = action.payload;
      state = pendingOrders;
      return state;
    },
  },
});

export const { updatePendingOrders } = orderSlice.actions;
export default orderSlice.reducer;
