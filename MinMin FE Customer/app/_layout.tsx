import { AuthProvider } from "@/context/auth";
import ReduxStoreProvider from "@/lib/reduxStore/ReduxStoreProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Slot, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import { Platform } from "react-native";
import NoInternet from "@/components/ui/NoInternet";
import useNetworkStatus from "@/hooks/useNetworkStatus";
import {
  MD3LightTheme as DefaultTheme,
  PaperProvider,
  configureFonts,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import en from "@/locales/en.json";
import am from "@/locales/am.json";
import { I18n } from "i18n-js";

export const i18n = new I18n({ en, am });
i18n.enableFallback = true;

SplashScreen.preventAutoHideAsync();

const { fonts: defaultFonts } = DefaultTheme;

const fontConfig = Object.fromEntries(
  Object.entries(defaultFonts).map(([variantName, variantProperties]) => [
    variantName,
    {
      ...variantProperties, // Keep existing properties like fontSize, lineHeight, letterSpacing
      fontFamily: "Outfit",
      fontWeight: "600",
    },
  ])
);

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#96B76E", // Customize primary color
    secondary: "#03dac6", // Customize secondary color
    background: "#f5f5f5", // Customize background color
    surface: "#ffffff",
    text: "#000000",
  },
  // 3. Apply the modified font configuration
  fonts: configureFonts({ config: fontConfig }),
};

export default function RootLayout() {
  const [loaded] = useFonts({
    Outfit: require("../assets/fonts/Outfit.ttf"), // Load your Outfit font
  });
  const isConnected = useNetworkStatus();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
    async function loadAndSetLanguage() {
      try {
        let storedLanguage = null;
        if (Platform.OS === "web") {
          storedLanguage = (await AsyncStorage.getItem("language")) || "en";
        } else {
          storedLanguage = (await SecureStore.getItemAsync("language")) || "en";
        }
        i18n.locale = storedLanguage;
      } catch (error) {
        console.error("Failed to load language from storage:", error);
      }
    }
    loadAndSetLanguage();
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  if (!isConnected) {
    return <NoInternet onRetry={() => null} />;
  }
  return (
    <PaperProvider theme={theme}>
      <QueryClientProvider client={new QueryClient()}>
        <ReduxStoreProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Slot />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthProvider>
          <StatusBar style="auto" />
          <Toast />
        </ReduxStoreProvider>
      </QueryClientProvider>
    </PaperProvider>
  );
}
