import React, { useState } from 'react';
import { View, StyleSheet, Animated, TextInput } from 'react-native';
import { setRestaurant } from '@/lib/reduxStore/authSlice';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useResetPassword } from '@/services/mutation/authMutation';
import { i18n as I18n } from '../_layout';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const onSuccessResetPassword = () => {
    dispatch(setRestaurant({ email: email }));
    router.push('/(auth)/confirmOTP');
  };

  const { mutate: ResetPasswordFn, isPending } = useResetPassword(
    onSuccessResetPassword
  );

  const handlePasswordReset = () => {
    if (!email.trim()) {
      setError(true);
      return;
    }
    setError(false);
    const data = { email };
    ResetPasswordFn(data);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titleText}>{I18n.t('ForgotPassword.title')}</Text>
        <Text style={styles.subtitleText}>
          {I18n.t('ForgotPassword.subtitle')}
        </Text>

        {/* Input Fields */}
        <TextInput
          placeholder={I18n.t('ForgotPassword.email_placeholder')}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (text.trim()) setError(false); // Clear error when user types
          }}
          keyboardType="email-address"
          style={[styles.input, error && styles.inputError]}
        />
        {error && (
          <Text style={styles.errorText}>Please enter a valid email</Text>
        )}

        {/* Reset Password Button */}
        <Button
          mode="contained"
          onPress={handlePasswordReset}
          style={styles.button}
          loading={isPending}
        >
          {I18n.t('ForgotPassword.reset_button')}
        </Button>

        <View style={styles.bottomLinks}>
          <Button onPress={() => router.push('/(auth)')}>
            {I18n.t('ForgotPassword.sign_in_link')}
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#EFF4EB',
  },
  card: {
    width: 600,
    alignSelf: 'center',
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    flexDirection: 'column',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  titleText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
  },
  subtitleText: {
    textAlign: 'center',
    marginBottom: 16,
    color: 'gray',
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
    marginBottom: 12,
  },
  button: {
    marginBottom: 16,
    backgroundColor: '#91B275',
  },
  bottomLinks: {
    alignItems: 'center',
  },
  signInText: {
    color: '#000',
  },
});

export default ForgotPasswordScreen;
