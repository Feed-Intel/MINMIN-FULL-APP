import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Snackbar,
  Appbar,
  ActivityIndicator,
  HelperText,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { BranchAdmin } from '@/types/branchAdmin';
import {
  useGetBranchAdmin,
  useUpdateBranchAdmin,
} from '@/services/mutation/branchAdminMutation';
import { Dropdown } from 'react-native-paper-dropdown';
import validator from 'validator';
import { useGetBranches } from '@/services/mutation/branchMutation';
import { i18n as I18n } from '@/app/_layout';

export default function EditAdminScreen() {
  const navigation = useRouter();
  const { adminId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [updateBranchAdmin, setUpdateBranchAdmin] = useState<BranchAdmin>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const { width } = useWindowDimensions();

  const {
    data: admin,
    isLoading: isFetching,
    isSuccess,
  } = useGetBranchAdmin(Array.isArray(adminId) ? adminId[0] : adminId);
  const { data: branches } = useGetBranches();

  useEffect(() => {
    if (isSuccess) {
      setUpdateBranchAdmin({
        ...admin,
        branch: (typeof admin.branch === 'object'
          ? admin.branch.id
          : admin.branch) as any,
      });
    }
  }, [isSuccess]);

  const onSuccessEdit = () => {
    queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
    setSnackbarVisible(true);
    navigation.back();
  };

  const onErrorEdit = () => {
    setErrors({ general: I18n.t('EditAdminScreen.error_general_failed') });
  };

  const { mutate: editBranchAdmin, isPending: isUpdating } =
    useUpdateBranchAdmin();

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (
      !updateBranchAdmin?.full_name?.trim() ||
      !validator.isAlpha(updateBranchAdmin?.full_name?.trim())
    ) {
      errors.full_name = I18n.t('EditAdminScreen.error_fullname_required');
    }

    if (!updateBranchAdmin?.email?.trim()) {
      errors.email = I18n.t('EditAdminScreen.error_email_required');
    } else if (!validator.isEmail(updateBranchAdmin.email)) {
      errors.email = I18n.t('EditAdminScreen.error_email_invalid');
    }

    if (!updateBranchAdmin?.phone?.trim()) {
      errors.phone = I18n.t('EditAdminScreen.error_phone_required');
    } else if (
      updateBranchAdmin.phone.length < 10 ||
      updateBranchAdmin.phone.length > 15
    ) {
      errors.phone = I18n.t('EditAdminScreen.error_phone_length');
    }

    if (!updateBranchAdmin?.branch) {
      errors.branch = I18n.t('EditAdminScreen.error_branch_required');
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditAdmin = () => {
    if (validateForm()) {
      if (updateBranchAdmin?.branch) {
        editBranchAdmin({ ...admin, ...updateBranchAdmin });
      } else {
        setErrors({
          ...errors,
          branch: I18n.t('EditAdminScreen.error_branch_required'),
        });
      }
    }
  };

  if (isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />{' '}
      </View>
    );
  }

  return (
    <>
      {' '}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.back()} />{' '}
        <Appbar.Content title={I18n.t('EditAdminScreen.screen_title')} />{' '}
      </Appbar.Header>{' '}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {' '}
        <View
          style={[
            styles.container,
            {
              width: width > 768 ? '50%' : '90%',
            },
          ]}
        >
          {' '}
          <TextInput
            label={I18n.t('EditAdminScreen.label_fullname')}
            value={updateBranchAdmin?.full_name || ''}
            onChangeText={(text) =>
              setUpdateBranchAdmin((prevState) =>
                prevState ? { ...prevState, full_name: text } : undefined
              )
            }
            style={styles.input}
            mode="outlined"
            error={!!errors.full_name}
          />{' '}
          <HelperText type="error" visible={!!errors.full_name}>
            {errors.full_name}{' '}
          </HelperText>{' '}
          <TextInput
            label={I18n.t('EditAdminScreen.label_email')}
            value={updateBranchAdmin?.email || ''}
            onChangeText={(text) =>
              setUpdateBranchAdmin((prevState) =>
                prevState ? { ...prevState, email: text } : undefined
              )
            }
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            error={!!errors.email}
          />{' '}
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}{' '}
          </HelperText>{' '}
          <TextInput
            label={I18n.t('EditAdminScreen.label_phone')}
            value={updateBranchAdmin?.phone || ''}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              setUpdateBranchAdmin((prevState) =>
                prevState ? { ...prevState, phone: numericValue } : undefined
              );
            }}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
            error={!!errors.phone}
          />{' '}
          <HelperText type="error" visible={!!errors.phone}>
            {errors.phone}{' '}
          </HelperText>{' '}
          <Dropdown
            label={I18n.t('EditAdminScreen.label_branch')}
            placeholder={I18n.t('EditAdminScreen.placeholder_branch')}
            options={
              branches?.map((branch: any) => ({
                label: branch.address,
                value: branch.id,
              })) || []
            }
            value={
              typeof updateBranchAdmin?.branch === 'object'
                ? updateBranchAdmin.branch.id
                : updateBranchAdmin?.branch
            }
            onSelect={(value) =>
              setUpdateBranchAdmin((prevState) =>
                prevState ? { ...prevState, branch: value || '' } : undefined
              )
            }
          />{' '}
          <HelperText type="error" visible={!!errors.branch}>
            {errors.branch}{' '}
          </HelperText>{' '}
          {errors.general && (
            <Snackbar
              visible
              onDismiss={() => setErrors({ ...errors, general: '' })}
            >
              {errors.general}{' '}
            </Snackbar>
          )}{' '}
          <Button
            mode="contained"
            onPress={handleEditAdmin}
            loading={isUpdating}
            style={styles.button}
            disabled={isUpdating}
          >
            {I18n.t('EditAdminScreen.button_save_changes')}{' '}
          </Button>{' '}
        </View>{' '}
      </ScrollView>{' '}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {I18n.t('EditAdminScreen.snackbar_success')}{' '}
      </Snackbar>{' '}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
