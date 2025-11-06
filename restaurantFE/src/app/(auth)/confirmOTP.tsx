import React from 'react';
import { View, StyleSheet } from 'react-native';
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
  const [OTP, setOTPText] = React.useState('');
  const email = useAppSelector((state) => state.auth.restaurant?.email);
  const dispatch = useDispatch();

  const onSuccessConfirmOTP = () => {
    dispatch(setOTP(OTP));
    router.push('/(auth)/resetPassword');
  };

  const { mutate: checkOTPFn } = useConfirmOTP(onSuccessConfirmOTP);

  const { mutate: ResetPasswordFn, isPending } = useResetPassword();

  const handleOTPConfirm = () => {
    const data = { email, otp: OTP };
    checkOTPFn(data);
  };

  const sendOTPAgain = () => {
    ResetPasswordFn({ email });
  };

  return (
    <View style={styles.container}>
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
        <Button
          mode="contained"
          onPress={handleOTPConfirm}
          style={styles.button}
        >
          {I18n.t('ConfirmOTP.verify_button')}{' '}
        </Button>
        {/* Resend OTP Button */}{' '}
        <Button
          mode="outlined"
          onPress={sendOTPAgain}
          style={styles.resendButton}
          loading={isPending}
        >
          {I18n.t('ConfirmOTP.resend_button')}{' '}
        </Button>{' '}
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
  logoText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#000',
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
    marginVertical: 16,
  },
  resendButton: {
    borderColor: '#91B275',
  },
});

export default ConfirmOTPScreen;
