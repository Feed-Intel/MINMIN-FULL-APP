import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { setRestaurant } from "@/lib/reduxStore/authSlice";
import { Text, Button, TextInput } from "react-native-paper";
import { router } from "expo-router";
import { useDispatch } from "react-redux";
import { useResetPassword } from "@/services/mutation/authMutation";

const ForgotPasswordScreen = () => {
  const logoAnimation = React.useRef(new Animated.Value(0)).current;
  const [email, setEmail] = React.useState("");
  const dispatch = useDispatch();

  const onSuccessResetPassword = () => {
    dispatch(setRestaurant({ email: email }));
    router.push("/(auth)/confirmOTP");
  };

  const { mutate: ResetPasswordFn } = useResetPassword(onSuccessResetPassword);

  const handlePasswordReset = () => {
    const data = { email };
    ResetPasswordFn(data);
  };

  return (
    <View style={styles.container}>
      {/* Logo Animation */}
      <Animated.View
        style={{
          opacity: logoAnimation,
          transform: [
            {
              scale: logoAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
          ],
        }}
      >
        <Text style={styles.logoText}>Restaurant Logo</Text>
      </Animated.View>

      {/* Title and Subtitle */}
      <Text variant="headlineLarge" style={styles.titleText}>
        Forgot your Password
      </Text>
      <Text variant="bodyLarge" style={styles.subtitleText}>
        Please enter your email address and we will send you a password reset
        OTP
      </Text>

      {/* Input Fields */}
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        mode="outlined"
        style={styles.input}
      />

      {/* Reset Password Button */}
      <Button
        mode="contained"
        onPress={handlePasswordReset}
        style={styles.button}
      >
        Reset Password
      </Button>

      {/* Bottom Links */}
      <View style={styles.bottomLinks}>
        <Text variant="bodyMedium" style={styles.signInText}>
          Sign In
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
    //
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 32,
  },
  titleText: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    textAlign: "center",
    marginBottom: 16,
    color: "gray",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  bottomLinks: {
    alignItems: "center",
  },
  signInText: {
    fontWeight: "bold",
    color: "#6200ee",
  },
});

export default ForgotPasswordScreen;
