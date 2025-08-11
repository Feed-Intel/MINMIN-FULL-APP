import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type EventState = {
  action: string;
  data: any;
};

const initialState: EventState = {
  action: "",
  data: null,
};

export const eventSlice = createSlice({
  name: "event",
  initialState,
  reducers: {
    setEvent: (state, action: PayloadAction<EventState>) => {
      state.action = action.payload.action;
      state.data = action.payload.data;
    },
    resetEventSlice: (state) => {
      const resetState = {
        ...initialState,
      };
      Object.assign(state, resetState);
    },
  },
});

export const { setEvent, resetEventSlice } = eventSlice.actions;

export default eventSlice.reducer;
