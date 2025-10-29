// src/lib/reduxStore/languageSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { i18n } from "@/app/_layout";

interface LanguageState {
  locale: string | null;
}

const initialState: LanguageState = {
  locale: null,
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.locale = action.payload;
      if (Platform.OS === "web") {
        AsyncStorage.setItem("language", action.payload);
      } else {
        SecureStore.setItemAsync("language", action.payload);
      }
      return state;
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;
