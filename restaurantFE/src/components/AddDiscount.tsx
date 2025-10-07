import dayjs from 'dayjs';
import DatePicker from '@/components/DatePicker';
import { useEffect, useMemo, useState } from 'react';
import {
  useCreateDiscount,
  useCreateDiscountRule,
} from '@/services/mutation/discountMutation';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  Button,
  Dialog,
  HelperText,
  Menu,
  Portal,
  Switch,
  Text,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import {
  ScrollView,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';
import { useGetMenus } from '@/services/mutation/menuMutation';
import MenuItemSelectorModal from './MenuItemSelectorModal';
import ModalHeader from './ModalHeader';
import {
  DropdownInputProps,
  MultiSelectDropdown,
  Option,
} from 'react-native-paper-dropdown';
import { Branch } from '@/types/branchType';

const TYPEOPTIONS = [
  { label: 'Volume', value: 'volume' },
  { label: 'Combo', value: 'combo' },
  { label: 'BOGO', value: 'bogo' },
  { label: 'Free Item', value: 'freeItem' },
];

const ruleDefaultState = {
  min_items: '',
  max_items: '',
  min_price: '',
  applicable_items: [] as string[],
  excluded_items: [] as string[],
  combo_size: '',
  buy_quantity: '',
  get_quantity: '',
  is_percentage: false,
  max_discount_amount: '',
};

type AddDiscountModalProps = {
  branches: Branch[];
  visible: boolean;
  currentPage: number;
  onClose: () => void;
};

export default function AddDiscountModal({
  branches,
  visible,
  currentPage,
  onClose,
}: AddDiscountModalProps) {
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [applyToAllBranches, setApplyToAllBranches] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [showType, setShowType] = useState(false);
  const [off_peak_hours, setOffPeakHours] = useState(false);
  const [priority, setPriority] = useState<string | undefined>(undefined);
  const [stackable, setStackable] = useState(false);
  const [valid_from, setValidFrom] = useState<Date | undefined>(undefined);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [valid_until, setValidUntil] = useState<Date | undefined>(undefined);
  const [showUntilPicker, setShowUntilPicker] = useState(false);
  const [ruleFormValues, setRuleFormValues] = useState(ruleDefaultState);
  const [ruleErrors, setRuleErrors] = useState<{ [key: string]: string }>({});
  const [applicableSelectorVisible, setApplicableSelectorVisible] =
    useState(false);
  const [excludedSelectorVisible, setExcludedSelectorVisible] = useState(false);

  const { mutateAsync: onAdd } = useCreateDiscount();
  const { mutateAsync: createDiscountRule } = useCreateDiscountRule();
  const { data: menus } = useGetMenus();
  const queryClient = useQueryClient();
  const { isBranch, branchId } = useRestaurantIdentity();

  const defaultBranchId = useMemo(() => {
    if (isBranch && branchId) return branchId;
    return branches[0]?.id ?? '';
  }, [isBranch, branchId, branches]);

  useEffect(() => {
    if (visible) {
      setApplyToAllBranches(!isBranch);
      // setBranch(defaultBranchId);
    }
  }, [visible, isBranch, defaultBranchId]);

  useEffect(() => {
    if (!visible) {
      resetForms();
    }
  }, [visible]);

  useEffect(() => {
    setRuleFormValues((prev) => ({
      ...ruleDefaultState,
      is_percentage: prev.is_percentage,
    }));
    setRuleErrors({});
  }, [type]);

  const resetForms = () => {
    setSelectedBranches([]);
    setApplyToAllBranches(false);
    setName('');
    setDescription('');
    setType('');
    setShowType(false);
    setOffPeakHours(false);
    setPriority(undefined);
    setStackable(false);
    setValidFrom(undefined);
    setValidUntil(undefined);
    setRuleFormValues(ruleDefaultState);
    setRuleErrors({});
  };

  const validateForm = () => {
    if (!applyToAllBranches && selectedBranches.length !== 0) {
      Toast.show({
        type: 'error',
        text1: 'Branch selection is required.',
        text2: 'Please select branch.',
      });
      return false;
    }

    if (!name?.trim()) {
      Toast.show({ type: 'error', text1: 'Name is required.' });
      return false;
    }

    if (name.trim().length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Name must be at least 3 characters long.',
      });
      return false;
    }

    if (!type) {
      Toast.show({ type: 'error', text1: 'Discount type is required.' });
      return false;
    }

    if (priority !== undefined && priority !== '') {
      if (isNaN(Number(priority)) || Number(priority) < 0) {
        Toast.show({
          type: 'error',
          text1: 'Priority must be a non-negative number.',
        });
        return false;
      }
    }

    if (!valid_from) {
      Toast.show({ type: 'error', text1: 'Valid from date is required.' });
      return false;
    }

    if (!valid_until) {
      Toast.show({ type: 'error', text1: 'Valid until date is required.' });
      return false;
    }

    if (valid_from && valid_until && dayjs(valid_until).isBefore(valid_from)) {
      Toast.show({
        type: 'error',
        text1: 'Valid until must be after valid from.',
      });
      return false;
    }

    return true;
  };

  const handleRuleFormChange = (
    key: string,
    value: string | boolean | string[]
  ) => {
    const normalizedValue =
      key === 'applicable_items' || key === 'excluded_items'
        ? Array.isArray(value)
          ? value
          : value == null || value === ''
          ? []
          : [value]
        : value;

    setRuleFormValues((prev) => {
      if (key === 'applicable_items') {
        const values = normalizedValue as string[];
        return {
          ...prev,
          applicable_items: values,
          excluded_items: (prev.excluded_items || []).filter(
            (id) => !values.includes(id)
          ),
        };
      }

      if (key === 'excluded_items') {
        const values = normalizedValue as string[];
        return {
          ...prev,
          excluded_items: values,
          applicable_items: (prev.applicable_items || []).filter(
            (id) => !values.includes(id)
          ),
        };
      }

      return {
        ...prev,
        [key]: normalizedValue,
      };
    });
  };

  const validateRuleForm = () => {
    const errors: { [key: string]: string } = {};

    if (!type) {
      errors.type = 'Select a discount type before configuring rules.';
    }

    if (
      type === 'volume' &&
      (!ruleFormValues.min_items || isNaN(Number(ruleFormValues.min_items)))
    ) {
      errors.min_items = 'Min items must be a valid number.';
    } else if (type === 'volume' && Number(ruleFormValues.min_items) <= 0) {
      errors.min_items = 'Min items must be greater than 0.';
    }

    const requiresQuantity = type === 'bogo' || type === 'freeItem';

    if (
      requiresQuantity &&
      (!ruleFormValues.buy_quantity ||
        isNaN(Number(ruleFormValues.buy_quantity)))
    ) {
      errors.buy_quantity = 'Buy quantity must be a valid number.';
    } else if (requiresQuantity && Number(ruleFormValues.buy_quantity) <= 0) {
      errors.buy_quantity = 'Buy quantity must be greater than 0.';
    }

    if (
      requiresQuantity &&
      (!ruleFormValues.get_quantity ||
        isNaN(Number(ruleFormValues.get_quantity)))
    ) {
      errors.get_quantity = 'Get quantity must be a valid number.';
    } else if (requiresQuantity && Number(ruleFormValues.get_quantity) <= 0) {
      errors.get_quantity = 'Get quantity must be greater than 0.';
    }

    if (
      type !== 'bogo' &&
      type !== 'freeItem' &&
      (!ruleFormValues.max_discount_amount ||
        isNaN(Number(ruleFormValues.max_discount_amount)))
    ) {
      errors.max_discount_amount =
        'Max discount amount must be a valid number.';
    } else if (
      ruleFormValues.max_discount_amount !== '' &&
      Number(ruleFormValues.max_discount_amount) < 0
    ) {
      errors.max_discount_amount = 'Max discount amount must be non-negative.';
    }

    if (
      requiresQuantity &&
      (!ruleFormValues.applicable_items ||
        ruleFormValues.applicable_items.length === 0)
    ) {
      errors.applicable_items = 'Select at least one applicable item.';
    }

    if (
      ruleFormValues.excluded_items?.some((item) =>
        ruleFormValues.applicable_items.includes(item)
      )
    ) {
      errors.excluded_items =
        'Excluded items cannot overlap with applicable items.';
    }

    setRuleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildRulePayload = (discountId: string) => {
    const toNumber = (value: string) =>
      value === undefined || value === null || value === ''
        ? undefined
        : Number(value);

    return {
      discount_id: discountId,
      min_items: toNumber(ruleFormValues.min_items),
      max_items: toNumber(ruleFormValues.max_items),
      min_price: toNumber(ruleFormValues.min_price),
      applicable_items: ruleFormValues.applicable_items,
      excluded_items: ruleFormValues.excluded_items,
      combo_size: toNumber(ruleFormValues.combo_size),
      buy_quantity: toNumber(ruleFormValues.buy_quantity),
      get_quantity: toNumber(ruleFormValues.get_quantity),
      is_percentage: ruleFormValues.is_percentage,
      max_discount_amount: toNumber(ruleFormValues.max_discount_amount),
    };
  };

  const handleSubmit = async () => {
    if (!validateForm() || !validateRuleForm()) {
      return;
    }

    try {
      const discountPayload: any = {
        branches: selectedBranches,
        is_global: applyToAllBranches,
        name: name,
        description: description,
        type: type,
        off_peak_hours: off_peak_hours,
        priority: priority,
        is_stackable: stackable,
        valid_from: valid_from,
        valid_until: valid_until,
      };

      const newDiscount: any = await onAdd(discountPayload);
      await queryClient.invalidateQueries({
        queryKey: ['discounts', currentPage],
      });

      if (newDiscount?.id) {
        await createDiscountRule(buildRulePayload(newDiscount.id));
        await queryClient.invalidateQueries({ queryKey: ['discountRules'] });
      }

      onClose();
      resetForms();
    } catch (error) {
      console.error('Error creating discount with rule', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to create discount',
        text2: 'Please try again.',
      });
    }
  };

  const getMenuSummary = (ids: string[] = []) => {
    if (!ids?.length) {
      return '';
    }

    const names = ids
      .map((id) => menus?.results.find((mn) => mn.id === id)?.name)
      .filter(Boolean) as string[];

    if (!names.length) {
      return `${ids.length} selected`;
    }

    if (names.length <= 2) {
      return names.join(', ');
    }

    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const clearRuleError = (field: string) => {
    setRuleErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleApplicableApply = (ids: string[]) => {
    handleRuleFormChange('applicable_items', ids);
    clearRuleError('applicable_items');
  };

  const handleExcludedApply = (ids: string[]) => {
    handleRuleFormChange('excluded_items', ids);
    clearRuleError('excluded_items');
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={stylesModal.dialog}>
        <Dialog.Title>
          <ModalHeader title="Add Discount" onClose={onClose} />
        </Dialog.Title>
        <Dialog.Content style={stylesModal.content}>
          <ScrollView
            style={stylesModal.scroll}
            contentContainerStyle={stylesModal.scrollContent}
            showsVerticalScrollIndicator
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
              }}
            >
              <Text style={{ color: '#40392B' }}>Is Global</Text>
              <Switch
                value={applyToAllBranches}
                onValueChange={setApplyToAllBranches}
                color="#91B275"
                disabled={isBranch}
              />
            </View>
            {!applyToAllBranches && (
              <>
                <Text style={stylesModal.fieldLabel}>Branch</Text>
                <MultiSelectDropdown
                  label="Select Branches"
                  placeholder="Select Branches"
                  options={
                    (branches.map((br) => ({
                      label: br.address,
                      value: br.id!,
                    })) as Option[]) || []
                  }
                  value={selectedBranches || []}
                  onSelect={(values) => setSelectedBranches(values)}
                  menuContentStyle={{
                    backgroundColor: '#fff',
                  }}
                  CustomMenuHeader={() => <Text>{''}</Text>}
                  CustomMultiSelectDropdownInput={({
                    placeholder,
                    selectedLabel,
                    rightIcon,
                  }: DropdownInputProps) => (
                    <PaperTextInput
                      mode="outlined"
                      placeholder={placeholder}
                      placeholderTextColor={'#202B1866'}
                      value={selectedLabel}
                      style={{
                        backgroundColor: '#50693A17',
                        maxHeight: 50,
                      }}
                      contentStyle={{
                        borderColor: '#ccc',
                      }}
                      textColor={'#000'}
                      right={rightIcon}
                      outlineColor="#ccc"
                    />
                  )}
                />
              </>
            )}

            <TextInput
              label="Name"
              placeholder="Name"
              value={name}
              onChangeText={setName}
              style={{ ...stylesModal.input, marginTop: 15 }}
              placeholderTextColor="#999"
            />

            <TextInput
              label="Description"
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={stylesModal.input}
              keyboardType="default"
              placeholderTextColor="#999"
            />

            <Menu
              visible={showType}
              onDismiss={() => setShowType(false)}
              anchor={
                <View>
                  <Text style={stylesModal.fieldLabel}>Discount type</Text>
                  <Button
                    mode="outlined"
                    style={stylesModal.dropdownBtn}
                    labelStyle={{
                      color: type === '' ? '#aaa' : '#333',
                      fontSize: 14,
                      width: '100%',
                      textAlign: 'left',
                      marginLeft: 0,
                    }}
                    onPress={() => setShowType(true)}
                    contentStyle={{
                      flexDirection: 'row-reverse',
                      width: '100%',
                      paddingLeft: 10,
                    }}
                    icon={showType ? 'chevron-up' : 'chevron-down'}
                  >
                    {type
                      ? TYPEOPTIONS.find((option) => option.value === type)
                          ?.label
                      : 'Discount Type'}
                  </Button>
                </View>
              }
              contentStyle={[stylesModal.menuContainer, { width: '100%' }]}
              style={{ alignSelf: 'stretch' }}
              anchorPosition="bottom"
            >
              {TYPEOPTIONS.map((option) => (
                <Menu.Item
                  key={option.value}
                  onPress={() => {
                    setType(option.value);
                    setShowType(false);
                  }}
                  title={option.label}
                  titleStyle={stylesModal.menuItem}
                />
              ))}
            </Menu>

            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Off peak hours</Text>
              <Switch
                value={off_peak_hours}
                onValueChange={setOffPeakHours}
                color="#91B275"
              />
            </View>

            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Stackable</Text>
              <Switch
                value={stackable}
                onValueChange={setStackable}
                color="#91B275"
              />
            </View>

            <TextInput
              label="Priority"
              placeholder="Priority"
              value={priority ?? ''}
              onChangeText={setPriority}
              style={stylesModal.input}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <View style={stylesModal.dateRow}>
              <Text style={stylesModal.fieldLabel}>Valid from</Text>
              <Button
                onPress={() => setShowFromPicker(true)}
                mode="outlined"
                contentStyle={{ flexDirection: 'row-reverse' }}
                style={stylesModal.dateButton}
                labelStyle={stylesModal.dateLabel}
                icon="chevron-down"
              >
                Valid From:{' '}
                {valid_from
                  ? dayjs(valid_from).format('YYYY-MM-DD')
                  : 'Not set'}
              </Button>
              <DatePicker
                dateFilterVisible={showFromPicker}
                setDateFilterVisible={setShowFromPicker}
                selectedDate={valid_from}
                setSelectedDate={setValidFrom}
              />
            </View>

            <View style={stylesModal.dateRow}>
              <Text style={stylesModal.fieldLabel}>Valid until</Text>
              <Button
                onPress={() => setShowUntilPicker(true)}
                mode="outlined"
                contentStyle={{ flexDirection: 'row-reverse' }}
                style={stylesModal.dateButton}
                labelStyle={stylesModal.dateLabel}
                icon="chevron-down"
              >
                Valid Until:{' '}
                {valid_until
                  ? dayjs(valid_until).format('YYYY-MM-DD')
                  : 'Not set'}
              </Button>
              <DatePicker
                dateFilterVisible={showUntilPicker}
                setDateFilterVisible={setShowUntilPicker}
                selectedDate={valid_until}
                setSelectedDate={setValidUntil}
              />
            </View>

            <View style={stylesModal.sectionDivider} />

            <Text style={stylesModal.sectionHeader}>Discount Rule</Text>

            {type === 'volume' && (
              <>
                <Text style={stylesModal.fieldLabel}>Minimum items</Text>
                <TextInput
                  style={stylesModal.input}
                  keyboardType="numeric"
                  placeholder="Minimum items"
                  value={ruleFormValues.min_items}
                  onChangeText={(value) =>
                    handleRuleFormChange(
                      'min_items',
                      value.replace(/[^0-9]/g, '')
                    )
                  }
                />
                <HelperText type="error" visible={!!ruleErrors.min_items}>
                  {ruleErrors.min_items}
                </HelperText>
              </>
            )}

            {type !== 'bogo' && type !== 'freeItem' && (
              <>
                <Text style={stylesModal.fieldLabel}>Max discount amount</Text>
                <TextInput
                  style={stylesModal.input}
                  placeholder="Max discount amount"
                  value={ruleFormValues.max_discount_amount}
                  onChangeText={(value) =>
                    handleRuleFormChange(
                      'max_discount_amount',
                      value.replace(/[^0-9.\-]/g, '')
                    )
                  }
                />
                <HelperText
                  type="error"
                  visible={!!ruleErrors.max_discount_amount}
                >
                  {ruleErrors.max_discount_amount}
                </HelperText>
              </>
            )}

            {type === 'combo' && (
              <>
                <Text style={stylesModal.fieldLabel}>Combo size</Text>
                <TextInput
                  style={stylesModal.input}
                  placeholder="Combo size"
                  value={ruleFormValues.combo_size}
                  onChangeText={(value) =>
                    handleRuleFormChange(
                      'combo_size',
                      value.replace(/[^0-9]/g, '')
                    )
                  }
                />
                <HelperText type="error" visible={!!ruleErrors.combo_size}>
                  {ruleErrors.combo_size}
                </HelperText>
              </>
            )}

            {(type === 'bogo' || type === 'freeItem') && (
              <>
                <TextInput
                  label="Buy quantity"
                  style={stylesModal.input}
                  placeholder="Buy quantity"
                  value={ruleFormValues.buy_quantity}
                  onChangeText={(value) =>
                    handleRuleFormChange(
                      'buy_quantity',
                      value.replace(/[^0-9]/g, '')
                    )
                  }
                />
                <HelperText type="error" visible={!!ruleErrors.buy_quantity}>
                  {ruleErrors.buy_quantity}
                </HelperText>

                <TextInput
                  label="Get quantity"
                  style={stylesModal.input}
                  placeholder="Get quantity"
                  value={ruleFormValues.get_quantity}
                  onChangeText={(value) =>
                    handleRuleFormChange(
                      'get_quantity',
                      value.replace(/[^0-9]/g, '')
                    )
                  }
                />
                <HelperText type="error" visible={!!ruleErrors.get_quantity}>
                  {ruleErrors.get_quantity}
                </HelperText>

                <Text style={stylesModal.fieldLabel}>Applicable items</Text>
                <TouchableOpacity
                  onPress={() => setApplicableSelectorVisible(true)}
                  activeOpacity={0.85}
                >
                  <PaperTextInput
                    mode="outlined"
                    placeholder="Select applicable items"
                    value={getMenuSummary(ruleFormValues.applicable_items)}
                    editable={false}
                    right={<PaperTextInput.Icon icon="chevron-down" />}
                    outlineStyle={stylesModal.dropdownOutline}
                    style={stylesModal.dropdownInput}
                    theme={{
                      colors: { outline: '#5E6E4933', primary: '#91B275' },
                    }}
                  />
                </TouchableOpacity>
                <HelperText
                  type="error"
                  visible={!!ruleErrors.applicable_items}
                >
                  {ruleErrors.applicable_items}
                </HelperText>

                <Text style={stylesModal.fieldLabel}>Excluded items</Text>
                <TouchableOpacity
                  onPress={() => setExcludedSelectorVisible(true)}
                  activeOpacity={0.85}
                >
                  <PaperTextInput
                    mode="outlined"
                    placeholder="Select excluded items"
                    value={getMenuSummary(ruleFormValues.excluded_items)}
                    editable={false}
                    right={<PaperTextInput.Icon icon="chevron-down" />}
                    outlineStyle={stylesModal.dropdownOutline}
                    style={stylesModal.dropdownInput}
                    theme={{
                      colors: { outline: '#5E6E4933', primary: '#91B275' },
                    }}
                  />
                </TouchableOpacity>
                <HelperText type="error" visible={!!ruleErrors.excluded_items}>
                  {ruleErrors.excluded_items}
                </HelperText>
              </>
            )}

            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Is percentage</Text>
              <Switch
                value={ruleFormValues.is_percentage}
                onValueChange={(value) =>
                  handleRuleFormChange('is_percentage', value)
                }
                color="#91B275"
              />
            </View>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            mode="contained"
            style={stylesModal.addButton}
            labelStyle={{ color: '#fff' }}
            onPress={handleSubmit}
          >
            + Add Discount
          </Button>
        </Dialog.Actions>
      </Dialog>
      <MenuItemSelectorModal
        title="Select applicable items"
        visible={applicableSelectorVisible}
        menus={menus?.results || []}
        selectedIds={ruleFormValues.applicable_items}
        disabledIds={ruleFormValues.excluded_items}
        onApply={handleApplicableApply}
        onClose={() => setApplicableSelectorVisible(false)}
      />
      <MenuItemSelectorModal
        title="Select excluded items"
        visible={excludedSelectorVisible}
        menus={menus?.results || []}
        selectedIds={ruleFormValues.excluded_items}
        disabledIds={ruleFormValues.applicable_items}
        onApply={handleExcludedApply}
        onClose={() => setExcludedSelectorVisible(false)}
      />
    </Portal>
  );
}

const stylesModal = StyleSheet.create({
  dialog: {
    backgroundColor: '#EFF4EB',
    width: '45%',
    alignSelf: 'center',
    borderRadius: 12,
  },
  content: {
    maxHeight: '70vh',
    paddingBottom: 0,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  menuItem: {
    color: '#333',
    fontSize: 14,
  },
  container: {
    marginBottom: 24,
  },
  dropdownBtn: {
    backgroundColor: '#50693A17',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  readonlyBranch: {
    backgroundColor: '#E0E8D6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    color: '#333',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#40392B',
    marginBottom: 6,
  },
  dropdownInput: {
    backgroundColor: '#50693A17',
    marginBottom: 12,
  },
  dropdownOutline: {
    borderRadius: 8,
    borderColor: '#5E6E4933',
  },
  menuContainer: {
    backgroundColor: '#fff',
  },
  input: {
    backgroundColor: '#50693A17',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
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
    width: 145,
    alignSelf: 'flex-end',
  },
  dateRow: {
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: '#50693A17',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateLabel: {
    color: '#22281B',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#D5DEC9',
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#40392B',
    marginBottom: 12,
  },
});
