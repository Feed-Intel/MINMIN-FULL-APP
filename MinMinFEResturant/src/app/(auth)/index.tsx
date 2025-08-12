import React, { useEffect } from "react";
import { Animated, StyleSheet } from "react-native";
import { Text, Button, Card, Paragraph, useTheme } from "react-native-paper";
import { TextInput } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { setRestaurant } from "@/lib/reduxStore/authSlice";
import { useLogin } from "@/services/mutation/authMutation";
import Toast from "react-native-toast-message";

const LoginScreen = () => {
  const logoAnimation = React.useRef(new Animated.Value(0)).current;
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const dispatch = useDispatch();
  const theme = useTheme();
  const { mutate: LoginFn, isPending } = useLogin();

  useEffect(() => {
    Animated.timing(logoAnimation, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [logoAnimation]);

  const onSuccess = async (data: any) => {
    const decoded = jwtDecode<{
      tenant: string;
      user_type: string;
      email: string;
      branch?: string;
    }>(data.access_token);
    console.log(decoded);
    if (!Boolean(decoded?.branch)) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          "Please Contact Administrator to assign a branch to your account.",
      });
      return;
    }
    await AsyncStorage.setItem("accessToken", data.access_token);
    await AsyncStorage.setItem("refreshToken", data.refresh_token);
    dispatch(
      setRestaurant({
        id: decoded.tenant,
        user_type: decoded.user_type,
        email: decoded.email,
        branch: decoded?.branch,
      })
    );
    router.replace("/(protected)/dashboard");
  };

  const handleLogin = () => {
    if (!email || !password) {
      alert("Please fill in both fields!");
      return;
    }
    LoginFn({ email, password }, { onSuccess });
  };

  return (
    <Animated.View style={[styles.container, { opacity: logoAnimation }]}>
      {/* Logo Animation */}
      <Animated.Image
        source={{
          uri: "https://example.com/restaurant-logo.png", // Replace with your logo URL
        }}
        style={[
          styles.logo,
          {
            transform: [
              {
                scale: logoAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          },
        ]}
        resizeMode="contain"
      />

      {/* Title Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text
            variant="headlineLarge"
            style={[styles.title, { color: "#3A3A3A" }]}
          >
            Welcome to Alpha Restaurant
          </Text>
          <Paragraph style={styles.subtitle}>
            Log in to manage your restaurant account
          </Paragraph>

          {/* Input Fields */}
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isPending}
            style={styles.button}
            labelStyle={{ color: "#fff" }}
          >
            {isPending ? "Logging in..." : "Log in"}
          </Button>

          {/* Forgot Password */}
          <Button
            mode="text"
            onPress={() => router.push("/(auth)/forgotPassword")}
            style={styles.forgotPassword}
            labelStyle={{ color: "#3A3A3A" }}
          >
            Forgot Password?
          </Button>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    paddingTop: 0,
    backgroundColor: "#EFF4EB", // Light theme background
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  card: {
    width: "100%",
    maxWidth: 500,
    padding: 16,
    borderRadius: 8,
    elevation: 4,
    backgroundColor: "#fff",
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "600",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    color: "#6b6b6b", // Subtle subtitle color
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#91B27517",
    height: 50,
    padding: 8,
    borderRadius: 8,
  },
  button: {
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: "#91B275",
  },
  forgotPassword: {
    marginTop: 8,
  },
});

export default LoginScreen;
