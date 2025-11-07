import { ThemeProvider } from '@react-navigation/native';
import { QueryClient } from '@tanstack/react-query';
import ReduxStoreProvider from '@/lib/reduxStore/ReduxStoreProvider';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { LogBox, Platform, useColorScheme } from 'react-native';
import PlusJakartaSans from '../assets/fonts/PlusJakartaSans.ttf';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { MD3LightTheme, Provider as PaperProvider } from 'react-native-paper';
import Loader from '@/components/dashboard/Loader';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { navigationDarkTheme, navigationLightTheme } from '@/theme/minminTheme';
import en from '@/locales/en.json';
import am from '@/locales/am.json';
import { I18n } from 'i18n-js';

export const i18n = new I18n({ en, am });
i18n.enableFallback = true;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 0,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

LogBox.ignoreLogs(['Warning: findDOMNode is deprecated']);
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    PlusJakartaSans,
  });

  async function checkAuth() {
    const token = await AsyncStorage.getItem('refreshToken');
    if (!Boolean(token)) {
      router.replace('/(auth)');
    }
  }

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
    async function loadAndSetLanguage() {
      try {
        let storedLanguage = null;
        if (Platform.OS === 'web') {
          storedLanguage = (await AsyncStorage.getItem('language')) || 'am';
        } else {
          storedLanguage = (await SecureStore.getItemAsync('language')) || 'am';
        }
        i18n.locale = storedLanguage;
      } catch (error) {
        console.error('Failed to load language from storage:', error);
      }
    }
    loadAndSetLanguage();
    checkAuth();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const scheme = useColorScheme();
  const navigationTheme =
    scheme === 'dark' ? navigationDarkTheme : navigationLightTheme;
  const paperTheme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#91B275', // active border and accent
      secondary: '#91B27517',
      outline: '#B5B3E8', // input border
      background: '#EDEBFF', // dropdown background
      surface: '#FFFFFF',
      onPrimary: '#FFFFFF',
      onSurface: '#333333', // text color
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <PaperProvider theme={paperTheme}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister }}
        >
          <ReduxStoreProvider>
            <>
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
            </>
          </ReduxStoreProvider>
        </PersistQueryClientProvider>
      </PaperProvider>
    </ThemeProvider>
  );
}
