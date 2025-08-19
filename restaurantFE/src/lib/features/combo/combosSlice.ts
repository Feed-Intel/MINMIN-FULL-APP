import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Combo } from "@/types/comboTypes";

interface CombosState {
  combos: Combo[];
}

const initialState: CombosState = {
  combos: [],
};

const combosSlice = createSlice({
  name: "combos",
  initialState,
  reducers: {
    setCombos: (state, action: PayloadAction<Combo[]>) => {
      state.combos = action.payload;
    },
  },
});

export const { setCombos } = combosSlice.actions;
export default combosSlice.reducer;
