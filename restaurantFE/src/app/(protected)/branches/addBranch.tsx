import React, { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  TextInput,
  Button,
  Switch,
  Text,
  Appbar,
  Snackbar,
  HelperText,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useCreateBranch } from '@/services/mutation/branchMutation';
import { i18n as I18n } from '@/app/_layout';

interface AddBranchDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddBranchDialog({
  visible,
  onClose,
  onSuccess,
}: AddBranchDialogProps) {
  const [branchData, setBranchData] = useState({
    address: '',
    lat: '',
    lng: '',
    is_default: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSnackbar, setShowSnackbar] = useState(false);

  const { mutate: addBranch, isPending } = useCreateBranch(
    () => {
      setBranchData({ address: '', lat: '', lng: '', is_default: false });
      setShowSnackbar(true);
      onSuccess();
    },
    () => {
      setErrors({ general: I18n.t('AddBranch.general_error') });
    }
  );

  const validateForm = () => {
    const validationErrors: { [key: string]: string } = {};

    if (!branchData.address.trim()) {
      validationErrors.address = I18n.t('AddBranch.address_required');
    } else if (branchData.address.trim().length < 3) {
      validationErrors.address = I18n.t('AddBranch.address_min_length');
    }

    if (!branchData.lat.trim()) {
      validationErrors.lat = I18n.t('AddBranch.latitude_required');
    } else {
      const latitude = parseFloat(branchData.lat.trim());
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        validationErrors.lat = I18n.t('AddBranch.latitude_range_error');
      }
    }

    if (!branchData.lng.trim()) {
      validationErrors.lng = I18n.t('AddBranch.longitude_required');
    } else {
      const longitude = parseFloat(branchData.lng.trim());
      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        validationErrors.lng = I18n.t('AddBranch.longitude_range_error');
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      addBranch({
        ...branchData,
        gps_coordinates: `${branchData.lat},${branchData.lng}`,
      });
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Content>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView>
              {/* Address Input */}
              <TextInput
                placeholder={I18n.t('AddBranch.address_placeholder')}
                mode="outlined"
                value={branchData.address}
                onChangeText={(text) =>
                  setBranchData({ ...branchData, address: text })
                }
                style={styles.input}
                error={!!errors.address}
                outlineStyle={{
                  borderColor: '#91B275',
                  borderWidth: 0,
                  borderRadius: 16,
                }}
                placeholderTextColor="#202B1866"
              />
              <HelperText type="error" visible={!!errors.address}>
                {errors.address}
              </HelperText>

              {/* Latitude Input */}
              <TextInput
                placeholder={I18n.t('AddBranch.latitude_placeholder')}
                mode="outlined"
                value={branchData.lat}
                onChangeText={(text) =>
                  setBranchData({
                    ...branchData,
                    lat: text.replace(/[^0-9\-,\.]/g, ''),
                  })
                }
                style={styles.input}
                error={!!errors.lat}
                outlineStyle={{
                  borderColor: '#91B275',
                  borderWidth: 0,
                  borderRadius: 16,
                }}
                placeholderTextColor="#202B1866"
                keyboardType="numeric"
              />
              <HelperText type="error" visible={!!errors.lat}>
                {errors.lat}
              </HelperText>

              {/* Longitude Input */}
              <TextInput
                placeholder={I18n.t('AddBranch.longitude_placeholder')}
                mode="outlined"
                value={branchData.lng}
                onChangeText={(text) =>
                  setBranchData({
                    ...branchData,
                    lng: text.replace(/[^0-9\-,\.]/g, ''),
                  })
                }
                style={styles.input}
                error={!!errors.lng}
                outlineStyle={{
                  borderColor: '#91B275',
                  borderWidth: 0,
                  borderRadius: 16,
                }}
                placeholderTextColor="#202B1866"
                keyboardType="numeric"
              />
              <HelperText type="error" visible={!!errors.lng}>
                {errors.lng}
              </HelperText>

              {/* Default Switch */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {I18n.t('AddBranch.set_as_default_label')}
                </Text>
                <Switch
                  value={branchData.is_default}
                  onValueChange={(value) =>
                    setBranchData({ ...branchData, is_default: value })
                  }
                  color="#96B76E"
                  trackColor={{ false: '#96B76E', true: '#96B76E' }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isPending}
            disabled={isPending}
            style={{ borderRadius: 16, height: 36, backgroundColor: '#96B76E' }}
            labelStyle={{ color: '#fff', fontSize: 15 }}
          >
            {I18n.t('AddBranch.save_branch_button')}
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Snackbar for success/error */}
      <Snackbar
        visible={showSnackbar || !!errors.general}
        onDismiss={() => {
          setShowSnackbar(false);
          setErrors({ ...errors, general: '' });
        }}
        duration={3000}
      >
        {showSnackbar && !errors.general
          ? I18n.t('AddBranch.branch_add_success')
          : errors.general || I18n.t('AddBranch.fix_errors_prompt')}
      </Snackbar>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: '#EFF4EB',
    width: '40%',
    alignSelf: 'center',
    borderRadius: 12,
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: '#91B27517',
    borderWidth: 0,
    borderColor: '#91B275',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  switchText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#40392B',
  },
});
