import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform,
  Image,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckBox } from 'react-native-elements';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useNetworkState } from 'expo-network';
import validator from 'validator';
import SignInWithGoogleButton from '@/components/ui/SignInWithGoogleButton';
import SignInWithFacebookButton from '@/components/ui/SignInWithFacebookButton';
import { useAuth } from '@/context/auth';
import { ThemedView } from '@/components/ThemedView';
import Toast from 'react-native-toast-message';
import { i18n } from '@/app/_layout';
import TurnstileCaptcha from '@/components/Captcha';

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get('window'); // Get screen width for responsive design

const LoginScreen = () => {
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const networkState = useNetworkState();
  const [enabled, setEnabled] = useState<boolean>(false);
  const { signInWithEmail, signInWithGoogle, signInWithFacebook, isLoading } =
    useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  if (isLoading) {
    return (
      <ThemedView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#96B76E" />
      </ThemedView>
    );
  }

  const handleSignInWithEmail = () => {
    setIsSubmitted(true);
    if (validator.isEmail(email) && !validator.isEmpty(password)) {
      signInWithEmail(email, password, rememberMe);
      return;
    }
    Toast.show({
      type: 'error',
      text1: i18n.t('error_toast_title'),
      text2: i18n.t('login_error_message'),
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Image
        source={require('@/assets/images/background.png')}
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
          <Image source={require('@/assets/images/minmin-white.png')} />
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
          {/* Log In Title */}
          <Text style={styles.title}>{i18n.t('login_title')}</Text>

          <View style={styles.inputContainer}>
            <Image
              source={require('@/assets/images/Mail.png')}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder={i18n.t('email_placeholder')} // Replaced hardcoded string
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                ...styles.textInput,
                borderColor:
                  isSubmitted && !validator.isEmail(email) ? '#EE8429' : '#FFF',
              }}
              placeholderTextColor="#EE8429"
              underlineColor="transparent" // Removes Android's default underline
              activeUnderlineColor="transparent" // Removes Android's default underline
              cursorColor="#EE8429" // Sets the cursor color
            />
            {isSubmitted && !validator.isEmail(password) && (
              <Text style={styles.errorText}>{i18n.t('not_email')}</Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <Image
              source={require('@/assets/images/Lock.png')}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder={i18n.t('password_placeholder')} // Replaced hardcoded string
              value={password}
              onChangeText={(text: string) => {
                setPassword(text);
                if (isSubmitted) {
                  setIsSubmitted(false);
                }
              }}
              secureTextEntry={!showPassword}
              style={{
                ...styles.textInput,
                borderColor:
                  isSubmitted && validator.isEmpty(password)
                    ? '#EE8429'
                    : '#FFF',
              }} // Both Email and Password TextInputs now use 'textInput' style
              placeholderTextColor="#EE8429"
              underlineColor="transparent" // Removes Android's default underline
              activeUnderlineColor="transparent" // Removes Android's default underline
              cursorColor="#EE8429" // Sets the cursor color
            />
            {isSubmitted && validator.isEmpty(password) && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{i18n.t('password_empty')}</Text>
              </View>
            )}
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIconContainer}
            >
              <Image
                source={require('@/assets/images/Eye.png')}
                style={styles.inputIcon}
              />
            </Pressable>
          </View>

          <View style={styles.optionsContainer}>
            <Pressable
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberMeCheckboxWrapper}
            >
              <CheckBox
                title={i18n.t('remember_me_checkbox')} // Replaced hardcoded string
                checked={rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
                checkedColor="#96B76E" // Color when checked
                uncheckedColor="#FFF" // Color of the checkbox border/icon when unchecked
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
              />
            </Pressable>

            <Pressable onPress={() => router.push('/(auth)/forgotPassword')}>
              <Text style={styles.forgotPasswordText}>
                {i18n.t('forgot_password_link')}{' '}
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.loginButton}
            onPress={handleSignInWithEmail}
            disabled={!networkState.isInternetReachable}
          >
            <Text style={styles.loginButtonText}>{i18n.t('login_button')}</Text>
          </Pressable>
          {/* <TurnstileCaptcha
            siteKey="0x4AAAAAACEgbB50q9S_xe_X"
            onVerify={(token) => {
              console.log(token);
              setEnabled(true);
            }}
          /> */}

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerSection}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>
                {i18n.t('or_continue_with')} {/* Replaced hardcoded string */}
              </Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          <View style={styles.socialButtons}>
            <SignInWithGoogleButton
              onPress={signInWithGoogle}
              style={styles.googleButton}
              // textStyle={styles.googleButtonText}
            />
            <SignInWithFacebookButton
              onPress={signInWithFacebook}
              style={styles.facebookButton}
            />
          </View>

          {/* Footer for "Don't have an account? Sign Up" */}
          <View style={styles.footer}>
            <Pressable
              onPress={() => router.push('/(auth)/signUp')}
              disabled={!networkState.isInternetReachable}
            >
              <Text style={styles.linkText}>
                {i18n.t('dont_have_account_prefix')}{' '}
                {/* Replaced hardcoded string */}
                <Text style={styles.signUpText}>
                  {i18n.t('signup_link')} {/* Replaced hardcoded string */}
                </Text>
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Set a fallback background color consistent with the image's orange hue
    backgroundColor: '#F7A700',
  },
  safeArea: {
    flex: 1,
    position: 'relative',
    alignItems: 'center', // Center content horizontally within SafeAreaView
  },
  logoContainer: {
    position: 'relative',
    top: 50, // Adjusted to position the logo higher
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover', // Ensures the background image covers the whole area
  },
  inputIcon: {
    width: 24, // Adjusted icon size to match the image
    height: 24, // Adjusted icon size to match the image
    marginRight: 10,
    resizeMode: 'contain',
    // Removed 'color: white' as it's not applicable to Image components
  },
  title: {
    color: 'rgba(0, 0, 0, 1)', // Black color for the title
    fontSize: 28, // Increased font size for prominence
    fontWeight: '700',
    alignSelf: 'center',
    marginBottom: 20, // Space below the title
    marginTop: 0, // Resetting any default top margin, rely on formContainer padding
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    width: width * 0.85, // Adjust width based on screen size
    maxWidth: 400, // Max width for larger screens to prevent stretching
    paddingHorizontal: 0,
    paddingTop: Platform.OS === 'web' ? 80 : 60, // Adjusted padding to position title higher
    paddingBottom: Platform.OS === 'web' ? 40 : 20, // Adjusted padding for bottom of the form
    alignItems: 'center', // Center items within the form container
    backgroundColor: 'transparent', // Form container background is transparent to show background image
  },
  inputContainer: {
    flexDirection: 'row', // Align icon and text input horizontally
    alignItems: 'center', // Vertically center items in the row
    backgroundColor: 'white',
    borderRadius: 30, // Rounded corners for the input field
    height: 60, // Fixed height for the input container
    width: '100%', // Takes full width of its parent (formContainer)
    marginVertical: 10, // Space between email and password inputs
    paddingHorizontal: 20, // Internal padding for content
    // Removed borderWidth and borderColor as they are not present in the image
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5, // Shadow for Android
  },
  textInput: {
    flex: 1, // Allows TextInput to take available space
    color: '#333', // Default text color within the input
    fontWeight: '400',
    letterSpacing: -0.09,
    lineHeight: 17,
    fontSize: 17,
    backgroundColor: 'transparent', // Removes default background color
    paddingVertical: 0, // Removes default vertical padding
    paddingHorizontal: 0, // Removes default horizontal padding
    borderBottomWidth: 0, // Crucial for iOS to remove default bottom border on focus
    // outlineStyle: 'none', // Removed as it's not supported by React Native
  },
  eyeIconContainer: {
    paddingLeft: 10, // Space between password text and eye icon
    paddingRight: 5, // Small padding on the right for touch area
  },
  optionsContainer: {
    flexDirection: 'row', // Align "Remember Me" and "Forgot Password?" horizontally
    justifyContent: 'space-between', // Push items to ends of the container
    alignItems: 'center', // Vertically align items
    width: '100%', // Match width of input fields
    maxWidth: 400, // Consistent with inputs max width
    marginTop: 20, // Space from password input
    paddingHorizontal: 5, // Small horizontal padding for content alignment
  },
  rememberMeCheckboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // Space between checkbox and text
  },
  rememberMeText: {
    color: '#333', // Dark text as seen in the image
    fontSize: 14,
    marginLeft: -8, // Adjust to bring text closer to the checkbox if needed
  },
  forgotPasswordText: {
    color: '#fff', // Dark text as seen in the image
    fontWeight: '500', // Keep it bold as it's a link
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#96B76E', // Green color from the image
    borderRadius: 30, // Rounded corners
    height: 60, // Fixed height for the button
    width: '100%', // Takes full width of its parent
    alignSelf: 'center', // Centers the button horizontally
    marginTop: 30, // Space from options
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5, // Shadow for Android
  },
  loginButtonText: {
    color: '#FFF', // White text color
    fontWeight: '600', // Slightly bolder for button text
    fontSize: 18, // Larger font size for button text
  },
  checkboxContainer: {
    backgroundColor: 'transparent', // Make container transparent to show background
    borderWidth: 0, // Remove default border if any
    padding: 0, // Remove default padding if any
    margin: 0, // Remove default margin if any
  },
  checkboxText: {
    color: '#000', // Color for the "Remember Me" text
    fontSize: 14,
  },
  dividerContainer: {
    alignSelf: 'center',
    marginTop: 27,
    width: '85%', // Adjusted width to align with social buttons
    maxWidth: 360, // Consistent with other elements max width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dividerLine: {
    borderColor: 'rgba(0, 0, 0, 1)', // Lighter black for divider lines
    borderStyle: 'solid',
    borderWidth: StyleSheet.hairlineWidth, // Very thin line
    flex: 1, // Allows the lines to take available space
  },
  dividerText: {
    fontSize: 14,
    color: '#000', // Darker grey for text
    fontWeight: '400',
    marginHorizontal: 10, // Space around the text
  },
  socialButtons: {
    marginTop: 20, // Space from divider
    width: '100%', // Full width
    maxWidth: 400, // Consistent with inputs max width
    alignSelf: 'center',
  },
  googleButton: {
    backgroundColor: 'white',
    borderRadius: 30,
    height: 60,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 8, // Space between social buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    gap: 40, // Space between icon and text
    paddingHorizontal: 12,
  },
  googleButtonText: {
    color: '#333', // Dark text color for Google button
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10, // Space between icon and text
  },
  facebookButton: {
    backgroundColor: '#3b5998', // Facebook blue color
    borderRadius: 30,
    height: 60,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 8, // Space between social buttons
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    gap: 40, // Space between icon and text
    paddingHorizontal: 12,
  },
  facebookButtonText: {
    color: 'white', // White text color for Facebook button
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10, // Space between icon and text
  },
  footer: {
    marginTop: 20, // Space from social buttons
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: Platform.OS === 'web' ? 20 : 0, // Add bottom padding for web
  },
  linkText: {
    color: '#000', // Dark grey for "Don't have an account?"
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
  signUpText: {
    fontWeight: '700', // Bolder for "Sign Up"
    color: '#fff', // Orange color for "Sign Up"
  },
  // Loader container styles, using the app's background color
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7A700',
  },
  errorText: {
    color: '#EE8429', // Red color for error text
    fontSize: 14,
    marginTop: 5,
  },
  errorContainer: {
    display: 'flex',
    marginTop: 5,
  },
});

export default LoginScreen;
