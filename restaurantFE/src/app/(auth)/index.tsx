import React, { useEffect } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { Text, Button, Card, Paragraph, useTheme } from 'react-native-paper';
import { TextInput } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { setRestaurant } from '@/lib/reduxStore/authSlice';
import { useLogin } from '@/services/mutation/authMutation';
import Toast from 'react-native-toast-message';
import { i18n as I18n } from '../_layout';

const LoginScreen = () => {
  const logoAnimation = React.useRef(new Animated.Value(0)).current;
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
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
      restaurant_name?: string;
    }>(data.access_token);
    const isBranchUser = decoded.user_type === 'branch';
    const isRestaurantUser = decoded.user_type === 'restaurant';

    if ((isBranchUser || isRestaurantUser) && !decoded?.branch) {
      Toast.show({
        type: 'error',
        text1: I18n.t('Login.error_title'), // Localized
        text2: I18n.t('Login.error_no_branch'), // Localized
      });
      return;
    }

    if (isRestaurantUser && !decoded?.tenant) {
      Toast.show({
        type: 'error',
        text1: I18n.t('Login.error_title'), // Localized
        text2: I18n.t('Login.error_no_tenant'), // Localized
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
    if (!email || !password) {
      // Replaced alert with Toast and localized the message
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
      {/* Title Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text
            variant="headlineLarge"
            style={[styles.title, { color: '#3A3A3A' }]}
          >
            {I18n.t('Login.welcome_title')} {/* Localized */}
          </Text>
          <Paragraph style={styles.subtitle}>
            {I18n.t('Login.subtitle')} {/* Localized */}
          </Paragraph>

          {/* Input Fields */}
          <TextInput
            placeholder={I18n.t('Login.email_placeholder')}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />
          <TextInput
            placeholder={I18n.t('Login.password_placeholder')}
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
            labelStyle={{ color: '#fff' }}
          >
            {
              isPending
                ? I18n.t('Login.logging_in') // Localized
                : I18n.t('Login.login_button') // Localized
            }
          </Button>

          {/* Forgot Password */}
          <Button
            mode="text"
            onPress={() => router.push('/(auth)/forgotPassword')}
            style={styles.forgotPassword}
            labelStyle={{ color: '#3A3A3A' }}
          >
            {I18n.t('Login.forgot_password')} {/* Localized */}
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
