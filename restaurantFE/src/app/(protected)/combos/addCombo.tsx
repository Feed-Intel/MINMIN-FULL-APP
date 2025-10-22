import React, { useEffect, useMemo, useState } from 'react';
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
} from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';
import { Combo } from '@/types/comboTypes';
import { MenuType } from '@/types/menuType';
import { useGetBranches } from '@/services/mutation/branchMutation';
import { useGetMenus } from '@/services/mutation/menuMutation';
import { useCreateCombo } from '@/services/mutation/comboMutation';
import { Switch } from 'react-native';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';

type ComboItem = {
  menu_item: string | MenuType;
  quantity: number;
  is_half: boolean;
};

interface AddComboDialogProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddComboDialog({
  visible,
  onClose,
}: AddComboDialogProps) {
  const [combo, setCombo] = useState<
    Partial<Combo & { combo_items: ComboItem[] }>
  >({
    name: '',
    branch: '',
    combo_price: 0,
    combo_items: [{ menu_item: '', quantity: 1, is_half: false }],
  });
  const [applyToAllBranches, setApplyToAllBranches] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [branchMenuVisible, setBranchMenuVisible] = useState(false);
  const [menuItemMenusVisible, setMenuItemMenusVisible] = useState<{
    [key: number]: boolean;
  }>({});

  const queryClient = useQueryClient();
  const { data: branches } = useGetBranches();
  const { data: menuItems } = useGetMenus();
  const { mutateAsync: saveCombo, isPending } = useCreateCombo();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;
  const { isBranch, branchId } = useRestaurantIdentity();

  const defaultBranchId = useMemo(() => {
    if (isBranch && branchId) return branchId;
    return branches?.[0]?.id ?? '';
  }, [isBranch, branchId, branches]);

  useEffect(() => {
    if (visible) {
      setApplyToAllBranches(!isBranch);
      setCombo((prev) => ({
        ...prev,
        branch: defaultBranchId,
      }));
    }
  }, [visible, isBranch, defaultBranchId]);

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
    if (validateForm()) {
      try {
        await saveCombo(combo);
        queryClient.invalidateQueries({ queryKey: ['combos'] });
        onClose();
      } catch (error) {
        console.error('Error saving combo:', error);
        setErrors({ general: 'Failed to save combo. Please try again.' });
      }
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        {/* <Dialog.Title>Add Combo</Dialog.Title> */}
        <Dialog.Content>
          <ScrollView>
            {/* <Card style={styles.card}> */}
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>
                Combo Details
              </Text>

              <TextInput
                placeholder="Combo Name"
                value={combo.name}
                onChangeText={(text) => handleInputChange('name', text)}
                style={styles.input}
                error={!!errors.name}
                mode="outlined"
                outlineStyle={{
                  borderColor: '#91B275',
                  borderWidth: 0,
                  borderRadius: 16,
                }}
                placeholderTextColor="#202B1866"
                contentStyle={{
                  color: '#202B1866',
                }}
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
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
                <>
                  {/* Updated Branch Dropdown */}
                  <View style={styles.dropdownContainer}>
                    {isBranch ? (
                      <Text style={styles.readonlyBranch}>
                        {branches?.results.find(
                          (b: any) => b.id === defaultBranchId
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
                              ? branches?.find(
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
                </>
              )}
              <TextInput
                placeholder="Combo Price"
                value={combo.combo_price?.toString()}
                style={styles.input}
                keyboardType="numeric"
                onChangeText={(text) => {
                  const sanitizedValue = text.replace(/[^0-9\-,\.]/g, '');
                  handleInputChange('combo_price', sanitizedValue);
                }}
                error={!!errors.combo_price}
                mode="outlined"
                contentStyle={{
                  color: '#202B1866',
                }}
                outlineStyle={{
                  borderColor: '#91B275',
                  borderWidth: 0,
                  borderRadius: 16,
                }}
                placeholderTextColor="#202B1866"
              />
              <HelperText type="error" visible={!!errors.combo_price}>
                {errors.combo_price}
              </HelperText>
            </Card.Content>
            {/* </Card> */}

            {/* <Card style={[styles.card, styles.dataTable]}> */}
            <Card.Content>
              <DataTable>
                <DataTable.Header
                  style={{ borderBottomWidth: 1, borderColor: '#91B275' }}
                >
                  <DataTable.Title>
                    {' '}
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '400',
                        color: '#40392B',
                      }}
                    >
                      Menu Item
                    </Text>
                  </DataTable.Title>
                  <DataTable.Title style={isSmallScreen && { paddingLeft: 6 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '400',
                        color: '#40392B',
                      }}
                    >
                      Qty
                    </Text>
                  </DataTable.Title>
                  <DataTable.Title style={{ paddingLeft: 0 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '400',
                        color: '#40392B',
                      }}
                    >
                      Half?
                    </Text>
                  </DataTable.Title>
                  <DataTable.Title style={{ paddingLeft: 0 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '400',
                        color: '#40392B',
                      }}
                    >
                      Actions
                    </Text>
                  </DataTable.Title>
                </DataTable.Header>

                {combo.combo_items?.map((item, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>
                      {/* Updated Menu Item Dropdown */}
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
                                fontSize: 13,
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
                                : 'Menu Item'}
                            </Button>
                          }
                          contentStyle={[styles.menuContent, { width: '100%' }]}
                          style={{ alignSelf: 'flex-start' }}
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
                        mode="outlined"
                        outlineStyle={{
                          borderColor: '#91B275',
                          borderWidth: 0,
                          borderRadius: 16,
                        }}
                        placeholderTextColor="#202B1866"
                        contentStyle={{
                          color: '#202B1866',
                        }}
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
                        color="#91B275"
                        uncheckedColor="#91B275"
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
            {/* </Card> */}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          {/* <Button onPress={onClose}>Cancel</Button> */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isPending}
            style={styles.saveButton}
            disabled={isPending}
            labelStyle={{
              color: '#fff',
              fontSize: 17,
              fontWeight: '400',
            }}
          >
            Save Combo
          </Button>
        </Dialog.Actions>
      </Dialog>
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
  title: {
    marginBottom: 16,
    fontSize: 17,
    fontWeight: '400',
    color: '#40392B',
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
  dataTable: {
    marginTop: 16,
  },
  addButton: {
    marginTop: 16,
  },
  saveButton: {
    borderRadius: 16,
    backgroundColor: '#96B76E',
    width: '100%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityInput: {
    backgroundColor: '#EBF1E6',
    width: 80,
  },
  dropdownContainer: {
    marginBottom: 2,
  },
  readonlyBranch: {
    backgroundColor: '#EBF1E6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#202B18',
    borderWidth: 0,
  },
  dropdownButton: {
    // borderWidth: 1,
    // borderColor: '#E0E0E0',
    // borderRadius: 4,
    backgroundColor: '#EBF1E6',
    borderWidth: 0,
    borderColor: '#EBF1E6',
  },
  menuContent: {
    backgroundColor: '#EBF1E6',
  },
  menuItem: {
    fontSize: 14,
    color: '#202B1866',
  },
});
