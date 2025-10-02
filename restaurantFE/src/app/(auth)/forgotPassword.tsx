import React from 'react';
import { View, StyleSheet, Animated, TextInput } from 'react-native';
import { setRestaurant } from '@/lib/reduxStore/authSlice';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useResetPassword } from '@/services/mutation/authMutation';

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
      {/* Title and Subtitle */}
      <View
        style={{
          width: 600,
          alignSelf: 'center',
          backgroundColor: '#fff',
          padding: 40,
          borderRadius: 15,
        }}
      >
        <Text variant="headlineLarge" style={styles.titleText}>
          Forgot your Password
        </Text>
        <Text variant="bodyLarge" style={styles.subtitleText}>
          Please enter your email address and we will send you a password reset
          OTP
        </Text>
        {/* Input Fields */}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          style={styles.input}
        />

        {/* Reset Password Button */}
        <Button
          mode="contained"
          onPress={handlePasswordReset}
          style={styles.button}
          labelStyle={{ color: '#fff' }}
        >
          Reset Password
        </Button>

        <View style={styles.bottomLinks}>
          <Button
            labelStyle={styles.signInText}
            onPress={() => {
              router.push('/(auth)');
            }}
          >
            Sign In
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
