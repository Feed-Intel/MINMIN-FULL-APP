import React from 'react';
import { View, StyleSheet, Animated, TextInput } from 'react-native';
import { setRestaurant } from '@/lib/reduxStore/authSlice';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useResetPassword } from '@/services/mutation/authMutation';
import { i18n as I18n } from '../_layout';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = React.useState('');
  const dispatch = useDispatch();

  const onSuccessResetPassword = () => {
    dispatch(setRestaurant({ email: email }));
    router.push('/(auth)/confirmOTP');
  };

  const { mutate: ResetPasswordFn } = useResetPassword(onSuccessResetPassword);

  const handlePasswordReset = () => {
    const data = { email };
    ResetPasswordFn(data);
  };

  return (
    <View style={styles.container}>
      {/* Title and Subtitle container */}
      <View
        style={{
          width: 600,
          alignSelf: 'center',
          backgroundColor: '#fff',
          padding: 40,
          borderRadius: 15,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          flexDirection: 'column',
        }}
      >
        <Text variant="headlineLarge" style={styles.titleText}>
          {I18n.t('ForgotPassword.title')}
        </Text>
        <Text variant="bodyLarge" style={styles.subtitleText}>
          {I18n.t('ForgotPassword.subtitle')}
        </Text>

        {/* Input Fields */}
        <TextInput
          placeholder={I18n.t('ForgotPassword.email_placeholder')}
          value={email}
          onChangeText={(text: string) => setEmail(text)} // Use e.target.value for web
          keyboardType="email-address"
          style={styles.input}
        />

        {/* Reset Password Button */}
        <Button
          mode="contained"
          onPress={handlePasswordReset}
          style={styles.button}
          // The labelStyle prop is ignored in this web simulation but kept for context
        >
          {I18n.t('ForgotPassword.reset_button')}
        </Button>

        <View style={styles.bottomLinks}>
          <Button
            // The labelStyle prop is ignored in this web simulation but kept for context
            onPress={() => {
              router.push('/(auth)');
            }}
          >
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
