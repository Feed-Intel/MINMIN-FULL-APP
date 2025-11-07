import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  TextInput,
  Button,
  Switch,
  Text,
  Snackbar,
  HelperText,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useUpdateBranch } from '@/services/mutation/branchMutation';
import Toast from 'react-native-toast-message';
import { i18n as I18n } from '@/app/_layout';

interface EditBranchDialogProps {
  visible: boolean;
  branch: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditBranchDialog({
  visible,
  branch,
  onClose,
  onSuccess,
}: EditBranchDialogProps) {
  const [branchData, setBranchData] = useState<any>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSnackbar, setShowSnackbar] = useState(false);

  const { mutate: updateBranch, isPending } = useUpdateBranch();

  useEffect(() => {
    if (branch) {
      setBranchData({
        id: branch.id,
        address: branch.address,
        is_default: branch.is_default,
        // Ensure lat/lng are string for TextInput consistency
        lat: String(branch.location?.lat || ''),
        lng: String(branch.location?.lng || ''),
        gps_coordinates: branch.gps_coordinates || '',
      });
    }
  }, [branch]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Check if branchData is initialized
    if (!branchData) return false;

    // Validate Address
    if (!branchData.address || !branchData.address.trim()) {
      errors.address = I18n.t('EditBranch.error_address_required');
      Toast.show({
        type: 'error',
        text1: I18n.t('Common.error_title'),
        text2: errors.address,
      });
    } else if (branchData.address.trim().length < 3) {
      errors.address = I18n.t('EditBranch.error_address_length');
      Toast.show({
        type: 'error',
        text1: I18n.t('Common.error_title'),
        text2: errors.address,
      });
    }

    // Validate Latitude
    if (!branchData.lat || !branchData.lat.trim()) {
      errors.lat = I18n.t('EditBranch.error_lat_required');
      Toast.show({
        type: 'error',
        text1: I18n.t('Common.error_title'),
        text2: errors.lat,
      });
    } else {
      const latitude = parseFloat(branchData.lat.trim());
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        errors.lat = I18n.t('EditBranch.error_lat_range');
        Toast.show({
          type: 'error',
          text1: I18n.t('Common.error_title'),
          text2: errors.lat,
        });
      }
    }

    // Validate Longitude
    if (!branchData.lng || !branchData.lng.trim()) {
      errors.lng = I18n.t('EditBranch.error_lng_required');
      Toast.show({
        type: 'error',
        text1: I18n.t('Common.error_title'),
        text2: errors.lng,
      });
    } else {
      const longitude = parseFloat(branchData.lng.trim());
      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        errors.lng = I18n.t('EditBranch.error_lng_range');
        Toast.show({
          type: 'error',
          text1: I18n.t('Common.error_title'),
          text2: errors.lng,
        });
      }
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = () => {
    if (validateForm() && branchData) {
      updateBranch(
        {
          ...branchData,
          // Correctly convert to string format for API
          gps_coordinates: `${branchData.lat},${branchData.lng}`,
        },
        {
          onSuccess: () => {
            onSuccess();
            setShowSnackbar(true);
            onClose();
          },
        }
      );
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>{I18n.t('EditBranch.modal_title')}</Dialog.Title>
        <Dialog.Content>
          {/* Address Input */}
          <TextInput
            placeholder={I18n.t('EditBranch.placeholder_address')}
            mode="outlined"
            value={branchData?.address || ''}
            onChangeText={(text) =>
              setBranchData((prev: any) => ({ ...prev, address: text }))
            }
            style={styles.input}
            error={!!errors.address}
            placeholderTextColor="#202B1866"
            outlineStyle={{
              borderColor: '#91B275',
              borderWidth: 0,
              borderRadius: 16,
            }}
            contentStyle={{
              color: '#202B1866',
            }}
          />
          <HelperText type="error" visible={!!errors.address}>
            {errors.address}
          </HelperText>

          {/* Latitude Input */}
          <TextInput
            placeholder={I18n.t('EditBranch.placeholder_lat')}
            mode="outlined"
            value={branchData?.lat}
            onChangeText={(text) => {
              // Allows numbers, decimal, and minus sign
              const sanitizedValue = text.replace(/[^0-9\-.]/g, '');
              setBranchData((prev: any) => ({
                ...prev,
                lat: sanitizedValue,
              }));
            }}
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
            placeholder={I18n.t('EditBranch.placeholder_lng')}
            mode="outlined"
            value={branchData?.lng}
            onChangeText={(text) => {
              // Allows numbers, decimal, and minus sign
              const sanitizedValue = text.replace(/[^0-9\-.]/g, '');
              setBranchData((prev: any) => ({
                ...prev,
                lng: sanitizedValue,
              }));
            }}
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

          {/* Set as Default Switch */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {I18n.t('EditBranch.label_default_switch')}
            </Text>
            <Switch
              value={branchData?.is_default || false}
              onValueChange={(value) =>
                setBranchData((prev: any) => ({ ...prev, is_default: value }))
              }
              color="#96B76E"
              trackColor={{ false: '#96B76E', true: '#96B76E' }}
              thumbColor={'#fff'}
            />
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          {/* Cancel Button */}
          <Button onPress={onClose}>
            {I18n.t('BranchAdmins.cancel_button')}
          </Button>
          {/* Update Branch Button */}
          <Button
            mode="contained"
            onPress={handleUpdate}
            loading={isPending}
            disabled={isPending}
            style={{
              borderRadius: 16,
              height: 36,
              backgroundColor: '#96B76E',
            }}
            labelStyle={{
              color: '#fff',
              fontSize: 15,
            }}
          >
            {I18n.t('EditBranch.button_update_branch')}
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Snackbar for error/success messages */}
      <Snackbar
        visible={showSnackbar || !!errors.general}
        onDismiss={() => {
          setShowSnackbar(false);
          setErrors((prev) => ({ ...prev, general: '' }));
        }}
        duration={3000}
      >
        {showSnackbar
          ? I18n.t('EditBranch.snackbar_success')
          : I18n.t('EditBranch.snackbar_generic_error')}
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
  },
  switchText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#40392B',
  },
});
