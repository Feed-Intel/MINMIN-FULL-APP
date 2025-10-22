import React, { useEffect, useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  DataTable,
  Checkbox,
  IconButton,
  Text,
  HelperText,
  Portal,
  Dialog,
  Menu,
  Snackbar,
} from 'react-native-paper';
import { Switch } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Combo } from '@/types/comboTypes';
import { MenuType } from '@/types/menuType';
import { useGetBranches } from '@/services/mutation/branchMutation';
import { useGetMenus } from '@/services/mutation/menuMutation';
import { useUpdateCombo } from '@/services/mutation/comboMutation';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';

type ComboItem = {
  menu_item: string | MenuType;
  quantity: number;
  is_half: boolean;
};

interface EditComboDialogProps {
  visible: boolean;
  combo: any;
  onClose: () => void;
}

export default function EditComboDialog({
  visible,
  combo: initialCombo,
  onClose,
}: EditComboDialogProps) {
  const [combo, setCombo] = useState<
    Partial<Combo & { combo_items: ComboItem[] }>
  >({
    name: '',
    branch: '',
    combo_price: 0,
    combo_items: [{ menu_item: '', quantity: 1, is_half: false }],
  });
  const [applyToAllBranches, setApplyToAllBranches] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [branchMenuVisible, setBranchMenuVisible] = useState(false);
  const [menuItemMenusVisible, setMenuItemMenusVisible] = useState<{
    [key: number]: boolean;
  }>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const queryClient = useQueryClient();
  const { data: branches } = useGetBranches();
  const { data: menuItems } = useGetMenus();
  const { mutateAsync: updateCombo, isPending } = useUpdateCombo();
  const { width } = useWindowDimensions();
  const { isBranch, branchId } = useRestaurantIdentity();

  const defaultBranchId = useMemo(() => {
    if (isBranch && branchId) return branchId;
    return branches?.results?.[0]?.id ?? '';
  }, [isBranch, branchId, branches]);

  useEffect(() => {
    if (initialCombo) {
      setCombo({
        ...initialCombo,
        branch: initialCombo.branch?.id || initialCombo.branch,
        combo_items: initialCombo.combo_items?.map((item: any) => ({
          ...item,
          menu_item: item.menu_item?.id || item.menu_item,
        })),
      });
    }
  }, [initialCombo]);

  const handleInputChange = (field: keyof Combo, value: any) => {
    setCombo((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (
    index: number,
    field: keyof ComboItem,
    value: any
  ) => {
    const updatedItems = [...(combo.combo_items ?? [])] as ComboItem[];
    updatedItems[index][field] = value as never;
    setCombo({ ...combo, combo_items: updatedItems });
  };

  const handleAddItem = () => {
    setCombo((prev) => ({
      ...prev,
      combo_items: [
        ...(prev.combo_items ?? []),
        { menu_item: '', quantity: 1, is_half: false },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...(combo.combo_items ?? [])];
    updatedItems.splice(index, 1);
    setCombo({ ...combo, combo_items: updatedItems });
  };

  const toggleMenuItemMenu = (index: number, visible: boolean) => {
    setMenuItemMenusVisible((prev) => ({
      ...prev,
      [index]: visible,
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!combo.name?.trim()) {
      errors.name = 'Combo name is required.';
    } else if (combo.name.trim().length < 3) {
      errors.name = 'Combo name must be at least 3 characters long.';
    }

    if (!applyToAllBranches && !combo.branch) {
      errors.branch = 'Branch selection is required.';
    }

    if ((combo.combo_price ?? 0) <= 0) {
      errors.combo_price = 'Combo price must be greater than 0.';
    }

    if (!combo.combo_items || combo.combo_items.length === 0) {
      errors.combo_items = 'At least one combo item is required.';
    } else {
      combo.combo_items.forEach((item, index) => {
        if (!item.menu_item) {
          errors[`menu_item_${index}`] = `Menu item is required for item ${
            index + 1
          }.`;
        }
        if (item.quantity <= 0) {
          errors[`quantity_${index}`] = `Quantity must be greater than 0.`;
        }
      });
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await updateCombo({
        ...combo,
        branch:
          typeof combo.branch === 'object' ? combo.branch.id : combo.branch,
        combo_items: combo.combo_items?.map((item) => ({
          ...item,
          menu_item:
            typeof item.menu_item === 'object'
              ? item.menu_item.id
              : item.menu_item,
        })),
      });
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      setSnackbarVisible(true);
      onClose();
    } catch (error) {
      console.error('Error updating combo:', error);
      setErrors({ general: 'Failed to update combo. Please try again.' });
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Content>
          <ScrollView>
            <Card.Content>
              <Text style={styles.title}>Edit Combo Details</Text>

              <TextInput
                placeholder="Combo Name"
                value={combo.name}
                onChangeText={(text) => handleInputChange('name', text)}
                style={styles.input}
                error={!!errors.name}
                mode="outlined"
                outlineStyle={styles.outline}
                placeholderTextColor="#202B1866"
                contentStyle={{ color: '#202B1866' }}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>

              <TextInput
                placeholder="Combo Price"
                value={combo.combo_price?.toString()}
                keyboardType="numeric"
                onChangeText={(text) => {
                  const sanitizedValue = text.replace(/[^0-9.,-]/g, '');
                  handleInputChange('combo_price', sanitizedValue);
                }}
                style={styles.input}
                error={!!errors.combo_price}
                mode="outlined"
                outlineStyle={styles.outline}
                placeholderTextColor="#202B1866"
              />
              <HelperText type="error" visible={!!errors.combo_price}>
                {errors.combo_price}
              </HelperText>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Apply to All Branches</Text>
                <Switch
                  value={applyToAllBranches}
                  onValueChange={(value) => setApplyToAllBranches(value)}
                  trackColor={{ false: '#96B76E', true: '#96B76E' }}
                  thumbColor={'#fff'}
                  disabled={isBranch}
                />
              </View>

              {!applyToAllBranches && (
                <View style={styles.dropdownContainer}>
                  {isBranch ? (
                    <Text style={styles.readonlyBranch}>
                      {branches?.results.find(
                        (b: any) => b.id === (branchId ?? combo.branch)
                      )?.address ?? 'Assigned Branch'}
                    </Text>
                  ) : (
                    <Menu
                      visible={branchMenuVisible}
                      onDismiss={() => setBranchMenuVisible(false)}
                      anchor={
                        <Button
                          mode="text"
                          style={styles.dropdownButton}
                          labelStyle={styles.dropdownLabel}
                          onPress={() => setBranchMenuVisible(true)}
                          contentStyle={styles.dropdownContent}
                          icon={
                            branchMenuVisible ? 'chevron-up' : 'chevron-down'
                          }
                        >
                          {combo.branch
                            ? branches?.results.find(
                                (b: any) => b.id === combo.branch
                              )?.address
                            : 'Select Branch'}
                        </Button>
                      }
                      contentStyle={[styles.menuContent, { width: '100%' }]}
                    >
                      {branches?.results && branches.results.length > 0 ? (
                        branches.results.map((branch: any) => (
                          <Menu.Item
                            key={branch.id}
                            onPress={() => {
                              handleInputChange('branch', branch.id);
                              setBranchMenuVisible(false);
                            }}
                            title={branch.address}
                            titleStyle={styles.menuItem}
                          />
                        ))
                      ) : (
                        <Menu.Item title="No branches available" disabled />
                      )}
                    </Menu>
                  )}
                </View>
              )}

              <Text style={styles.subtitle}>Combo Items</Text>

              <DataTable style={styles.dataTable}>
                <DataTable.Header>
                  <DataTable.Title>Menu Item</DataTable.Title>
                  <DataTable.Title>Qty</DataTable.Title>
                  <DataTable.Title>Half?</DataTable.Title>
                  <DataTable.Title>Actions</DataTable.Title>
                </DataTable.Header>

                {combo.combo_items?.map((item, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell style={{ flex: 1 }}>
                      <Menu
                        visible={menuItemMenusVisible[index] || false}
                        onDismiss={() => toggleMenuItemMenu(index, false)}
                        anchor={
                          <Button
                            mode="text"
                            style={styles.dropdownButton}
                            onPress={() => toggleMenuItemMenu(index, true)}
                            icon={
                              menuItemMenusVisible[index]
                                ? 'chevron-up'
                                : 'chevron-down'
                            }
                          >
                            {item.menu_item
                              ? menuItems?.results.find(
                                  (m: any) => m.id === item.menu_item
                                )?.name
                              : 'Select Menu Item'}
                          </Button>
                        }
                      >
                        {menuItems?.results && menuItems.results.length > 0 ? (
                          menuItems.results.map((menuItem: any) => (
                            <Menu.Item
                              key={menuItem.id}
                              onPress={() => {
                                handleItemChange(
                                  index,
                                  'menu_item',
                                  menuItem.id
                                );
                                toggleMenuItemMenu(index, false);
                              }}
                              title={menuItem.name}
                              titleStyle={styles.menuItem}
                            />
                          ))
                        ) : (
                          <Menu.Item title="No menu items available" disabled />
                        )}
                      </Menu>
                    </DataTable.Cell>

                    <DataTable.Cell>
                      <TextInput
                        keyboardType="numeric"
                        value={item.quantity.toString()}
                        onChangeText={(text) =>
                          handleItemChange(
                            index,
                            'quantity',
                            text.replace(/[^0-9]/g, '')
                          )
                        }
                        style={styles.quantityInput}
                        mode="outlined"
                        outlineStyle={styles.outline}
                      />
                    </DataTable.Cell>

                    <DataTable.Cell>
                      <Checkbox
                        status={item.is_half ? 'checked' : 'unchecked'}
                        onPress={() =>
                          handleItemChange(index, 'is_half', !item.is_half)
                        }
                      />
                    </DataTable.Cell>

                    <DataTable.Cell>
                      <IconButton
                        icon="delete"
                        onPress={() => handleRemoveItem(index)}
                      />
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>

              <Button icon="plus" onPress={handleAddItem}>
                Add Combo Item
              </Button>
            </Card.Content>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button onPress={onClose}>Cancel</Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isPending}
            style={styles.saveButton}
            disabled={isPending}
          >
            Save Combo
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        Combo updated successfully!
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
  outline: {
    borderColor: '#91B275',
    borderWidth: 0,
    borderRadius: 16,
  },
  title: {
    marginBottom: 16,
    fontSize: 17,
    fontWeight: '400',
    color: '#40392B',
  },
  subtitle: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '500',
    color: '#40392B',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchText: {
    marginRight: 8,
    fontSize: 11,
    fontWeight: '400',
    color: '#40392B',
  },
  dropdownContainer: {
    marginBottom: 2,
  },
  dropdownButton: {
    backgroundColor: '#EBF1E6',
    borderWidth: 0,
    borderColor: '#EBF1E6',
  },
  dropdownLabel: {
    color: '#333',
    fontSize: 14,
    width: '100%',
    textAlign: 'left',
  },
  dropdownContent: {
    flexDirection: 'row-reverse',
    width: '100%',
  },
  readonlyBranch: {
    backgroundColor: '#EBF1E6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#202B18',
    borderWidth: 0,
  },
  menuContent: {
    backgroundColor: '#EBF1E6',
  },
  menuItem: {
    fontSize: 14,
    color: '#202B1866',
  },
  dataTable: {
    marginTop: 16,
  },
  quantityInput: {
    backgroundColor: '#EBF1E6',
    width: 80,
  },
  saveButton: {
    borderRadius: 16,
    backgroundColor: '#96B76E',
    width: '100%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
