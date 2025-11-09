import dayjs from 'dayjs';
import DatePicker from '@/components/DatePicker';
import { useState } from 'react';
import { useUpdateCoupon } from '@/services/mutation/discountMutation';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  Button,
  Dialog,
  Portal,
  Switch,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import { ScrollView, View, TextInput, Text, StyleSheet } from 'react-native';
import {
  DropdownInputProps,
  MultiSelectDropdown,
  Option,
} from 'react-native-paper-dropdown';
import { Branch } from '@/types/branchType';
import { i18n as I18n } from '@/app/_layout';

type EditCouponProps = {
  coupon: any;
  visible: boolean;
  onClose: () => void;
  branches: Branch[];
};

export default function EditCouponModal({
  coupon,
  visible,
  onClose,
  branches,
}: EditCouponProps) {
  const [discountCode, setDiscountCode] = useState(coupon.discount_code);
  const [discountAmount, setDiscountAmount] = useState(coupon.discount_amount);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [validFrom, setValidFrom] = useState<Date>(new Date(coupon.valid_from));
  const [showUntilPicker, setShowUntilPicker] = useState(false);
  const [isPercentage, setIsPercentage] = useState(coupon.is_percentage);
  const [validUntil, setValidUntil] = useState<Date>(
    Boolean(coupon.valid_until) ? new Date(coupon.valid_until) : new Date()
  );
  const [isGlobal, setIsGlobal] = useState(coupon.is_global);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(
    coupon.branches
  );
  const { mutate: updateCouponCode } = useUpdateCoupon();
  const queryClient = useQueryClient();

  const validateForm = () => {
    // Validate Name
    if (!discountCode?.trim()) {
      Toast.show({
        type: 'error',
        text1: I18n.t('coupon_modal.error_code_required'),
      });
      return false;
    } else if (discountCode.trim().length < 3) {
      Toast.show({
        type: 'error',
        text1: I18n.t('coupon_modal.error_code_min_length'),
      });
      return false;
    }

    // Validate Valid From/Until Dates
    if (!validFrom) {
      Toast.show({
        type: 'error',
        text1: I18n.t('coupon_modal.error_from_required'),
      });
      return false;
    }
    if (!validUntil) {
      Toast.show({
        type: 'error',
        text1: I18n.t('coupon_modal.error_until_required'),
      });
      return false;
    } else if (dayjs(validUntil).isBefore(validFrom)) {
      Toast.show({
        type: 'error',
        text1: I18n.t('coupon_modal.error_until_after_from'),
      });
      return false;
    }

    return true;
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={stylesModal.dialog}>
        <Dialog.Content>
          <ScrollView>
            <TextInput
              placeholder={I18n.t('coupon_modal.placeholder_code')}
              value={discountCode}
              onChangeText={setDiscountCode}
              style={stylesModal.input}
              placeholderTextColor="#999"
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
              }}
            >
              <Text style={{ color: '#40392B' }}>
                {I18n.t('coupon_modal.label_is_global')}
              </Text>
              <Switch
                value={isGlobal}
                onValueChange={setIsGlobal}
                color="#91B275"
              />
            </View>
            {!isGlobal && (
              <>
                <Text style={stylesModal.fieldLabel}>
                  {I18n.t('coupon_modal.label_branch')}
                </Text>
                <MultiSelectDropdown
                  label={I18n.t('coupon_modal.placeholder_select_branches')}
                  placeholder={I18n.t(
                    'coupon_modal.placeholder_select_branches'
                  )}
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
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
              }}
            >
              <Text style={{ color: '#40392B' }}>
                {I18n.t('coupon_modal.label_is_percentage')}
              </Text>
              <Switch
                value={isPercentage}
                onValueChange={setIsPercentage}
                color="#91B275"
              />
            </View>
            <TextInput
              placeholder={I18n.t('coupon_modal.placeholder_amount')}
              value={discountAmount}
              onChangeText={setDiscountAmount}
              style={stylesModal.input}
              keyboardType="default"
              placeholderTextColor="#999"
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
              }}
            >
              <>
                <Button
                  onPress={() => setShowFromPicker(true)}
                  mode="outlined"
                  style={stylesModal.dateButton}
                  labelStyle={{
                    color: '#22281B',
                    fontSize: 14,
                    fontWeight: '500',
                  }}
                  contentStyle={{
                    flexDirection: 'row-reverse',
                  }}
                  icon={'chevron-down'}
                >
                  {I18n.t('coupon_modal.button_valid_from')}{' '}
                  {validFrom
                    ? dayjs(validFrom).format('YYYY-MM-DD')
                    : I18n.t('coupon_modal.date_not_set')}
                </Button>
                <DatePicker
                  dateFilterVisible={showFromPicker}
                  setDateFilterVisible={setShowFromPicker}
                  selectedDate={validFrom}
                  setSelectedDate={setValidFrom}
                />
              </>
              <>
                <Button
                  onPress={() => setShowUntilPicker(true)}
                  mode="outlined"
                  style={stylesModal.dateButton}
                  labelStyle={{
                    color: '#22281B',
                    fontSize: 14,
                    fontWeight: '500',
                  }}
                  contentStyle={{
                    flexDirection: 'row-reverse',
                  }}
                  icon={'chevron-down'}
                >
                  {I18n.t('coupon_modal.button_valid_until')}{' '}
                  {validUntil
                    ? dayjs(validUntil).format('YYYY-MM-DD')
                    : I18n.t('coupon_modal.date_not_set')}
                </Button>
                <DatePicker
                  dateFilterVisible={showUntilPicker}
                  setDateFilterVisible={setShowUntilPicker}
                  selectedDate={validUntil}
                  setSelectedDate={setValidUntil}
                />
              </>
            </View>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            mode="contained"
            style={stylesModal.addButton}
            labelStyle={{ color: '#fff' }}
            onPress={async () => {
              if (validateForm()) {
                await updateCouponCode({
                  id: coupon.id,
                  coupon: {
                    discount_code: discountCode,
                    discount_amount: discountAmount,
                    is_percentage: isPercentage,
                    is_global: isGlobal,
                    branches: selectedBranches,
                    valid_from: validFrom,
                    valid_until: validUntil,
                  },
                });
                queryClient.invalidateQueries({ queryKey: ['coupons'] });
                onClose();
              }
            }}
          >
            {I18n.t('coupon_modal.button_update_coupon')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

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
  dropdownBtn: {
    backgroundColor: '#50693A17',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
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
  },
  dateButton: {
    marginBottom: 16,
    backgroundColor: '#070D020A',
    borderRadius: 10,
    borderColor: '#5E6E4933',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#40392B',
    marginBottom: 6,
  },
});
