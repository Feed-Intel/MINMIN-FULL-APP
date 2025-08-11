import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient } from "@tanstack/react-query";
import ReduxStoreProvider from "@/lib/reduxStore/ReduxStoreProvider";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Provider as PaperProvider } from "react-native-paper";
import Loader from "@/components/dashboard/Loader";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

const queryClient = new QueryClient();

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/PlusJakartaSans.ttf"),
  });

  async function checkAuth() {
    const token = await AsyncStorage.getItem("refreshToken");
    if (!Boolean(token)) {
      router.replace("/(auth)");
    }
  }

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
    checkAuth();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <PaperProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <ReduxStoreProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(protected)"
                options={{ headerShown: false }}
              />
            </Stack>
            <StatusBar style="auto" />
            <Toast />
            <Loader />
          </ReduxStoreProvider>
        </PersistQueryClientProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}
