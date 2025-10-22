import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [branchMenuVisible, setBranchMenuVisible] = useState(false);
  const [menuItemMenusVisible, setMenuItemMenusVisible] = useState<{
    [key: number]: boolean;
  }>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const queryClient = useQueryClient();
  const { data: branches } = useGetBranches(undefined, true);
  const { data: menuItems } = useGetMenus();
  const { mutateAsync: updateCombo, isPending } = useUpdateCombo();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;
  const { isBranch, branchId } = useRestaurantIdentity();

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

  useEffect(() => {
    if (isBranch && branchId) {
      setCombo((prev) => ({ ...prev, branch: branchId }));
    }
  }, [isBranch, branchId]);

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

    if (!combo.branch) {
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
          errors[
            `quantity_${index}`
          ] = `Quantity must be greater than 0 for item ${index + 1}.`;
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
        <Dialog.Title>Edit Combo</Dialog.Title>
        <Dialog.Content>
          <ScrollView>
            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.title}>
                  Combo Details
                </Text>

                <TextInput
                  label="Combo Name"
                  value={combo.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  style={styles.input}
                  error={!!errors.name}
                />
                <HelperText type="error" visible={!!errors.name}>
                  {errors.name}
                </HelperText>

                <TextInput
                  label="Combo Price"
                  value={combo.combo_price?.toString()}
                  style={styles.input}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const sanitizedValue = text.replace(/[^0-9\-,\.]/g, '');
                    handleInputChange('combo_price', sanitizedValue);
                  }}
                  error={!!errors.combo_price}
                />
                <HelperText type="error" visible={!!errors.combo_price}>
                  {errors.combo_price}
                </HelperText>

                {/* Branch Dropdown */}
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
                          mode="outlined"
                          style={styles.dropdownButton}
                          labelStyle={{
                            color: '#333',
                            fontSize: 14,
                            width: '100%',
                            textAlign: 'left',
                          }}
                          onPress={() => setBranchMenuVisible(true)}
                          contentStyle={{
                            flexDirection: 'row-reverse',
                            width: '100%',
                          }}
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
                      style={{ alignSelf: 'stretch' }}
                      anchorPosition="bottom"
                    >
                      {branches && branches.length > 0 ? (
                        branches.map((branch: any) => (
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
                <HelperText type="error" visible={!!errors.branch}>
                  {errors.branch}
                </HelperText>
              </Card.Content>
            </Card>

            <Card style={[styles.card, styles.dataTable]}>
              <Card.Content>
                <Text variant="titleLarge">Combo Items</Text>
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Menu Item</DataTable.Title>
                    <DataTable.Title
                      style={isSmallScreen && { paddingLeft: 6 }}
                    >
                      Qty
                    </DataTable.Title>
                    <DataTable.Title style={{ paddingLeft: 0 }}>
                      Half?
                    </DataTable.Title>
                    <DataTable.Title style={{ paddingLeft: 0 }}>
                      Actions
                    </DataTable.Title>
                  </DataTable.Header>

                  {combo.combo_items?.map((item, index) => (
                    <DataTable.Row key={index}>
                      <DataTable.Cell style={{ flex: 2 }}>
                        {/* Menu Item Dropdown */}
                        <View style={styles.dropdownContainer}>
                          <Menu
                            visible={menuItemMenusVisible[index] || false}
                            onDismiss={() => toggleMenuItemMenu(index, false)}
                            anchor={
                              <Button
                                mode="outlined"
                                style={styles.dropdownButton}
                                labelStyle={{
                                  color: '#333',
                                  fontSize: 14,
                                  width: '100%',
                                  textAlign: 'left',
                                }}
                                onPress={() => toggleMenuItemMenu(index, true)}
                                contentStyle={{
                                  flexDirection: 'row-reverse',
                                  width: '100%',
                                }}
                                icon={
                                  menuItemMenusVisible[index]
                                    ? 'chevron-up'
                                    : 'chevron-down'
                                }
                              >
                                {typeof item.menu_item === 'string' &&
                                item.menu_item
                                  ? menuItems?.find(
                                      (m: any) => m.id === item.menu_item
                                    )?.name
                                  : 'Select Menu Item'}
                              </Button>
                            }
                            contentStyle={[
                              styles.menuContent,
                              { width: '100%' },
                            ]}
                            style={{ alignSelf: 'stretch' }}
                            anchorPosition="bottom"
                          >
                            {menuItems && menuItems.length > 0 ? (
                              menuItems.map((menuItem: any) => (
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
                              <Menu.Item
                                title="No menu items available"
                                disabled
                              />
                            )}
                          </Menu>
                        </View>
                        <HelperText
                          type="error"
                          visible={!!errors[`menu_item_${index}`]}
                        >
                          {errors[`menu_item_${index}`]}
                        </HelperText>
                      </DataTable.Cell>

                      <DataTable.Cell style={{ flex: 1, paddingLeft: 6 }}>
                        <TextInput
                          keyboardType="numeric"
                          value={item.quantity.toString()}
                          onChangeText={(text) => {
                            const sanitizedValue = text.replace(
                              /[^0-9\-,\.]/g,
                              ''
                            );
                            handleItemChange(index, 'quantity', sanitizedValue);
                          }}
                          style={styles.quantityInput}
                          error={!!errors[`quantity_${index}`]}
                        />
                        <HelperText
                          type="error"
                          visible={!!errors[`quantity_${index}`]}
                        >
                          {errors[`quantity_${index}`]}
                        </HelperText>
                      </DataTable.Cell>

                      <DataTable.Cell style={{ flex: 0.7, paddingLeft: 0 }}>
                        <Checkbox
                          status={item.is_half ? 'checked' : 'unchecked'}
                          onPress={() =>
                            handleItemChange(index, 'is_half', !item.is_half)
                          }
                        />
                      </DataTable.Cell>

                      <DataTable.Cell style={{ flex: 0.7, paddingLeft: 0 }}>
                        <IconButton
                          icon="delete"
                          onPress={() => handleRemoveItem(index)}
                          size={24}
                        />
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable>

                <Button
                  icon="plus"
                  onPress={handleAddItem}
                  style={styles.addButton}
                >
                  Add Combo Item
                </Button>
              </Card.Content>
            </Card>
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    maxHeight: '90%',
    width: '90%',
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 600,
    marginVertical: 8,
  },
  title: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  dataTable: {
    marginTop: 16,
  },
  addButton: {
    marginTop: 16,
  },
  saveButton: {
    borderRadius: 8,
  },
  quantityInput: {
    width: 80,
  },
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdownButton: {
    // borderWidth: 1,
    // borderColor: '#E0E0E0',
    // borderRadius: 4,
    backgroundColor: '#96B76E',
    borderRadius: 16,
    width: '100%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  readonlyBranch: {
    backgroundColor: '#96B76E',
    borderRadius: 16,
    width: '100%',
    minHeight: 36,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: '#fff',
    textAlign: 'left',
  },
  menuContent: {
    backgroundColor: '#fff',
  },
  menuItem: {
    fontSize: 14,
  },
});
