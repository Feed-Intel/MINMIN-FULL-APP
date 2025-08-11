import { apiClient } from "@/config/axiosConfig";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Restaurant } from "@/types/restaurantType";

export type AuthState = {
  isLogged: boolean;
  isLoggedOut: boolean;
  isAuthFailed: boolean;
  OTP: string | null;
  restaurant: Restaurant | null;
};

const initialState: AuthState = {
  isLogged: false,
  isLoggedOut: false,
  isAuthFailed: false,
  OTP: null,
  restaurant: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setIsLogged: (state) => {
      const resetState = {
        ...initialState,
        isLogged: true,
        isLoggedOut: false,
        isAuthFailed: false,
      };
      Object.assign(state, resetState);
    },
    setOTP: (state, action: PayloadAction<AuthState["OTP"]>) => {
      state.OTP = action.payload;
    },
    setIsAuthFailed: (state, action: PayloadAction<boolean>) => {
      state.isAuthFailed = action.payload;
    },
    setIsLoggedOut: (state) => {
      apiClient.defaults.headers.common["Authorization"] = "";
      const resetState = {
        ...initialState,
        isLoggedOut: true,
      };
      Object.assign(state, resetState);
    },
    setRestaurant: (state, action: PayloadAction<AuthState["restaurant"]>) => {
      state.restaurant = action.payload;
    },
    resetAuthSlice: (state) => {
      apiClient.defaults.headers.common["Authorization"] = "";
      const resetState = {
        ...initialState,
      };
      Object.assign(state, resetState);
    },
    removeOTP: (state) => {
      state.OTP = null;
    },
  },
});

export const {
  setIsLogged,
  setIsAuthFailed,
  setOTP,
  resetAuthSlice,
  removeOTP,
  setRestaurant,
  setIsLoggedOut,
} = authSlice.actions;

export default authSlice.reducer;
