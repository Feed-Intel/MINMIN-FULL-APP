import React, { useState } from 'react';
import {
  StyleSheet,
  Image,
  View,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import {
  Text,
  Button,
  TextInput,
  Switch,
  Portal,
  Dialog,
  Chip,
  Checkbox,
  List,
  HelperText,
} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useCreateMenu } from '@/services/mutation/menuMutation';
import { useQueryClient } from '@tanstack/react-query';
import validator from 'validator';
import { base64ToBlob } from '@/util/imageUtils';
import ModalHeader from '@/components/ModalHeader';
import {
  DropdownInputProps,
  MultiSelectDropdown,
  Option,
} from 'react-native-paper-dropdown';
import { useGetBranches } from '@/services/mutation/branchMutation';
import { i18n as I18n } from '@/app/_layout';

interface AddMenuDialogProps {
  visible: boolean;
  onClose: () => void;
}

type MenuFormState = {
  name: string;
  description: string;
  categories: string[];
  price: string;
  is_side: boolean;
  image: { uri: string; name: string; type: string };
  is_global: boolean;
  branches: string[];
};

export default function AddMenuDialog({
  visible,
  onClose,
}: AddMenuDialogProps) {
  const { width } = useWindowDimensions();

  const [menuData, setMenuData] = useState<MenuFormState>({
    name: '',
    description: '',
    categories: [],
    price: '',
    is_side: false,
    image: { uri: '', name: '', type: '' },
    is_global: true,
    branches: [],
  });

  const [errors, setErrors] = useState<Record<string, string | undefined>>({
    name: undefined,
    description: undefined,
    price: undefined,
    image: undefined,
    branches: undefined,
    categories: undefined,
  });

  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;

  const queryClient = useQueryClient();
  const { mutate: createMenu, isPending } = useCreateMenu();
  const { data: branches } = useGetBranches(undefined, true);

  const categories = ['Appetizer', 'Breakfast', 'Lunch', 'Dinner'];

  const handleInputChange = <K extends keyof MenuFormState>(
    field: K,
    value: MenuFormState[K]
  ) => {
    setMenuData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined })); // Clear error on change
  };

  const toggleCategory = (category: string) => {
    setMenuData((prev) => {
      const exists = prev.categories.includes(category);
      const list = exists
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category];

      setErrors((prevErr) => ({ ...prevErr, categories: undefined })); // Clear error

      return { ...prev, categories: list };
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMenuData((prev) => ({
        ...prev,
        image: {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || 'image.jpg',
          type: result.assets[0].type || 'image/jpeg',
        },
      }));

      setErrors((prev) => ({ ...prev, image: undefined }));
    }
  };

  const handleSave = async () => {
    let hasError = false;

    if (
      !menuData.name ||
      menuData.name.trim().length < 3 ||
      !validator.isAlpha(menuData.name.trim())
    ) {
      setErrors((prev: any) => ({
        ...prev,
        name: I18n.t('MenuDialog.error.invalid_name'),
      }));
      hasError = true;
    }
    if (
      !menuData.description ||
      menuData.description.trim().length === 0 ||
      menuData.description.trim().length < 3
    ) {
      setErrors((prev: any) => ({
        ...prev,
        description: I18n.t('MenuDialog.error.invalid_description'),
      }));
      hasError = true;
    }
    if (!menuData.price || parseInt(menuData.price) < 0) {
      setErrors((prev: any) => ({
        ...prev,
        price: I18n.t('MenuDialog.error.invalid_price'),
      }));
      hasError = true;
    }
    if (!menuData.image.uri) {
      setErrors((prev: any) => ({
        ...prev,
        image: I18n.t('MenuDialog.error.invalid_price'),
      }));
      hasError = true;
    }
    if (!menuData.is_global && menuData.branches.length == 0) {
      setErrors((prev: any) => ({
        ...prev,
        branches: I18n.t('MenuDialog.error.invalid_branches'),
      }));
      hasError = true;
    }
    if (menuData.categories.length == 0) {
      setErrors((prev: any) => ({
        ...prev,
        categories: I18n.t('MenuDialog.error.invalid_categories'),
      }));
      hasError = true;
    }
    if (hasError) return;

    const formData = new FormData();
    formData.append('name', menuData.name);
    formData.append('description', menuData.description);
    formData.append('price', menuData.price);
    formData.append('is_side', String(menuData.is_side));
    formData.append('categories', JSON.stringify(menuData.categories));
    formData.append('is_global', String(menuData.is_global));

    for (const branch of menuData.branches) {
      formData.append('branches', branch);
    }

    const base64Data = menuData.image.uri;
    const contentType = menuData.image.type || 'image/jpeg';
    const extension = menuData.image.name.split('.').pop() || 'jpg';
    const imageName = `${Date.now()}.${extension}`;

    const blob = base64ToBlob(base64Data, contentType);
    formData.append(
      'image',
      new File([blob], imageName, { type: contentType })
    );

    createMenu(formData);
    queryClient.invalidateQueries({ queryKey: ['menus'] });

    setMenuData({
      name: '',
      description: '',
      categories: [],
      price: '',
      is_side: false,
      image: { uri: '', name: '', type: '' },
      is_global: false,
      branches: [],
    });

    Toast.show({
      type: 'success',
      text1: I18n.t('Common.success_title'),
      text2: I18n.t('MenuDialog.successMessage'),
    });

    onClose();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        <Dialog.Title>
          <ModalHeader title={I18n.t('MenuDialog.title')} onClose={onClose} />
        </Dialog.Title>
        <Dialog.Content>
          <ScrollView>
            {/* NAME INPUT */}
            <TextInput
              placeholder={I18n.t('MenuDialog.namePlaceholder')}
              value={menuData.name}
              onChangeText={(text) => {
                const cleaned = text.replace(/[0-9]/g, '');
                handleInputChange('name', cleaned);
              }}
              mode="outlined"
              style={styles.input}
              outlineStyle={{
                borderColor: '#91B275',
                borderWidth: 0,
                borderRadius: 16,
              }}
              placeholderTextColor="#202B1866"
              contentStyle={{ color: '#202B1866' }}
            />
            {errors.name && (
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>
            )}
            {/* DESCRIPTION */}
            <TextInput
              placeholder={I18n.t('MenuDialog.descriptionPlaceholder')}
              value={menuData.description}
              onChangeText={(text) => {
                handleInputChange('description', text);
              }}
              mode="outlined"
              multiline
              numberOfLines={isSmallScreen ? 3 : 8}
              style={styles.descInput}
              outlineStyle={{
                borderColor: errors.description ? 'red' : '#91B275',
                borderWidth: errors.description ? 2 : 0,
                borderRadius: 16,
              }}
              placeholderTextColor="#202B1866"
              contentStyle={{ color: '#202B1866' }}
            />
            {errors.description && (
              <HelperText type="error" visible={!!errors.description}>
                {errors.description}
              </HelperText>
            )}
            {/* GLOBAL SWITCH */}
            <View style={styles.switchRow}>
              <Text style={{ color: '#40392B' }}>
                {I18n.t('MenuDialog.isGlobalLabel')}
              </Text>
              <Switch
                value={menuData.is_global}
                onValueChange={(value) => handleInputChange('is_global', value)}
                color="#91B275"
              />
            </View>

            {/* BRANCH SELECTOR */}
            {!menuData.is_global && (
              <>
                <Text style={styles.fieldLabel}>
                  {I18n.t('MenuDialog.branchLabel')}
                </Text>

                <MultiSelectDropdown
                  label={I18n.t('MenuDialog.selectBranchesPlaceholder')}
                  placeholder={I18n.t('MenuDialog.selectBranchesPlaceholder')}
                  options={
                    (branches?.results.map((br) => ({
                      label: br.address,
                      value: br.id!,
                    })) as Option[]) || []
                  }
                  value={menuData.branches || []}
                  onSelect={(values) => handleInputChange('branches', values)}
                  menuContentStyle={{ backgroundColor: '#fff' }}
                  CustomMenuHeader={() => <Text>{''}</Text>}
                  CustomMultiSelectDropdownInput={({
                    placeholder,
                    selectedLabel,
                    rightIcon,
                  }: DropdownInputProps) => (
                    <TextInput
                      mode="outlined"
                      placeholder={placeholder}
                      placeholderTextColor={'#202B1866'}
                      value={selectedLabel}
                      style={{ backgroundColor: '#50693A17', maxHeight: 50 }}
                      textColor={'#000'}
                      right={rightIcon}
                      outlineColor="#ccc"
                    />
                  )}
                />
              </>
            )}
            {errors.branches && !menuData.is_global && (
              <HelperText
                type="error"
                visible={!!errors.branches && !menuData.is_global}
              >
                {errors.branches}
              </HelperText>
            )}
            {/* CATEGORY SELECTOR */}
            <View style={styles.dropdownContainer}>
              <Button
                mode="outlined"
                style={[
                  styles.dropdownButton,
                  errors.categories && { borderColor: 'red', borderWidth: 2 },
                ]}
                labelStyle={{
                  color: '#333',
                  fontSize: 14,
                  width: '100%',
                  textAlign: 'left',
                }}
                onPress={() => setCategoryMenuVisible((prev) => !prev)}
                contentStyle={{ flexDirection: 'row-reverse', width: '100%' }}
                icon={categoryMenuVisible ? 'chevron-up' : 'chevron-down'}
              >
                {menuData.categories.length > 0
                  ? menuData.categories.join(', ')
                  : I18n.t('MenuDialog.selectCategories')}
              </Button>

              {categoryMenuVisible && (
                <View style={styles.categoryOptionsCard}>
                  <List.Section>
                    {categories.map((category) => {
                      const selected = menuData.categories.includes(category);
                      return (
                        <List.Item
                          key={category}
                          title={I18n.t(`categories.${category.toLowerCase()}`)}
                          onPress={() => toggleCategory(category)}
                          titleStyle={styles.categoryOptionText}
                          left={() => (
                            <Checkbox
                              status={selected ? 'checked' : 'unchecked'}
                              onPress={() => toggleCategory(category)}
                            />
                          )}
                        />
                      );
                    })}
                  </List.Section>

                  <View style={styles.categoryActionsRow}>
                    <Button
                      mode="text"
                      onPress={() => setCategoryMenuVisible(false)}
                      labelStyle={styles.categoryActionLabel}
                    >
                      {I18n.t('Common.done')}
                    </Button>
                  </View>
                </View>
              )}
            </View>

            {/* CATEGORY CHIPS */}
            {menuData.categories.length > 0 && (
              <View style={styles.selectedCategoriesContainer}>
                {menuData.categories.map((category) => (
                  <Chip
                    key={category}
                    mode="outlined"
                    onClose={() => toggleCategory(category)}
                    style={styles.categoryChip}
                    textStyle={styles.categoryChipText}
                  >
                    {category}
                  </Chip>
                ))}
              </View>
            )}

            {/* PRICE */}
            <TextInput
              placeholder={I18n.t('MenuDialog.pricePlaceholder')}
              value={menuData.price}
              onChangeText={(text) => {
                const cleaned = text
                  .replace(/[^0-9.]/g, '')
                  .replace(/(\..*)\./g, '$1');
                handleInputChange('price', cleaned);
              }}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              outlineStyle={{
                borderColor: errors.price ? 'red' : '#91B275',
                borderWidth: errors.price ? 2 : 0,
                borderRadius: 16,
              }}
              placeholderTextColor="#202B1866"
              contentStyle={{ color: '#202B1866' }}
            />
            {errors.price && (
              <HelperText type="error" visible={!!errors.price}>
                {I18n.t('MenuDialog.error.invalid_price')}
              </HelperText>
            )}

            {/* IMAGE PICKER */}
            <Button
              onPress={pickImage}
              mode="outlined"
              style={[
                styles.button,
                errors.image && { borderColor: 'red', borderWidth: 2 },
              ]}
              icon={menuData.image.uri ? 'image-edit' : 'image-plus'}
              labelStyle={{ fontSize: 14, fontWeight: '400', color: '#40392B' }}
            >
              {menuData.image.uri
                ? I18n.t('MenuDialog.changeImage')
                : I18n.t('MenuDialog.pickImage')}
            </Button>
            {errors.image && (
              <HelperText type="error" visible={!!errors.image}>
                {I18n.t('MenuDialog.error.invalid_image')}
              </HelperText>
            )}
            {menuData.image.uri && (
              <Image
                source={{ uri: menuData.image.uri }}
                resizeMode="cover"
                style={[
                  styles.imagePreview,
                  {
                    width: isSmallScreen ? 100 : isMediumScreen ? 150 : 200,
                    height: isSmallScreen ? 100 : isMediumScreen ? 150 : 150,
                  },
                ]}
              />
            )}

            {/* SIDE ITEM SWITCH */}
            <View style={[styles.switchRow, { gap: isSmallScreen ? 8 : 16 }]}>
              <Text
                variant={isSmallScreen ? 'bodyMedium' : 'bodyLarge'}
                style={styles.switchText}
              >
                {I18n.t('MenuDialog.isSideItemLabel')}
              </Text>
              <Switch
                value={menuData.is_side}
                onValueChange={(value) => handleInputChange('is_side', value)}
                trackColor={{ false: 'gray', true: '#96B76E' }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isPending}
            style={styles.saveButton}
            contentStyle={{ height: isSmallScreen ? 40 : 50 }}
            labelStyle={{ fontSize: isSmallScreen ? 14 : 16, color: '#fff' }}
          >
            {I18n.t('MenuDialog.saveButton')}
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
    height: '80%',
    overflowY: 'scroll',
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: '#91B27517',
    borderWidth: 0,
    borderColor: '#91B275',
    marginBottom: 10,
  },
  descInput: {
    // flex: 1,
    height: 100,
    backgroundColor: '#91B27517',
    borderWidth: 0,
    borderColor: '#91B275',
    marginBottom: 10,
  },
  button: {
    marginTop: 6,
    marginBottom: 16,
    borderWidth: 1,
    width: '50%',
    alignSelf: 'center',
  },
  imagePreview: {
    alignSelf: 'center',
    marginBottom: 10,
    borderRadius: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchText: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: '400',
    color: '#40392B',
  },
  saveButton: {
    borderRadius: 16,
    backgroundColor: '#96B76E',
    width: '100%',
    height: 36,
    justifyContent: 'center',
  },
  dropdownContainer: {
    marginVertical: 16,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
  },
  categoryOptionsCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#40392B',
  },
  categoryActionsRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  categoryActionLabel: {
    fontSize: 14,
  },
  selectedCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
    borderColor: '#91B275',
    backgroundColor: '#EBF1E6',
  },
  categoryChipText: {
    color: '#40392B',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#40392B',
    marginBottom: 6,
  },
});
