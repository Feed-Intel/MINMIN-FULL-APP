import { CameraView } from "expo-camera";
import { Stack, useRouter } from "expo-router";
import { AppState, Platform, StatusBar, StyleSheet } from "react-native";
import { Overlay } from "@/components/QrCode/Overlay";
import { useEffect, useRef } from "react";
import { useGetTenants } from "@/services/mutation/tenantMutation";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/auth";
import { i18n } from "@/app/_layout";

export default function Home() {
  const qrLock = useRef(false);
  const appState = useRef(AppState.currentState);
  const router = useRouter();
  const { setUser } = useAuth();
  const { data: restaurants } = useGetTenants();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        qrLock.current = false;
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleQRCodeScanned = async (data: any) => {
    if (data && !qrLock.current) {
      qrLock.current = true;

      // Parse the QR code result
      const url = new URL(data);
      const searchParams = new URLSearchParams(url.search);
      setUser({
        tenant: searchParams.get("tenant") ?? "",
        branch: searchParams.get("branch") ?? "",
        table: searchParams.get("table") ?? "",
      });
      const tenantId = searchParams.get("tenant");
      const branchId = searchParams.get("branch");

      // Find the restaurant and branch
      const restaurant = restaurants?.find((r: any) => r.id === tenantId);
      if (restaurant) {
        const branch = restaurant.branches?.find((b: any) => b.id === branchId);
        if (branch) {
          router.push({
            pathname: "/(protected)/feed",
          });
        } else {
          Toast.show({
            type: "error",
            text1: i18n.t("branch_not_found_toast_title"), // Replaced hardcoded string
            text2: i18n.t("please_try_again_toast_message"), // Replaced hardcoded string
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: i18n.t("restaurant_not_found_toast_title"), // Replaced hardcoded string
          text2: i18n.t("please_try_again_toast_message"), // Replaced hardcoded string
        });
      }

      // Reset the lock after navigation
      setTimeout(() => {
        qrLock.current = false;
      }, 500);
    }
  };

  return (
    <SafeAreaView style={StyleSheet.absoluteFillObject}>
      <Stack.Screen
        options={{
          title: i18n.t("scan_screen_title"), // Replaced hardcoded string
          headerShown: false,
        }}
      />
      {Platform.OS === "android" || Platform.OS === "ios" ? (
        <StatusBar hidden />
      ) : null}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={({ data }) => handleQRCodeScanned(data)}
      />
      <Overlay />
    </SafeAreaView>
  );
}
