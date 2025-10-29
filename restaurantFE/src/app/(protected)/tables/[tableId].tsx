import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Dimensions } from 'react-native';
import { Button, Text, Switch, Divider } from 'react-native-paper';
import { Dropdown, Option } from 'react-native-paper-dropdown';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useGetTableById,
  useUpdateTable,
} from '@/services/mutation/tableMutation';
import { useGetBranches } from '@/services/mutation/branchMutation';
import { Branch } from '@/types/branchType';
import { Table } from '@/types/tableTypes';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375; // iPhone SE
const isMediumScreen = width >= 375 && width < 768; // Most phones

export default function EditTableScreen() {
  const { tableId } = useLocalSearchParams();
  const [formValues, setFormValues] = useState<Table>({
    branch: '',
    is_fast_table: false,
    is_delivery_table: false,
    is_inside_table: false,
  });

  const { data: branches } = useGetBranches();
  const { data: tableData } = useGetTableById(tableId as string);
  const updateTable = useUpdateTable();

  useEffect(() => {
    if (tableData) {
      setFormValues({
        branch: (tableData.branch as Branch).id!,
        is_fast_table: tableData.is_fast_table,
        is_delivery_table: tableData.is_delivery_table,
        is_inside_table: tableData.is_inside_table,
      });
    }
  }, [tableData]);

  const handleFormChange = (key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const formData = { ...formValues };
      await updateTable.mutateAsync({ id: tableId as string, ...formData });
      router.back();
    } catch (error) {
      console.error('Error updating table:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {I18n.t('table_modal.title_edit')}
      </Text>

      {/* Branch Selection */}
      <View style={styles.dropdownContainer}>
        <Dropdown
          label={I18n.t('table_modal.branch_label')}
          placeholder={I18n.t('table_modal.branch_placeholder')}
          options={
            branches?.map((branch: any) => ({
              label: branch.address,
              value: branch.id,
            })) || []
          }
          value={formValues.branch.toString() || ''}
          onSelect={(value) => handleFormChange('branch', value)}
        />
      </View>

      {/* Switch Options */}
      <View style={styles.switchGroup}>
        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>
            {I18n.t('table_modal.fast_table')}
          </Text>
          <Switch
            value={formValues.is_fast_table}
            onValueChange={(value) => handleFormChange('is_fast_table', value)}
            style={styles.switchControl}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>
            {I18n.t('table_modal.delivery_table')}
          </Text>
          <Switch
            value={formValues.is_delivery_table}
            onValueChange={(value) =>
              handleFormChange('is_delivery_table', value)
            }
            style={styles.switchControl}
          />
        </View>

        <View style={styles.switchItem}>
          <Text style={styles.switchLabel}>
            {I18n.t('table_modal.inside_table')}
          </Text>
          <Switch
            value={formValues.is_inside_table}
            onValueChange={(value) =>
              handleFormChange('is_inside_table', value)
            }
            style={styles.switchControl}
          />
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Save Button */}
      <Button
        mode="contained"
        onPress={handleSave}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        {I18n.t('table_modal.save_changes')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: isSmallScreen ? 16 : isMediumScreen ? 24 : 32,
    paddingVertical: isSmallScreen ? 20 : 32,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    marginBottom: isSmallScreen ? 24 : 32,
    fontSize: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
    textAlign: 'center',
    fontWeight: '600',
    color: '#2D3748',
  },
  dropdownContainer: {
    marginBottom: isSmallScreen ? 24 : 32,
  },
  dropdownInput: {
    borderRadius: 8,
    paddingHorizontal: isSmallScreen ? 12 : 16,
  },
  dropdownItemText: {
    fontSize: isSmallScreen ? 14 : 16,
  },
  dropdownItemSelectedText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
  },
  switchGroup: {
    borderRadius: 12,
    padding: isSmallScreen ? 16 : 24,
    marginBottom: isSmallScreen ? 24 : 32,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 12 : 16,
  },
  switchLabel: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#4A5568',
    flex: 1,
    marginRight: 16,
  },
  switchControl: {
    transform: [{ scale: isSmallScreen ? 0.9 : 1 }],
  },
  divider: {
    marginVertical: isSmallScreen ? 16 : 24,
    backgroundColor: '#E2E8F0',
  },
  button: {
    borderRadius: 8,
    paddingVertical: isSmallScreen ? 8 : 12,
    width: isSmallScreen ? '100%' : 'auto',
    alignSelf: 'center',
    maxWidth: 400,
  },
  buttonLabel: {
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    paddingVertical: 4,
  },
});
