import React, { useEffect, useRef } from "react";
import { StyleSheet, Animated, Platform, Image, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button, TextInput } from "react-native-paper";
import { router } from "expo-router";
import { useResetPassword } from "@/services/mutation/authMutation";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/auth";
import { ThemedView } from "@/components/ThemedView";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { i18n } from "@/app/_layout";

const ForgotPasswordScreen = () => {
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const [email, setEmail] = React.useState("");
  const { setUser } = useAuth();
  const { mutate: ResetPasswordFn, isPending } = useResetPassword();

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

  const handlePasswordReset = () => {
    const data = { email };
    if (!email) {
      // Replaced alert() with Toast.show() and i18n.t()
      Toast.show({
        type: "error",
        text1: i18n.t("error_toast_title"),
        text2: i18n.t("please_enter_email_alert"),
      });
      return;
    }
    ResetPasswordFn(data, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: i18n.t("password_reset_success_toast"), // Replaced hardcoded string
        });
        setUser({ email: email, isPasswordReset: true });
        router.push("/(auth)/confirmOTP");
      },
    });
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
          <Text style={styles.title}>
            {i18n.t("forgot_password_title")} {/* Replaced hardcoded string */}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitleText}>
            {i18n.t("forgot_password_subtitle")}{" "}
            {/* Replaced hardcoded string */}
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address" // Changed keyboardType
            mode="outlined"
            style={styles.input}
            theme={{ colors: { primary: "#8BC34A", outline: "#ddd" } }} // Changed primary color to a greenish hue
            left={
              <TextInput.Icon
                icon={() => (
                  <MaterialCommunityIcons name="mail" size={24} color="gray" />
                )}
              />
            } // Added phone icon
          />

          <Button
            mode="contained"
            onPress={handlePasswordReset}
            loading={isPending}
            style={styles.button}
            contentStyle={styles.buttonContent}
            theme={{ colors: { primary: "#96B76E" } }}
          >
            {i18n.t("reset_password_button")} {/* Replaced hardcoded string */}
          </Button>
        </Animated.View>
        <View style={styles.bottomLinkContainer}>
          <Text style={styles.rememberPasswordText}>
            {i18n.t("remember_password_text")} {/* Replaced hardcoded string */}
          </Text>
          <Button
            mode="text"
            onPress={() => router.push("/(auth)")}
            style={styles.loginLinkButton}
          >
            <Text style={styles.loginLinkText}>
              {i18n.t("login_link")} {/* Replaced hardcoded string */}
            </Text>
          </Button>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 20, // Space below the title
  },
  subtitleText: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fff",
    ...Platform.select({
      web: {
        maxWidth: 320,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 24,
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
  linkButton: {
    marginVertical: 4,
    alignSelf: "center",
  },
  linkText: {
    color: "#666",
    fontSize: 14,
  },
  bottomLinkContainer: {
    flexDirection: "row",
    marginTop: 20,
    alignSelf: "center",
    alignItems: "center",
    position: "absolute", // Position absolutely
    bottom: 0, // Adjust as needed
  },
  rememberPasswordText: {
    color: "#000", // Black color for "Remember Password ?"
    fontSize: 14,
    marginRight: 5,
  },
  loginLinkButton: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  loginLinkText: {
    color: "#8BC34A", // Greenish color for "Login"
    fontSize: 14,
    fontWeight: "bold", // Make "Login" bold
  },
});

export default ForgotPasswordScreen;
