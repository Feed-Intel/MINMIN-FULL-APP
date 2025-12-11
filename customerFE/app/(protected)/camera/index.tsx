import { CameraView } from 'expo-camera';
import { RelativePathString, router, useNavigation } from 'expo-router'; // Added useNavigation
import { AppState, Platform, StatusBar, StyleSheet } from 'react-native';
import { Overlay } from '@/components/QrCode/Overlay';
import { useEffect, useRef } from 'react';
import { useGetTenants } from '@/services/mutation/tenantMutation';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { useIsFocused } from '@react-navigation/native'; // Added useIsFocused
import { useCameraPermissions } from 'expo-camera'; // Added useCameraPermissions

import { i18n } from '@/app/_layout';

export default function HomeScreen() {
  // Renamed to HomeScreen for consistency with file name
  const [permission, requestPermission] = useCameraPermissions(); // Added permission state
  const isPermissionGranted = Boolean(permission?.granted); // Check if permission is granted
  const { setUser } = useAuth();
  const navigation = useNavigation(); // Get navigation object
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);
  const { data: restaurants } = useGetTenants();
  const isFocused = useIsFocused(); // Track screen focus state
  const cameraRef = useRef(null); // Ref for camera instance

  // Dynamic header handling
  useEffect(() => {
    navigation.setOptions({ headerShown: !isPermissionGranted });
  }, [isPermissionGranted, navigation]); // Added navigation to dependency array

  // Request camera permission on component mount
  useEffect(() => {
    const requestCameraAccess = async () => {
      const { granted } = await requestPermission();
      if (!granted) {
        Toast.show({
          type: 'info',
          text1: i18n.t('permission_required_toast_title'), // Replaced hardcoded string
          text2: i18n.t('enable_camera_access_toast_message'), // Replaced hardcoded string
        });
      }
    };
    requestCameraAccess();
  }, [requestPermission]); // Added requestPermission to dependency array

  // Clean up camera when component unmounts
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        // cameraRef.current.pausePreview(); // This method might not exist on CameraView directly
      }
    };
  }, []);

  // App state listener for QR lock
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        qrLock.current = false;
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  // QR Code handling
  const handleQRCodeScanned = async ({ data }: { data: string }) => {
    if (!data || qrLock.current) return;
    qrLock.current = true;

    try {
      const url = new URL(data);
      const params = new URLSearchParams(url.search);
      if (
        !params.has('tenant') ||
        !params.has('branch') ||
        !params.has('table')
      ) {
        throw new Error(i18n.t('missing_qr_parameters_error')); // Replaced hardcoded string
      }
      setUser({
        tenant: params.get('tenant') ?? '',
        branch: params.get('branch') ?? '',
        table: params.get('table') ?? '',
      });
      const restaurant = restaurants?.find(
        (r: any) => r.id === params.get('tenant')
      );
      if (!restaurant) {
        throw new Error(i18n.t('restaurant_not_found_toast_title')); // Replaced hardcoded string
      }
      const branch = restaurant?.branches?.find(
        (b: any) => b.id === params.get('branch')
      );

      if (branch) {
        router.push({
          pathname: `/(protected)/restaurant/(branch))` as RelativePathString, // Fixed pathname type
          params: {
            restaurantId: restaurant?.id,
            branchId: JSON.stringify(branch),
            rating: restaurant?.average_rating || 0,
            tableId: params.get('table'),
          },
        });
      } else {
        Toast.show({
          type: 'error',
          text1: restaurant
            ? i18n.t('branch_not_found_toast_title')
            : i18n.t('restaurant_not_found_toast_title'), // Replaced hardcoded string
          text2: i18n.t('please_try_again_toast_message'), // Replaced hardcoded string
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: i18n.t('invalid_qr_code_toast_title'), // Replaced hardcoded string
        text2: i18n.t('scan_valid_qr_code_toast_message'), // Replaced hardcoded string
      });
    } finally {
      setTimeout(() => {
        qrLock.current = false;
      }, 500);
    }
  };

  if (!isPermissionGranted) {
    return null;
  }

  return (
    <SafeAreaView style={styles.fullScreen}>
      {(Platform.OS === 'android' || Platform.OS === 'ios') && (
        <StatusBar hidden />
      )}

      {/* Only render camera when screen is focused */}
      {isFocused && (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.fullScreen}
            facing="back"
            onBarcodeScanned={handleQRCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          <Overlay />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  card: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
  },
  qrExample: {
    width: 200,
    height: 200,
    marginBottom: 20,
    alignSelf: 'center',
  },
  button: {
    marginTop: 10,
  },
  fullScreen: {
    flex: 1,
  },
});
