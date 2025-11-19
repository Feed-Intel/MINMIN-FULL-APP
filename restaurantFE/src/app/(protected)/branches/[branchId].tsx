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

  const { mutate: updateBranch, isPending } = useUpdateBranch(() => {
    onSuccess();
    setShowSnackbar(true);
    onClose();
  });

  useEffect(() => {
    if (branch) {
      setBranchData({
        id: branch.id,
        address: branch.address,
        is_default: branch.is_default,
        lat: String(branch.location?.lat || ''),
        lng: String(branch.location?.lng || ''),
        gps_coordinates: branch.gps_coordinates || '',
      });
    }
  }, [branch]);

  const validateForm = () => {
    const validationErrors: { [key: string]: string } = {};

    if (!branchData) return false;

    // Validate Address
    if (!branchData.address?.trim()) {
      validationErrors.address = I18n.t('EditBranch.error_address_required');
    } else if (branchData.address.trim().length < 3) {
      validationErrors.address = I18n.t('EditBranch.error_address_length');
    }

    // Validate Latitude
    if (!branchData.lat?.trim()) {
      validationErrors.lat = I18n.t('EditBranch.error_lat_required');
    } else {
      const latitude = parseFloat(branchData.lat.trim());
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        validationErrors.lat = I18n.t('EditBranch.error_lat_range');
      }
    }

    // Validate Longitude
    if (!branchData.lng?.trim()) {
      validationErrors.lng = I18n.t('EditBranch.error_lng_required');
    } else {
      const longitude = parseFloat(branchData.lng.trim());
      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        validationErrors.lng = I18n.t('EditBranch.error_lng_range');
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleUpdate = () => {
    if (validateForm() && branchData) {
      updateBranch({
        ...branchData,
        gps_coordinates: `${branchData.lat},${branchData.lng}`,
      });
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
            contentStyle={{ color: '#202B1866' }}
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
              const sanitizedValue = text.replace(/[^0-9\-.]/g, '');
              setBranchData((prev: any) => ({ ...prev, lat: sanitizedValue }));
            }}
            style={styles.input}
            error={!!errors.lat}
            placeholderTextColor="#202B1866"
            outlineStyle={{
              borderColor: '#91B275',
              borderWidth: 0,
              borderRadius: 16,
            }}
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
              const sanitizedValue = text.replace(/[^0-9\-.]/g, '');
              setBranchData((prev: any) => ({ ...prev, lng: sanitizedValue }));
            }}
            style={styles.input}
            error={!!errors.lng}
            placeholderTextColor="#202B1866"
            outlineStyle={{
              borderColor: '#91B275',
              borderWidth: 0,
              borderRadius: 16,
            }}
            keyboardType="numeric"
          />
          <HelperText type="error" visible={!!errors.lng}>
            {errors.lng}
          </HelperText>

          {/* Default Switch */}
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
              thumbColor="#fff"
            />
          </View>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onClose}>
            {I18n.t('BranchAdmins.cancel_button')}
          </Button>
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
            labelStyle={{ color: '#fff', fontSize: 15 }}
          >
            {I18n.t('EditBranch.button_update_branch')}
          </Button>
        </Dialog.Actions>
      </Dialog>

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
