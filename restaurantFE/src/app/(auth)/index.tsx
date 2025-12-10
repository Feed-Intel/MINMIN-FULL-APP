import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Text, Button, Card, Paragraph } from 'react-native-paper';
import { TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import validator from 'validator';
import { setRestaurant } from '@/lib/reduxStore/authSlice';
import { useLogin } from '@/services/mutation/authMutation';
import Toast from 'react-native-toast-message';
import { i18n, i18n as I18n } from '../_layout';

const LoginScreen = () => {
  const logoAnimation = useRef(new Animated.Value(0)).current;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
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
      restaurant_name?: string;
    }>(data.access_token);

    const isBranchUser = decoded.user_type === 'branch';
    const isRestaurantUser = decoded.user_type === 'restaurant';

    if ((isBranchUser || isRestaurantUser) && !decoded?.branch) {
      Toast.show({
        type: 'error',
        text1: I18n.t('Login.error_title'),
        text2: I18n.t('Login.error_no_branch'),
      });
      return;
    }

    if (isRestaurantUser && !decoded?.tenant) {
      Toast.show({
        type: 'error',
        text1: I18n.t('Login.error_title'),
        text2: I18n.t('Login.error_no_tenant'),
      });
      return;
    }

    await AsyncStorage.setItem('accessToken', data.access_token);
    await AsyncStorage.setItem('refreshToken', data.refresh_token);

    dispatch(
      setRestaurant({
        id: decoded.tenant,
        user_type: decoded.user_type,
        email: decoded.email,
        branch: decoded?.branch,
        restaurant_name: decoded?.restaurant_name,
      })
    );

    router.replace('/(protected)/dashboard');
  };

  const handleLogin = () => {
    const isEmailInValid = !validator.isEmail(email);
    const isPasswordInValid = validator.isEmpty(password);

    setEmailError(isEmailInValid);
    setPasswordError(isPasswordInValid);

    if (isEmailInValid || isPasswordInValid) {
      Toast.show({
        type: 'error',
        text1: I18n.t('Login.error_title'),
        text2: I18n.t('Login.error_missing_fields'),
      });
      return;
    }

    LoginFn({ email, password }, { onSuccess });
  };

  return (
    <Animated.View style={[styles.container, { opacity: logoAnimation }]}>
      <Card style={styles.card}>
        <Card.Content>
          <Text
            style={[
              styles.title,
              { color: '#3A3A3A', fontSize: 28, fontWeight: 'bold' },
            ]}
          >
            {I18n.t('Login.welcome_title')}
          </Text>
          <Paragraph style={styles.subtitle}>
            {I18n.t('Login.subtitle')}
          </Paragraph>

          {/* Email Input */}
          <TextInput
            placeholder={I18n.t('Login.email_placeholder')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (text.trim()) setEmailError(false);
            }}
            style={[styles.input, emailError && styles.inputError]}
            keyboardType="email-address"
          />
          {emailError && (
            <Text style={styles.errorText}>
              {i18n.t('Login.invalid_email')}
            </Text>
          )}

          {/* Password Input */}
          <TextInput
            placeholder={I18n.t('Login.password_placeholder')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (text.trim()) setPasswordError(false);
            }}
            style={[styles.input, passwordError && styles.inputError]}
            secureTextEntry
          />
          {passwordError && (
            <Text style={styles.errorText}>
              {i18n.t('Login.invalid_password')}
            </Text>
          )}

          {/* Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isPending}
            style={styles.button}
            labelStyle={{ color: '#fff' }}
          >
            {isPending
              ? I18n.t('Login.logging_in')
              : I18n.t('Login.login_button')}
          </Button>

          {/* Forgot Password */}
          <Button
            mode="text"
            onPress={() => router.push('/(auth)/forgotPassword')}
            style={styles.forgotPassword}
            labelStyle={{ color: '#3A3A3A' }}
          >
            {I18n.t('Login.forgot_password')}
          </Button>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#EFF4EB', // Light theme background
  },
  card: {
    width: '100%',
    maxWidth: 500,
    padding: 16,
    borderRadius: 8,
    elevation: 4,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#6b6b6b', // Subtle subtitle color
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#91B27517',
    height: 50,
    padding: 8,
    borderRadius: 8,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1.5,
  },
  errorText: {
    color: 'red',
    marginBottom: 8,
  },
  button: {
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: '#91B275',
  },
  forgotPassword: {
    marginTop: 8,
  },
});

export default LoginScreen;
