import React, { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Button, Text, Switch, Divider } from 'react-native-paper';
import { Dropdown, Option } from 'react-native-paper-dropdown';
import { router } from 'expo-router';
import { useCreateTable } from '@/services/mutation/tableMutation';
import { useGetBranches } from '@/services/mutation/branchMutation';
import { useQueryClient } from '@tanstack/react-query';
import { i18n as I18n } from '@/app/_layout';

export default function AddTableScreen() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;
  const isMediumScreen = width >= 600 && width < 1024;
  const [formValues, setFormValues] = useState({
    branch: '',
    is_fast_table: false,
    is_delivery_table: false,
    is_inside_table: false,
  });

  const { data: branches } = useGetBranches();
  const createTable = useCreateTable();
  const queryClient = useQueryClient();

  const handleFormChange = (key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const formData = {
        ...formValues,
      };

      await createTable.mutateAsync(formData);
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['qrCode'] });
      router.back();
    } catch (error) {
      console.error('Error creating table:', error);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          padding: isSmallScreen ? 12 : 24,
          width: isSmallScreen ? '100%' : isMediumScreen ? '75%' : '50%',
        },
      ]}
    >
      <Text
        variant={isSmallScreen ? 'titleLarge' : 'headlineMedium'}
        style={[styles.title, { textAlign: isSmallScreen ? 'center' : 'left' }]}
      >
        {I18n.t('table_modal.title')}
      </Text>

      {/* Branch Selection */}
      <View style={styles.input}>
        <Dropdown
          label={I18n.t('table_modal.branch_label')}
          placeholder={I18n.t('table_modal.branch_placeholder')}
          options={
            branches?.map((branch: any) => ({
              label: branch.address,
              value: branch.id,
            })) || []
          }
          value={formValues.branch}
          onSelect={(value) => handleFormChange('branch', value)}
        />
      </View>

      {/* Switch Options */}
      <View style={styles.switchGroup}>
        <View
          style={[
            styles.switchItem,
            {
              paddingVertical: isSmallScreen ? 8 : 12,
              flexDirection: isSmallScreen ? 'column' : 'row',
            },
          ]}
        >
          <Text style={{ marginBottom: isSmallScreen ? 4 : 0 }}>
            {I18n.t('table_modal.fast_table')}
          </Text>
          <Switch
            value={formValues.is_fast_table}
            onValueChange={(value) => handleFormChange('is_fast_table', value)}
          />
        </View>

        <View
          style={[
            styles.switchItem,
            {
              paddingVertical: isSmallScreen ? 8 : 12,
              flexDirection: isSmallScreen ? 'column' : 'row',
            },
          ]}
        >
          <Text style={{ marginBottom: isSmallScreen ? 4 : 0 }}>
            {I18n.t('table_modal.delivery_table')}
          </Text>
          <Switch
            value={formValues.is_delivery_table}
            onValueChange={(value) =>
              handleFormChange('is_delivery_table', value)
            }
          />
        </View>

        <View
          style={[
            styles.switchItem,
            {
              paddingVertical: isSmallScreen ? 8 : 12,
              flexDirection: isSmallScreen ? 'column' : 'row',
            },
          ]}
        >
          <Text style={{ marginBottom: isSmallScreen ? 4 : 0 }}>
            {I18n.t('table_modal.inside_table')}
          </Text>
          <Switch
            value={formValues.is_inside_table}
            onValueChange={(value) =>
              handleFormChange('is_inside_table', value)
            }
          />
        </View>
      </View>

      <Divider
        style={[styles.divider, { marginVertical: isSmallScreen ? 12 : 24 }]}
      />

      {/* Save Button */}
      <Button
        mode="contained"
        onPress={handleSave}
        style={[
          styles.button,
          {
            width: isSmallScreen ? '100%' : '50%',
            alignSelf: 'center',
            paddingVertical: isSmallScreen ? 6 : 8,
          },
        ]}
        labelStyle={{ fontSize: isSmallScreen ? 14 : 16 }}
      >
        {I18n.t('table_modal.save_button')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    marginBottom: 24,
  },
  switchGroup: {
    marginBottom: 24,
  },
  switchItem: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 24,
  },
  button: {
    marginTop: 24,
  },
});
