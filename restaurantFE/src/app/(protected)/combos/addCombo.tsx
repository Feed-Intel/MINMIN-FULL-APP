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
import { i18n as I18n } from '@/app/_layout';

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
  const { mutate: saveCombo, isPending } = useCreateCombo();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;
  const { isBranch, branchId } = useRestaurantIdentity();

  const defaultBranchId = useMemo(() => {
    if (isBranch && branchId) return branchId;
    return branches?.results?.[0]?.id ?? '';
  }, [isBranch, branchId, branches]);

  useEffect(() => {
    if (visible) {
      setApplyToAllBranches(!isBranch);
      setCombo((prev) => ({ ...prev, branch: defaultBranchId }));
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
    const updatedItems = [...(combo.combo_items ?? [])];
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
    setMenuItemMenusVisible((prev) => ({ ...prev, [index]: visible }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!combo.name?.trim()) {
      errors.name = I18n.t('comboDialog.errorComboNameRequired');
    } else if (combo.name.trim().length < 3) {
      errors.name = I18n.t('comboDialog.errorComboNameTooShort');
    }

    if (!applyToAllBranches && !combo.branch) {
      errors.branch = I18n.t('comboDialog.errorBranchRequired');
    }

    if ((combo.combo_price ?? 0) <= 0) {
      errors.combo_price = I18n.t('comboDialog.errorComboPriceInvalid');
    }

    if (!combo.combo_items || combo.combo_items.length === 0) {
      errors.combo_items = I18n.t('comboDialog.errorComboItemsRequired');
    } else {
      combo.combo_items.forEach((item, index) => {
        if (!item.menu_item)
          errors[`menu_item_${index}`] = I18n.t(
            'comboDialog.errorMenuItemRequired'
          );
        if (item.quantity <= 0)
          errors[`quantity_${index}`] = I18n.t(
            'comboDialog.errorQuantityInvalid'
          );
      });
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await saveCombo(combo);
      queryClient.invalidateQueries({ queryKey: ['combos'] });
      onClose();
    } catch (error) {
      console.error('Error saving combo:', error);
      setErrors({ general: 'Failed to save combo. Please try again.' });
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Content>
          <ScrollView>
            <Card.Content>
              <Text variant="titleLarge" style={styles.title}>
                {I18n.t('comboDialog.comboDetailsTitle')}
              </Text>

              <TextInput
                placeholder={I18n.t('comboDialog.comboNamePlaceholder')}
                value={combo.name}
                onChangeText={(text) => handleInputChange('name', text)}
                style={styles.input}
                error={!!errors.name}
                mode="outlined"
                outlineStyle={styles.outline}
                placeholderTextColor="#202B1866"
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {I18n.t('comboDialog.applyToAllBranchesLabel')}
                </Text>
                <Switch
                  value={applyToAllBranches}
                  onValueChange={setApplyToAllBranches}
                  trackColor={{ false: '#96B76E', true: '#96B76E' }}
                  thumbColor="#fff"
                  disabled={isBranch}
                />
              </View>

              {!applyToAllBranches && (
                <View style={styles.dropdownContainer}>
                  {isBranch ? (
                    <Text style={styles.readonlyBranch}>
                      {branches?.results.find((b) => b.id === defaultBranchId)
                        ?.address ??
                        I18n.t('comboDialog.assignedBranchReadonly')}
                    </Text>
                  ) : (
                    <Menu
                      visible={branchMenuVisible}
                      onDismiss={() => setBranchMenuVisible(false)}
                      anchor={
                        <Button
                          mode="text"
                          style={styles.dropdownButton}
                          onPress={() => setBranchMenuVisible(true)}
                          icon={
                            branchMenuVisible ? 'chevron-up' : 'chevron-down'
                          }
                        >
                          {combo.branch
                            ? branches?.results.find(
                                (b) => b.id === combo.branch
                              )?.address
                            : I18n.t('comboDialog.selectBranchButton')}
                        </Button>
                      }
                    >
                      {branches?.results?.length ? (
                        branches.results.map((branch) => (
                          <Menu.Item
                            key={branch.id}
                            onPress={() => {
                              handleInputChange('branch', branch.id);
                              setBranchMenuVisible(false);
                            }}
                            title={branch.address}
                          />
                        ))
                      ) : (
                        <Menu.Item
                          title={I18n.t('comboDialog.noBranchesAvailable')}
                          disabled
                        />
                      )}
                    </Menu>
                  )}
                  <HelperText type="error" visible={!!errors.branch}>
                    {errors.branch}
                  </HelperText>
                </View>
              )}

              <TextInput
                placeholder={I18n.t('comboDialog.comboPricePlaceholder')}
                value={combo.combo_price?.toString()}
                keyboardType="numeric"
                onChangeText={(text) =>
                  handleInputChange(
                    'combo_price',
                    text.replace(/[^0-9\-,\.]/g, '')
                  )
                }
                style={styles.input}
                error={!!errors.combo_price}
                mode="outlined"
                outlineStyle={styles.outline}
                placeholderTextColor="#202B1866"
              />
              <HelperText type="error" visible={!!errors.combo_price}>
                {errors.combo_price}
              </HelperText>
            </Card.Content>

            <Card.Content>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>
                    {I18n.t('comboDialog.menuItemHeader')}
                  </DataTable.Title>
                  <DataTable.Title>
                    {I18n.t('comboDialog.quantityHeader')}
                  </DataTable.Title>
                  <DataTable.Title>
                    {I18n.t('comboDialog.isHalfHeader')}
                  </DataTable.Title>
                  <DataTable.Title>
                    {I18n.t('comboDialog.actionsHeader')}
                  </DataTable.Title>
                </DataTable.Header>

                {combo.combo_items?.map((item, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>
                      <Menu
                        visible={menuItemMenusVisible[index] || false}
                        onDismiss={() => toggleMenuItemMenu(index, false)}
                        anchor={
                          <Button
                            mode="outlined"
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
                                  (m) => m.id === item.menu_item
                                )?.name
                              : I18n.t('comboDialog.menuItemDropdownDefault')}
                          </Button>
                        }
                      >
                        {menuItems?.results?.length ? (
                          menuItems.results.map((menuItem) => (
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
                            />
                          ))
                        ) : (
                          <Menu.Item
                            title={I18n.t('comboDialog.noMenuItemsAvailable')}
                            disabled
                          />
                        )}
                      </Menu>
                      <HelperText
                        type="error"
                        visible={!!errors[`menu_item_${index}`]}
                      >
                        {errors[`menu_item_${index}`]}
                      </HelperText>
                    </DataTable.Cell>

                    <DataTable.Cell>
                      <TextInput
                        keyboardType="numeric"
                        value={item.quantity.toString()}
                        onChangeText={(text) =>
                          handleItemChange(
                            index,
                            'quantity',
                            text.replace(/[^0-9\-,\.]/g, '')
                          )
                        }
                        style={styles.quantityInput}
                        error={!!errors[`quantity_${index}`]}
                        mode="outlined"
                        outlineStyle={styles.outline}
                      />
                      <HelperText
                        type="error"
                        visible={!!errors[`quantity_${index}`]}
                      >
                        {errors[`quantity_${index}`]}
                      </HelperText>
                    </DataTable.Cell>

                    <DataTable.Cell>
                      <Checkbox
                        status={item.is_half ? 'checked' : 'unchecked'}
                        onPress={() =>
                          handleItemChange(index, 'is_half', !item.is_half)
                        }
                        color="#91B275"
                        uncheckedColor="#91B275"
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

              <Button
                icon="plus"
                onPress={handleAddItem}
                style={styles.addButton}
              >
                {I18n.t('comboDialog.addComboItemButton')}
              </Button>
            </Card.Content>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isPending}
            disabled={isPending}
            style={styles.saveButton}
          >
            {I18n.t('comboDialog.saveComboButton')}
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
  outline: {
    borderColor: '#91B275',
    borderWidth: 0,
    borderRadius: 16,
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
