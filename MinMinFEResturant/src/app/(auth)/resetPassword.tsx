import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Text, Button, TextInput } from "react-native-paper";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/lib/reduxStore/hooks";
import { useUpdatePassword } from "@/services/mutation/authMutation";

const ResetPasswordScreen = () => {
  const logoAnimation = React.useRef(new Animated.Value(0)).current;
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const email = useAppSelector((state) => state.auth.restaurant?.email);
  const OTP = useAppSelector((state) => state.auth.OTP);
  const dispatch = useDispatch();

  const { mutate: ChangePasswordFn } = useUpdatePassword();

  const handleChangePassword = () => {
    const data = { email, otp: OTP, new_password: newPassword };
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    ChangePasswordFn(data);
  };

  return (
    <View style={styles.container}>
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

      <Text variant="headlineLarge" style={styles.titleText}>
        Reset your Password
      </Text>
      <Text variant="bodyLarge" style={styles.subtitleText}>
        Please enter a new password and confirm it
      </Text>

      <TextInput
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        mode="outlined"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleChangePassword}
        style={styles.button}
      >
        Change Password
      </Button>
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
    marginTop: 16,
  },
});

export default ResetPasswordScreen;
