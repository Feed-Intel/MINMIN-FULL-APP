import cartReducer from "./cartSlice";
import locationReducer from "./locationSlice";
import orderReducer from "./OrderSlice";
import localeReducer from "./localeSlice";
import { configureStore } from "@reduxjs/toolkit";

export const makeStore = () => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      location: locationReducer,
      pendingOrder: orderReducer,
      language: localeReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
