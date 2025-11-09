import { Discount, DiscountRule } from '@/types/discountTypes';
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  Switch,
  Text,
  Button,
  Snackbar,
  HelperText,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateDiscountRule } from '@/services/mutation/discountMutation';
import { MultiSelectDropdown } from 'react-native-paper-dropdown';
import { useGetMenus } from '@/services/mutation/menuMutation';
import Toast from 'react-native-toast-message';
import ModalHeader from './ModalHeader';

const stylesModal = StyleSheet.create({
  dialog: {
    backgroundColor: '#EFF4EB',
    width: '40%',
    alignSelf: 'center',
    borderRadius: 12,
  },
  menuItem: {
    color: '#333',
    fontSize: 14,
  },
  container: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#50693A17',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 15,
    color: '#333',
  },
  dropdownBtn: {
    backgroundColor: '#50693A17',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 5,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#91B275',
    borderRadius: 30,
    width: 125,
    alignSelf: 'flex-end',
  },
});

const AddDiscountRuleModal = ({
  discount,
  visible,
  setVisible,
}: {
  discount: any;
  visible: boolean;
  setVisible: Function;
}) => {
  const [ruleFormValues, setRuleFormValues] = useState<Partial<DiscountRule>>({
    discount_id: discount.id,
    min_items: undefined,
    max_items: undefined,
    min_price: 0,
    applicable_items: [],
    excluded_items: [],
    combo_size: 0,
    buy_quantity: 0,
    get_quantity: 0,
    is_percentage: false,
    max_discount_amount: 0,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const queryClient = useQueryClient();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const { data: menus } = useGetMenus();
  const onSuccessAdd = () => {
    setSnackbarVisible(true);
  };
  const { mutate: createDiscountRule, isPending } =
    useCreateDiscountRule(onSuccessAdd);
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;

  const handleRuleFormChange = (
    key: string,
    value: string | boolean | any[]
  ) => {
    const normalizedValue =
      key === 'applicable_items' || key === 'excluded_items'
        ? Array.isArray(value)
          ? value
          : value == null || value === ''
          ? []
          : [value]
        : value;

    setRuleFormValues((prev) => ({
      ...prev,
      [key]: normalizedValue,
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Validate Discount Selection
    if (!ruleFormValues.discount_id) {
      errors.discount_id = 'Discount selection is required.';
    }

    // Validate Min Items
    if (
      (!ruleFormValues.min_items || isNaN(Number(ruleFormValues.min_items))) &&
      discount?.type == 'volume'
    ) {
      errors.min_items = 'Min Items must be a valid number.';
    } else if (Number(ruleFormValues.min_items) <= 0) {
      errors.min_items = 'Min Items must be greater than 0.';
    }

    if (
      (!ruleFormValues.buy_quantity ||
        isNaN(Number(ruleFormValues.buy_quantity))) &&
      (discount?.type == 'freeItem' || discount?.type == 'bogo')
    ) {
      errors.buy_quantity = 'Buy Quantity must be a valid number.';
    } else if (
      Number(ruleFormValues.buy_quantity) <= 0 &&
      (discount?.type == 'freeItem' || discount?.type == 'bogo')
    ) {
      errors.buy_quantity = 'Buy Quantity must be greater than 0.';
    }

    if (
      (!ruleFormValues.get_quantity ||
        isNaN(Number(ruleFormValues.get_quantity))) &&
      (discount?.type == 'freeItem' || discount?.type == 'bogo')
    ) {
      errors.get_quantity = 'Get Quantity must be a valid number.';
    } else if (
      Number(ruleFormValues.get_quantity) <= 0 &&
      (discount?.type == 'freeItem' || discount?.type == 'bogo')
    ) {
      errors.get_quantity = 'Get Quantity must be greater than 0.';
    }

    // Validate Min Price
    if (
      (!ruleFormValues.max_discount_amount ||
        isNaN(Number(ruleFormValues.max_discount_amount))) &&
      discount?.type != 'bogo' &&
      discount?.type != 'freeItem'
    ) {
      errors.min_price = 'Max Discount Amount must be a valid number.';
    } else if (Number(ruleFormValues.max_discount_amount) < 0) {
      errors.min_price = 'Min Discount Amount must be non-negative.';
    }

    // Validate Applicable Items
    if (
      (!ruleFormValues.applicable_items ||
        ruleFormValues.applicable_items.length === 0) &&
      (discount?.type == 'bogo' || discount?.type == 'freeItem')
    ) {
      errors.applicable_items = 'At least one applicable item is required.';
    }

    // Validate Excluded Items (Optional)
    if (
      ruleFormValues.excluded_items &&
      ruleFormValues.excluded_items.some((item) =>
        ruleFormValues.applicable_items?.includes(item)
      )
    ) {
      errors.excluded_items =
        'Excluded items cannot overlap with applicable items.';
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRule = async () => {
    if (!validateForm()) return;

    try {
      await createDiscountRule(ruleFormValues);
      queryClient.invalidateQueries({ queryKey: ['discountRules'] });
    } catch (error) {
      console.error('Error creating discount rule:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to create discount rule',
        text2: 'Please try again.',
      });
    }
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={() => setVisible(false)}
        style={stylesModal.dialog}
      >
        <Dialog.Title>
          <ModalHeader
            title="Add Discount Rule"
            onClose={() => setVisible(false)}
          />
        </Dialog.Title>
        <Dialog.Content>
          <ScrollView contentContainerStyle={stylesModal.container}>
            <View>
              {/* Min Items */}
              {discount.type == 'volume' && (
                <>
                  <TextInput
                    style={stylesModal.input}
                    keyboardType="numeric"
                    placeholder="Enter Minimum Items"
                    value={ruleFormValues.min_items?.toString() || ''}
                    onChangeText={(value) => {
                      const sanitizedValue = value.replace(/[^0-9]/g, '');
                      handleRuleFormChange('min_items', sanitizedValue);
                    }}
                  />

                  <HelperText type="error" visible={!!errors.min_items}>
                    {errors.min_items}
                  </HelperText>
                </>
              )}
              {discount.type != 'bogo' && discount.type != 'freeItem' && (
                <>
                  <TextInput
                    style={stylesModal.input}
                    placeholder="Enter Max Discount Amount"
                    value={ruleFormValues.max_discount_amount?.toString() || ''}
                    onChangeText={(value) => {
                      const sanitizedValue = value.replace(/[^0-9.,\-]/g, '');
                      handleRuleFormChange(
                        'max_discount_amount',
                        sanitizedValue
                      );
                    }}
                  />
                  <HelperText
                    type="error"
                    visible={!!errors.max_discount_amount}
                  >
                    {errors.max_discount_amount}
                  </HelperText>
                </>
              )}
              {discount.type == 'combo' && (
                <>
                  <TextInput
                    style={stylesModal.input}
                    placeholder="Enter Combo Size"
                    value={ruleFormValues.combo_size?.toString() || ''}
                    onChangeText={(value) => {
                      const sanitizedValue = value.replace(/[^0-9\\.,-]/g, '');
                      handleRuleFormChange('combo_size', sanitizedValue);
                    }}
                  />
                  <HelperText type="error" visible={!!errors.combo_size}>
                    {errors.combo_size}
                  </HelperText>
                </>
              )}
              {(discount.type == 'bogo' || discount.type == 'freeItem') && (
                <>
                  <TextInput
                    style={stylesModal.input}
                    placeholder="Enter Buy Quantity"
                    value={ruleFormValues.buy_quantity?.toString() || ''}
                    onChangeText={(value) => {
                      const sanitizedValue = value.replace(/[^0-9\\.,-]/g, '');
                      handleRuleFormChange('buy_quantity', sanitizedValue);
                    }}
                  />
                  <HelperText type="error" visible={!!errors.buy_quantity}>
                    {errors.buy_quantity}
                  </HelperText>
                </>
              )}
              {(discount.type == 'bogo' || discount.type == 'freeItem') && (
                <>
                  <TextInput
                    style={stylesModal.input}
                    placeholder="Enter Get Quantity"
                    value={ruleFormValues.get_quantity?.toString() || ''}
                    onChangeText={(value) => {
                      const sanitizedValue = value.replace(/[^0-9\\.,-]/g, '');
                      handleRuleFormChange('get_quantity', sanitizedValue);
                    }}
                  />
                  <HelperText type="error" visible={!!errors.get_quantity}>
                    {errors.get_quantity}
                  </HelperText>
                </>
              )}

              {(discount.type == 'bogo' || discount.type == 'freeItem') && (
                <>
                  <MultiSelectDropdown
                    label="Applicable Items"
                    placeholder="Select Applicable Items"
                    options={
                      menus
                        ?.filter(
                          (mn) =>
                            mn.id &&
                            !ruleFormValues?.excluded_items?.includes(mn.id)
                        )
                        .map((mn) => ({ label: mn.name, value: mn.id! })) || []
                    }
                    value={ruleFormValues.applicable_items || []}
                    onSelect={(values) =>
                      handleRuleFormChange('applicable_items', values)
                    }
                    error={!!errors.applicable_items}
                  />
                  <HelperText type="error" visible={!!errors.applicable_items}>
                    {errors.applicable_items}
                  </HelperText>
                </>
              )}

              {/* Excluded Items */}
              {discount.type == 'freeItem' && (
                <>
                  <MultiSelectDropdown
                    label="Excluded Items"
                    placeholder="Select Excluded Items"
                    options={
                      menus
                        ?.filter(
                          (mn) =>
                            mn.id &&
                            !ruleFormValues?.applicable_items?.includes(mn.id)
                        )
                        .map((mn) => ({ label: mn.name, value: mn.id! })) || []
                    }
                    value={ruleFormValues.excluded_items || []}
                    onSelect={(values) =>
                      handleRuleFormChange('excluded_items', values)
                    }
                    error={!!errors.excluded_items}
                  />
                  <HelperText type="error" visible={!!errors.excluded_items}>
                    {errors.excluded_items}
                  </HelperText>
                </>
              )}
              {/* Is Percentage */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 15,
                }}
              >
                <Text style={{ color: '#40392B' }}>Is Percentage</Text>
                <Switch
                  value={ruleFormValues.is_percentage}
                  onValueChange={(value) =>
                    handleRuleFormChange('is_percentage', value)
                  }
                  color="#91B275"
                />
              </View>
              {/* Save Button */}
              <Button
                mode="contained"
                onPress={handleSaveRule}
                style={stylesModal.addButton}
                loading={isPending}
                disabled={isPending}
                labelStyle={{ color: '#fff' }}
              >
                + Add Rule
              </Button>
              <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
              >
                Discount Rule Added Successfully
              </Snackbar>
            </View>
          </ScrollView>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

export default AddDiscountRuleModal;
