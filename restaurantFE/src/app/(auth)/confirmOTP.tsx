import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { setOTP } from '@/lib/reduxStore/authSlice';
import { OtpInput } from 'react-native-otp-entry';
import { useAppSelector } from '@/lib/reduxStore/hooks';
import { useDispatch } from 'react-redux';
import { Text, Button } from 'react-native-paper';
import { router } from 'expo-router';
import {
  useConfirmOTP,
  useResetPassword,
} from '@/services/mutation/authMutation';
import { i18n as I18n } from '../_layout';

const ConfirmOTPScreen = () => {
  const logoAnimation = React.useRef(new Animated.Value(0)).current;
  const [OTP, setOTPText] = React.useState('');
  const email = useAppSelector((state) => state.auth.restaurant?.email);
  const dispatch = useDispatch();

  const onSuccessConfirmOTP = () => {
    dispatch(setOTP(OTP));
    router.push('/(auth)/resetPassword');
  };

  const { mutate: checkOTPFn } = useConfirmOTP(onSuccessConfirmOTP);

  const { mutate: ResetPasswordFn } = useResetPassword();

  const handleOTPConfirm = () => {
    const data = { email, otp: OTP };
    checkOTPFn(data);
  };

  const sendOTPAgain = () => {
    ResetPasswordFn({ email });
  };

  return (
    <View style={styles.container}>
      {/* Logo Animation */}{' '}
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
        {' '}
        <Text style={styles.logoText}>
          {I18n.t('ConfirmOTP.logo_text')}
        </Text>{' '}
      </Animated.View>
      {/* Title and Subtitle */}{' '}
      <Text variant="headlineLarge" style={styles.titleText}>
        {I18n.t('ConfirmOTP.title')}{' '}
      </Text>{' '}
      <Text variant="bodyLarge" style={styles.subtitleText}>
        {I18n.t('ConfirmOTP.subtitle')}{' '}
      </Text>{' '}
      <OtpInput
        numberOfDigits={6}
        onTextChange={setOTPText}
        focusColor={'gray'}
        type="numeric"
        theme={{
          pinCodeContainerStyle: styles.pinCodeStyle,
          pinCodeTextStyle: styles.textStyle,
        }}
      />
      {/* Verify OTP Button */}{' '}
      <Button mode="contained" onPress={handleOTPConfirm} style={styles.button}>
        {I18n.t('ConfirmOTP.verify_button')}{' '}
      </Button>
      {/* Resend OTP Button */}{' '}
      <Button
        mode="outlined"
        onPress={sendOTPAgain}
        style={styles.resendButton}
      >
        {I18n.t('ConfirmOTP.resend_button')}{' '}
      </Button>{' '}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    //
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
  },
  subtitleText: {
    textAlign: 'center',
    marginBottom: 16,
    color: 'gray',
  },
  input: {
    marginBottom: 16,
  },
  textStyle: {
    color: 'var(--color-typography-700)', // Replace with your desired CSS variable
  },
  pinCodeStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    minHeight: 50,
    minWidth: 50,
    marginInline: 2.5,
  },
  button: {
    marginBottom: 16,
  },
  resendButton: {
    borderColor: '#6200ee',
  },
});

export default ConfirmOTPScreen;
