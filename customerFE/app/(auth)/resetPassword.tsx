import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Platform, Image, View } from 'react-native'; // Import Image and View
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, TextInput } from 'react-native-paper';
import validator from 'validator';
import { router } from 'expo-router';
import { useUpdatePassword } from '@/services/mutation/authMutation';
import { useAuth } from '@/context/auth';
import { ThemedView } from '@/components/ThemedView'; // Assuming this is still used for overall theming
import Toast from 'react-native-toast-message'; // Import Toast for messages
import { i18n } from '@/app/_layout';

const ResetPasswordScreen = () => {
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const formAnimation = useRef(new Animated.Value(0)).current;
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const { user, handleNativeTokens } = useAuth();
  const { mutate: ChangePasswordFn } = useUpdatePassword();

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

  const handleChangePassword = () => {
    const data = {
      email: user?.email,
      new_password: newPassword,
      otp: user?.otp,
    };
    setIsSubmitted(true);
    if (
      validator.isStrongPassword(newPassword) ||
      validator.isStrongPassword(confirmPassword)
    ) {
      Toast.show({
        type: 'error',
        text1: i18n.t('error_toast_title'),
        text2: i18n.t('password_not_strong'),
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      // Replaced alert() with Toast.show() and i18n.t()
      Toast.show({
        type: 'error',
        text1: i18n.t('error_toast_title'),
        text2: i18n.t('passwords_do_not_match_alert'),
      });
      return;
    }
    ChangePasswordFn(data, {
      onSuccess: (resp) => {
        handleNativeTokens({
          accessToken: resp.access_token,
          refreshToken: resp.refresh_token,
        });
        router.replace('/(protected)/feed'); // Or wherever you want to redirect after password reset
      },
      onError: (error) => {
        console.error('Password reset failed:', error);
        // Replaced alert() with Toast.show() and i18n.t()
        Toast.show({
          type: 'error',
          text1: i18n.t('error_toast_title'),
          text2: i18n.t('password_reset_failed_alert'),
        });
      },
    });
  };

  const handleLoginPress = () => {
    router.replace('/(auth)'); // Assuming a login route
  };

  return (
    <ThemedView style={styles.container}>
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
          {/* Replace Text with Image for the logo */}
          <Image
            source={require('@/assets/images/minmin-green.png')} // **IMPORTANT:** Replace with your actual logo path
            style={styles.logoImage}
            resizeMode="contain"
          />
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
          <Text variant="headlineMedium" style={styles.titleText}>
            {i18n.t('reset_password_page_title')}{' '}
            {/* Replaced hardcoded string */}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitleText}>
            {i18n.t('reset_password_page_subtitle')}{' '}
            {/* Replaced hardcoded string */}
          </Text>

          <TextInput
            label={i18n.t('enter_new_password_label')}
            value={newPassword}
            onChangeText={(text: string) => {
              setNewPassword(text);
              if (isSubmitted) {
                setIsSubmitted(false);
              }
            }}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            theme={{
              colors: { primary: '#8DB663', onSurfaceVariant: '#8DB663' },
            }} // Adjusted primary color
            outlineColor="#D1D5DA" // Light border color for inputs
            activeOutlineColor="#8DB663" // Active border color
            placeholderTextColor="#A9A9A9"
            error={isSubmitted && !validator.isStrongPassword(newPassword)}
          />
          {isSubmitted && !validator.isStrongPassword(newPassword) && (
            <Text style={styles.errorText}>
              {i18n.t('password_not_strong')}
            </Text>
          )}

          <TextInput
            label={i18n.t('repeat_new_password_label')}
            value={confirmPassword}
            onChangeText={(text: string) => {
              setConfirmPassword(text);
              if (isSubmitted) {
                setIsSubmitted(false);
              }
            }}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            theme={{
              colors: { primary: '#8DB663', onSurfaceVariant: '#8DB663' },
            }} // Adjusted primary color
            outlineColor="#D1D5DA"
            activeOutlineColor="#8DB663"
            placeholderTextColor="#A9A9A9"
            error={isSubmitted && !validator.isStrongPassword(confirmPassword)}
          />
          {isSubmitted && !validator.isStrongPassword(confirmPassword) && (
            <Text style={styles.errorText}>
              {i18n.t('password_not_strong')}
            </Text>
          )}
          {isSubmitted && newPassword !== confirmPassword && (
            <Text style={styles.errorText}>
              {i18n.t('password_dont_match')}
            </Text>
          )}
          <Button
            mode="contained"
            onPress={handleChangePassword}
            style={styles.button}
            contentStyle={styles.buttonContent}
            theme={{ colors: { primary: '#8DB663' } }} // Adjusted primary color
            labelStyle={styles.buttonLabel}
          >
            {i18n.t('reset_button')} {/* Replaced hardcoded string */}
          </Button>
        </Animated.View>
      </SafeAreaView>

      {/* Remember Password? Login section */}
      <View style={styles.rememberPasswordContainer}>
        <Text style={styles.rememberPasswordText}>
          {i18n.t('remember_password_text')} {/* Replaced hardcoded string */}
        </Text>
        <Button
          mode="text"
          onPress={handleLoginPress}
          labelStyle={styles.loginButtonLabel}
          compact
        >
          {i18n.t('login_link')} {/* Replaced hardcoded string */}
        </Button>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between', // To push login text to bottom
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    paddingVertical: 20,
    backgroundColor: '#F2F2F2', // Light gray background from image
  },
  safeArea: {
    flex: 1, // Allow SafeAreaView to take up available space
    justifyContent: 'center', // Center content vertically
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 40 : 30,
  },
  logoImage: {
    width: Platform.OS === 'web' ? 150 : 120, // Adjust size as needed
    height: Platform.OS === 'web' ? 150 : 120, // Adjust size as needed
    tintColor: '#8DB663', // Apply tint if logo is monochrome and needs color
  },
  formContainer: {
    padding: Platform.OS === 'web' ? 24 : 20,
    ...Platform.select({
      web: {
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
      default: {
        marginHorizontal: 8,
      },
    }),
  },
  titleText: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '700', // Bolder for "Reset Password"
    color: '#333',
    fontSize: Platform.OS === 'web' ? 28 : 24, // Adjust font size
  },
  subtitleText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontSize: Platform.OS === 'web' ? 18 : 16, // Adjust font size
  },
  input: {
    marginBottom: 16, // Increased margin for better spacing
    backgroundColor: '#F7F7F7', // Light gray background for inputs
    borderRadius: 22, // Rounded corners for inputs
    ...Platform.select({
      web: {
        maxWidth: 320,
        width: '100%',
        alignSelf: 'center',
      },
    }),
  },
  button: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
    ...Platform.select({
      web: {
        maxWidth: 320,
        width: '100%',
        alignSelf: 'center',
      },
    }),
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontWeight: 'bold', // Make button text bold
    fontSize: 16,
  },
  rememberPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20, // Add some bottom margin
  },
  rememberPasswordText: {
    color: '#666',
    fontSize: 16,
  },
  loginButtonLabel: {
    color: '#8DB663', // Green color for Login link
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginTop: 10,
    marginLeft: 20,
  },
});

export default ResetPasswordScreen;
