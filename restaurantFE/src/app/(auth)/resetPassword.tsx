import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useAppSelector } from '@/lib/reduxStore/hooks';
import { useUpdatePassword } from '@/services/mutation/authMutation';
import { i18n as I18n } from '../_layout';
import { useRouter } from 'expo-router';

const ResetPasswordScreen = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorNew, setErrorNew] = useState(false);
  const [errorConfirm, setErrorConfirm] = useState(false);

  const email = useAppSelector((state) => state.auth.restaurant?.email);
  const OTP = useAppSelector((state) => state.auth.OTP);
  const router = useRouter();

  const { mutate: ChangePasswordFn, isPending } = useUpdatePassword();

  const handleChangePassword = () => {
    let hasError = false;

    if (!newPassword.trim()) {
      setErrorNew(true);
      hasError = true;
    } else {
      setErrorNew(false);
    }

    if (!confirmPassword.trim()) {
      setErrorConfirm(true);
      hasError = true;
    } else {
      setErrorConfirm(false);
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setErrorNew(true);
      setErrorConfirm(true);
      alert(I18n.t('resetPassword.error_passwords_do_not_match'));
      return;
    }

    if (hasError) return;

    const data = { email, otp: OTP, new_password: newPassword };
    ChangePasswordFn(data);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.titleText}>
          {I18n.t('resetPassword.reset_password_title')}
        </Text>
        <Text style={styles.subtitleText}>
          {I18n.t('resetPassword.reset_password_subtitle')}
        </Text>

        <TextInput
          placeholder={I18n.t('resetPassword.label_new_password')}
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            if (text.trim()) setErrorNew(false);
          }}
          secureTextEntry
          style={[styles.input, errorNew && styles.inputError]}
        />
        {errorNew && (
          <Text style={styles.errorText}>Please enter a new password</Text>
        )}

        <TextInput
          placeholder={I18n.t('resetPassword.label_confirm_password')}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (text.trim()) setErrorConfirm(false);
          }}
          secureTextEntry
          style={[styles.input, errorConfirm && styles.inputError]}
        />
        {errorConfirm && (
          <Text style={styles.errorText}>Please confirm your password</Text>
        )}

        <Button
          mode="contained"
          onPress={handleChangePassword}
          style={styles.button}
          loading={isPending}
        >
          {I18n.t('resetPassword.button_change_password')}
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
    backgroundColor: '#91B27517',
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
    marginTop: 16,
  },
});

export default ResetPasswordScreen;
