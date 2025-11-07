import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useAppSelector } from '@/lib/reduxStore/hooks';
import { useUpdatePassword } from '@/services/mutation/authMutation';
import { i18n as I18n } from '../_layout';

const ResetPasswordScreen = () => {
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  // Assuming useAppSelector and useUpdatePassword are defined elsewhere
  const email = useAppSelector((state) => state.auth.restaurant?.email);
  const OTP = useAppSelector((state) => state.auth.OTP);

  const { mutate: ChangePasswordFn, isPending } = useUpdatePassword();

  const handleChangePassword = () => {
    const data = { email, otp: OTP, new_password: newPassword };
    if (newPassword !== confirmPassword) {
      alert(I18n.t('resetPassword.error_passwords_do_not_match'));
      return;
    }
    ChangePasswordFn(data);
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
          {I18n.t('resetPassword.reset_password_title')}
        </Text>
        <Text variant="bodyLarge" style={styles.subtitleText}>
          {I18n.t('resetPassword.reset_password_subtitle')}
        </Text>

        <TextInput
          label={I18n.t('resetPassword.label_new_password')}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label={I18n.t('resetPassword.label_confirm_password')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

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
  button: {
    marginTop: 16,
  },
});

export default ResetPasswordScreen;
