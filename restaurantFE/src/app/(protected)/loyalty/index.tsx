import {
  useGetLoyaltyConversionRate,
  useGetLoyaltySettings,
  useUpdateLoyaltySettings,
} from '@/services/mutation/loyaltyMutation';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  Snackbar,
  HelperText,
} from 'react-native-paper';
import { i18n as I18n } from '@/app/_layout';

const LoyaltySettingsScreen = () => {
  const [thresholdPoints, setThresholdPoints] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const [errors, setErrors] = useState<{
    thresholdPoints?: string;
    conversionRate?: string;
  }>({});
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetLoyaltySettings();
  const { data: settingsConversion, isLoading: isConversionLoading } =
    useGetLoyaltyConversionRate();
  const { mutate: updateSettings, isPending } = useUpdateLoyaltySettings();

  useEffect(() => {
    if (settings) setThresholdPoints(settings?.threshold || 0);
    if (settingsConversion)
      setConversionRate(settingsConversion?.global_to_restaurant_rate || 0);
  }, [settings, settingsConversion]);

  const validate = () => {
    const newErrors: { thresholdPoints?: string; conversionRate?: string } = {};
    if (thresholdPoints === null || thresholdPoints <= 0)
      newErrors.thresholdPoints = I18n.t('loyaltySettings.invalid_threshold');
    if (conversionRate === null || conversionRate <= 0)
      newErrors.conversionRate = I18n.t(
        'loyaltySettings.invalid_conversion_rate'
      );
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateSettings = () => {
    if (!validate()) return;

    updateSettings({
      threshold: thresholdPoints,
      global_to_restaurant_rate: conversionRate,
    });
    setSnackbarMessage(I18n.t('loyaltySettings.successMessage'));
  };

  const handleCancel = () => {
    if (settings) setThresholdPoints(settings.threshold);
    if (settingsConversion)
      setConversionRate(settingsConversion.global_to_restaurant_rate);
    setErrors({});
  };

  const inputOutlineStyle = (field: 'thresholdPoints' | 'conversionRate') => ({
    borderColor: errors[field] ? 'red' : '#5A6E4933',
    borderWidth: 1,
    borderRadius: 8,
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isLoading || isConversionLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} color="#91B275" size="large" />
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          <Text style={styles.pageTitle}>
            {I18n.t('loyaltySettings.title')}
          </Text>

          <Text style={styles.inputLabel}>
            {I18n.t('loyaltySettings.thresholdLabel')}
          </Text>
          <TextInput
            mode="outlined"
            value={thresholdPoints?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              setThresholdPoints(numericValue ? Number(numericValue) : null);
            }}
            style={styles.input}
            outlineStyle={inputOutlineStyle('thresholdPoints')}
          />
          <HelperText type="error" visible={!!errors.thresholdPoints}>
            {errors.thresholdPoints}
          </HelperText>

          <Text style={styles.inputLabel}>
            {I18n.t('loyaltySettings.conversionRateLabel')}
          </Text>
          <TextInput
            mode="outlined"
            value={conversionRate?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              setConversionRate(numericValue ? Number(numericValue) : null);
            }}
            style={styles.input}
            outlineStyle={inputOutlineStyle('conversionRate')}
          />
          <HelperText type="error" visible={!!errors.conversionRate}>
            {errors.conversionRate}
          </HelperText>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleUpdateSettings}
              loading={isPending}
              style={styles.saveButton}
              labelStyle={styles.buttonLabel}
            >
              {I18n.t('loyaltySettings.saveButton')}
            </Button>

            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.cancelButton}
              labelStyle={[styles.buttonLabel, styles.cancelButtonLabel]}
              textColor="#91B275"
            >
              {I18n.t('loyaltySettings.cancelButton')}
            </Button>
          </View>
        </View>
      )}

      <Snackbar
        visible={Boolean(snackbarMessage)}
        onDismiss={() => setSnackbarMessage('')}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#EFF4EB' },
  contentWrapper: { width: '100%', alignSelf: 'center' },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  input: { marginBottom: 10, backgroundColor: '#50693A17', borderRadius: 8 },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 20,
    gap: 15,
  },
  saveButton: {
    backgroundColor: '#91B275',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 2,
  },
  cancelButton: {
    borderColor: '#5A6E4933',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
  buttonLabel: { fontSize: 16, fontWeight: '600', color: '#fff' },
  cancelButtonLabel: { color: '#91B275' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  snackbar: { backgroundColor: '#333', marginBottom: 20 },
});

export default LoyaltySettingsScreen;
