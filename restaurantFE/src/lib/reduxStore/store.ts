import authReducer from "./authSlice";
import loaderReducer from "./loaderSlice";
import discountReducer from "../features/discount/discountSlice";
import tableReducer from "../features/table/tablesSlice";
import comboReducer from "../features/combo/combosSlice";
import orderReducer from "../features/order/ordersSlice";
import pedningOrderReducer from "./orderSlice";
import notificationReducer from "./notificationSlice";
import { configureStore } from "@reduxjs/toolkit";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      loader: loaderReducer,
      discount: discountReducer,
      table: tableReducer,
      combo: comboReducer,
      order: orderReducer,
      pendingOrder: pedningOrderReducer,
      notifications: notificationReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
