import React, { useEffect, useRef } from "react";
import {
  StyleSheet,
  Animated,
  Image,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput } from "react-native-paper";
import { router } from "expo-router";
import { useSignUp } from "@/services/mutation/authMutation";
import { Signup } from "@/types/authType";
import dayjs from "dayjs";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/auth";
import { useNetworkState } from "expo-network";
import SignInWithGoogleButton from "@/components/ui/SignInWithGoogleButton";
import SignInWithFacebookButton from "@/components/ui/SignInWithFacebookButton";
import { i18n } from "@/app/_layout";

const RegisterScreen = () => {
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const [user, setUserState] = React.useState<Signup>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    birthday: dayjs().format("YYYY-MM-DD"),
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const networkState = useNetworkState();
  const { signInWithGoogle, signInWithFacebook, isLoading } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const { setUser } = useAuth();

  const { mutate: RegisterFn, isPending } = useSignUp();

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

  const onSuccess = async (data: any) => {
    Toast.show({
      type: "success",
      text1: data.message,
    });
    setUser({ email: user.email, full_name: user.full_name });
    router.replace("/(auth)/confirmOTP");
  };

  const handleRegister = () => {
    if (!user.full_name || !user.email || !user.password || !user.phone) {
      // Replaced Alert.alert with Toast.show as per instructions
      Toast.show({
        type: "error",
        text1: i18n.t("error_toast_title"),
        text2: i18n.t("fill_all_fields_error"),
      });
      return;
    }
    setError(null);
    RegisterFn(user, { onSuccess });
  };

  return (
    <ScrollView style={styles.container}>
      <Image
        source={require("@/assets/images/background.png")}
        style={styles.backgroundImage}
      />
      <SafeAreaView style={styles.safeArea}>
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
          <Image source={require("@/assets/images/minmin-white.png")} />
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
          <Text style={styles.title}>{i18n.t("create_account_title")}</Text>

          <View style={styles.inputContainer}>
            <Image
              source={require("@/assets/images/Person.png")}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder={i18n.t("name_placeholder")}
              value={user.full_name}
              onChangeText={(fullName) =>
                setUserState({ ...user, full_name: fullName })
              }
              keyboardType="default"
              autoCapitalize="words"
              style={styles.textInput}
              placeholderTextColor="#555"
              mode="flat" // Use flat mode for no outline
              underlineColor="transparent" // Remove default underline
              activeUnderlineColor="transparent" // Remove active underline
              cursorColor="#EE8429"
            />
          </View>

          <View style={styles.inputContainer}>
            <Image
              source={require("@/assets/images/Mail-black.png")}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder={i18n.t("email_placeholder")}
              value={user.email}
              onChangeText={(email) => setUserState({ ...user, email })}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.textInput}
              placeholderTextColor="#555"
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              cursorColor="#EE8429"
            />
          </View>

          <View style={styles.inputContainer}>
            <Image
              source={require("@/assets/images/Phone.png")}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder={i18n.t("phone_number_placeholder")}
              value={user.phone}
              onChangeText={(phone) => setUserState({ ...user, phone })}
              keyboardType="phone-pad"
              autoCapitalize="none"
              style={styles.textInput}
              placeholderTextColor="#555"
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              cursorColor="#EE8429"
            />
          </View>

          <View style={styles.inputContainer}>
            <Image
              source={require("@/assets/images/Lock-black.png")}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder={i18n.t("password_placeholder")}
              value={user.password}
              onChangeText={(password) => setUserState({ ...user, password })}
              secureTextEntry={!showPassword}
              style={styles.textInput} // Applied textInput style for consistency
              placeholderTextColor="#555"
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              cursorColor="#EE8429"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Image
                source={require("@/assets/images/Eye-black.png")}
                style={styles.eyeIcon} // Specific style for eye icon
              />
            </Pressable>
          </View>

          <Pressable
            style={styles.signUpButton}
            onPress={handleRegister}
            disabled={!networkState.isInternetReachable || isPending}
          >
            <Text style={styles.signUpButtonText}>{i18n.t("signup_link")}</Text>
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{i18n.t("or_continue_with")}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            {/* Assuming SignInWithGoogleButton and SignInWithFacebookButton are custom components that handle their own internal rendering and icon/text */}
            <SignInWithGoogleButton
              onPress={signInWithGoogle}
              style={styles.googleButton}
              // textStyle={styles.googleButtonText}
            />
            <SignInWithFacebookButton
              onPress={signInWithFacebook}
              style={styles.facebookButton}
              // textStyle={styles.facebookButtonText}
            />
          </View>

          <Pressable
            style={styles.loginLinkContainer}
            onPress={() => router.push("/(auth)")}
          >
            <Text style={styles.linkText}>
              {i18n.t("already_have_account_prefix")}{" "}
              <Text style={styles.loginLinkText}>{i18n.t("login_link")}</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F28C28",
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    position: "relative",
    top: 20, // Adjusted to position the logo higher
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover", // Ensures the background image covers the whole area
  },
  minMinLogo: {
    width: 150, // Adjust size as per the image
    height: 150, // Adjust size as per the image
    resizeMode: "contain",
  },
  formContainer: {
    padding: 24,
    width: "100%",
    maxWidth: 400, // Max width for larger screens
    alignSelf: "center",
    // ...Platform.select({
    //   web: {
    //     boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    //   },
    // }),
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 20, // Space below the title
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff", // White background for the input field itself
    borderRadius: 100, // Very rounded borders for the input container
    borderColor: "#EE8429",
    borderWidth: 1,
    marginBottom: 15, // Spacing between input fields
    paddingHorizontal: 15,
    height: 50, // Fixed height for inputs
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: "contain",
  },
  eyeIcon: {
    width: 20,
    height: 20,
    marginLeft: 10,
    resizeMode: "contain",
  },
  textInput: {
    flex: 1,
    backgroundColor: "transparent", // Transparent background for TextInput
    fontSize: 16,
    color: "#333", // Darker text color for input values
    paddingVertical: 0, // Remove default vertical padding
    paddingHorizontal: 0, // Remove default horizontal padding
  },
  signUpButton: {
    backgroundColor: "#96B76E", // Green button color
    borderRadius: 100, // Fully rounded button
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#000",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#000",
    fontSize: 14,
  },
  socialButton: {
    borderColor: "#ddd", // Light border for outlined buttons
    borderWidth: 1,
    borderRadius: 100, // Fully rounded
    marginBottom: 15,
    height: 50, // Fixed height
    justifyContent: "center",
    // alignItems: "center", // This might be overridden by children
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333", // Default text color
  },
  socialButtons: {
    marginTop: 20, // Space from divider
    width: "100%", // Full width
    maxWidth: 400, // Consistent with inputs max width
    alignSelf: "center",
  },
  googleButton: {
    backgroundColor: "white",
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginVertical: 8, // Space between social buttons
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  googleButtonText: {
    color: "#333", // Dark text color for Google button
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 10, // Space between icon and text
  },
  facebookButton: {
    backgroundColor: "#3b5998", // Facebook blue color
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginVertical: 8, // Space between social buttons
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  loginLinkContainer: {
    alignSelf: "center",
    marginTop: 10,
  },
  linkText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },
  loginLinkText: {
    fontWeight: "700",
    color: "#fff", // Orange color for "Log In"
  },
});

export default RegisterScreen;
