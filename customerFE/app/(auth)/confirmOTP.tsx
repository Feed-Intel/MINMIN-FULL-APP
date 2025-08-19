import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Animated,
  Platform,
  Image,
  View, // Added View for Toast.show
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OtpInput } from "react-native-otp-entry";
import { Text, Button } from "react-native-paper";
import { router } from "expo-router";
import {
  useConfirmOTP,
  useResetPassword,
} from "@/services/mutation/authMutation";
import { tokenStorage } from "@/utils/cache";
import { jwtDecode } from "jwt-decode";
import { COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/utils/constants";
import { useAuth } from "@/context/auth";
import { ThemedView } from "@/components/ThemedView";
import Toast from "react-native-toast-message"; // Import Toast

import { i18n } from "@/app/_layout";

const ConfirmOTPScreen = () => {
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const [OTP, setOTPText] = React.useState("");
  const { user, setUser } = useAuth();
  const { mutate: checkOTPFn, isPending } = useConfirmOTP();
  const { mutate: ResetPasswordFn, isPending: resetPasswordIsPending } =
    useResetPassword();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(formAnimation, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoAnimation, formAnimation]);

  const handleOTPConfirm = () => {
    const data = { email: user?.email, otp: OTP };
    if (!OTP) {
      // Replaced alert() with Toast.show() and i18n.t()
      Toast.show({
        type: "error",
        text1: i18n.t("error_toast_title"),
        text2: i18n.t("please_enter_otp_alert"),
      });
      return;
    }
    checkOTPFn(data, {
      onSuccess: async (data: any) => {
        await tokenStorage.setItem(COOKIE_NAME, data.access_token);
        await tokenStorage.setItem(REFRESH_COOKIE_NAME, data.refresh_token);
        const decoded = jwtDecode<{
          user_id: string;
          email: string;
        }>(data.access_token);
        setUser({ id: decoded.user_id, email: decoded.email });
        if (user?.isPasswordReset) {
          router.replace("/(auth)/resetPassword");
        } else {
          router.replace("/(protected)/feed");
        }
      },
    });
  };

  const sendOTPAgain = () => {
    ResetPasswordFn({ email: user?.email });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoAnimation,
              transform: [
                {
                  scale: logoAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Image source={require("@/assets/images/minmin-green.png")} />
        </Animated.View>

        <Animated.View
          style={[
            styles.formContainer,
            {
              opacity: formAnimation,
              transform: [
                {
                  translateY: formAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text variant="titleLarge" style={styles.titleText}>
            {i18n.t("otp_verification_title")} {/* Replaced hardcoded string */}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitleText}>
            {i18n.t("otp_subtitle")} {/* Replaced hardcoded string */}
          </Text>

          <OtpInput
            numberOfDigits={6}
            onTextChange={setOTPText}
            focusColor="#96B76E"
            type="numeric"
            theme={{
              containerStyle: styles.otpContainer,
              pinCodeContainerStyle: styles.pinCodeStyle,
              pinCodeTextStyle: styles.textStyle,
            }}
          />

          <Button
            mode="contained"
            onPress={handleOTPConfirm}
            loading={isPending}
            style={styles.button}
            contentStyle={styles.buttonContent}
            theme={{ colors: { primary: "#96B76E" } }}
          >
            {i18n.t("verify_otp_button")} {/* Replaced hardcoded string */}
          </Button>

          <Button
            mode="outlined"
            onPress={sendOTPAgain}
            loading={resetPasswordIsPending}
            style={styles.resendButton}
            theme={{ colors: { primary: "#96B76E" } }}
          >
            {i18n.t("send_otp_again_button")} {/* Replaced hardcoded string */}
          </Button>
        </Animated.View>
      </SafeAreaView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Platform.OS === "web" ? 20 : 16,
    paddingVertical: 20,
    backgroundColor: "#FDFDFC",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Platform.OS === "web" ? 40 : 30,
  },
  logoText: {
    fontSize: Platform.OS === "web" ? 48 : 36,
    fontWeight: "700",
    color: "#6200ee",
    letterSpacing: 1,
  },
  formContainer: {
    padding: Platform.OS === "web" ? 24 : 20,
    ...Platform.select({
      web: {
        maxWidth: 400,
        width: "100%",
        alignSelf: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      },
      default: {
        marginHorizontal: 8,
      },
    }),
  },
  titleText: {
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "700",
    color: "#333",
  },
  subtitleText: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  otpContainer: {
    marginBottom: 12,
    marginHorizontal: "auto",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: {
        maxWidth: 320,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  pinCodeStyle: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    minHeight: 48,
    minWidth: 48,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  textStyle: {
    color: "#333",
    fontSize: 16,
  },
  button: {
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 8,
    ...Platform.select({
      web: {
        maxWidth: 320,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  buttonContent: {
    paddingVertical: 8,
  },
  resendButton: {
    marginBottom: 16,
    borderRadius: 8,
    ...Platform.select({
      web: {
        maxWidth: 320,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
});

export default ConfirmOTPScreen;
