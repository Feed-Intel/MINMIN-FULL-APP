import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { setOTP } from '@/lib/reduxStore/authSlice';
import { OtpInput } from 'react-native-otp-entry';
import { useAppSelector } from '@/lib/reduxStore/hooks';
import { useDispatch } from 'react-redux';
import { Text, Button } from 'react-native-paper';
import { router, useRouter } from 'expo-router';
import {
  useConfirmOTP,
  useResetPassword,
} from '@/services/mutation/authMutation';
import { i18n as I18n } from '../_layout';

const ConfirmOTPScreen = () => {
  const [OTP, setOTPText] = useState('');
  const [error, setError] = useState(false);
  const email = useAppSelector((state) => state.auth.restaurant?.email);
  const dispatch = useDispatch();
  const router = useRouter();

  const onSuccessConfirmOTP = () => {
    dispatch(setOTP(OTP));
    router.push('/(auth)/resetPassword');
  };

  const { mutate: checkOTPFn } = useConfirmOTP(onSuccessConfirmOTP);
  const { mutate: ResetPasswordFn, isPending } = useResetPassword();

  const handleOTPConfirm = () => {
    if (OTP.trim().length !== 6) {
      setError(true);
      return;
    }
    setError(false);
    const data = { email, otp: OTP };
    checkOTPFn(data);
  };

  const sendOTPAgain = () => {
    ResetPasswordFn({ email });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titleText}>{I18n.t('ConfirmOTP.title')}</Text>
        <Text style={styles.subtitleText}>{I18n.t('ConfirmOTP.subtitle')}</Text>

        <OtpInput
          numberOfDigits={6}
          onTextChange={(text) => {
            setOTPText(text);
            if (text.trim().length === 6) setError(false);
          }}
          focusColor={error ? 'red' : 'gray'}
          type="numeric"
          theme={{
            pinCodeContainerStyle: StyleSheet.flatten([
              styles.pinCodeStyle,
              error ? styles.pinCodeError : undefined,
            ]),
            pinCodeTextStyle: styles.textStyle,
          }}
        />
        {error && <Text style={styles.errorText}>OTP must be 6 digits</Text>}

        {/* Verify OTP Button */}
        <Button
          mode="contained"
          onPress={handleOTPConfirm}
          style={styles.button}
        >
          {I18n.t('ConfirmOTP.verify_button')}
        </Button>

        {/* Resend OTP Button */}
        <Button
          mode="outlined"
          onPress={sendOTPAgain}
          style={styles.resendButton}
          loading={isPending}
        >
          {I18n.t('ConfirmOTP.resend_button')}
        </Button>
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
  pinCodeError: {
    borderColor: 'red',
    borderWidth: 1.5,
  },
  errorText: { color: 'red', marginBottom: 12, textAlign: 'center' },
  button: {
    marginVertical: 16,
  },
  resendButton: {
    borderColor: '#91B275',
  },
});

export default ConfirmOTPScreen;
