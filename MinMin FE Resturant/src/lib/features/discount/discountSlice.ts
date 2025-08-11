import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Discount } from "@/types/discountTypes";

interface DiscountState {
  discounts: Discount[];
}

const initialState: DiscountState = {
  discounts: [],
};

const discountSlice = createSlice({
  name: "discount",
  initialState,
  reducers: {
    setDiscounts(state, action: PayloadAction<any[]>) {
      state.discounts = action.payload;
    },
  },
});

export const { setDiscounts } = discountSlice.actions;
export default discountSlice.reducer;
