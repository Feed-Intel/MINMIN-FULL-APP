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
} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { useCreateMenu } from '@/services/mutation/menuMutation';
import { useQueryClient } from '@tanstack/react-query';
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
    is_global: false,
    branches: [],
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
    setMenuData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const toggleCategory = (category: string) => {
    setMenuData((prevData) => {
      const exists = prevData.categories.includes(category);
      const categories = exists
        ? prevData.categories.filter((item) => item !== category)
        : [...prevData.categories, category];
      return { ...prevData, categories };
    });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMenuData({
        ...menuData,
        image: {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || 'image.jpg',
          type: result.assets[0].type || 'image/jpeg',
        },
      });
    }
  };

  const handleSave = async () => {
    if (!menuData.name || !menuData.image.uri) {
      Toast.show({
        type: 'error',
        text1: I18n.t('Common.error_title'),
        text2: I18n.t('MenuDialog.error.nameImageRequired'),
      });
      return;
    }

    if (!menuData.description) {
      Toast.show({
        type: 'error',
        text1: I18n.t('Common.error_title'),
        text2: I18n.t('MenuDialog.error.descriptionRequired'),
      });
      return;
    }

    if (!menuData.price) {
      Toast.show({
        type: 'error',
        text1: I18n.t('Common.error_title'),
        text2: I18n.t('MenuDialog.error.priceRequired'),
      });
      return;
    }

    if (menuData.categories.length === 0) {
      Toast.show({
        type: 'error',
        text1: I18n.t('Common.error_title'),
        text2: I18n.t('MenuDialog.error.categoryRequired'),
      });
      return;
    }

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
    const extension = menuData.image.name?.split('.').pop() || 'jpg';
    const imageName = `${Date.now()}.${extension}`;

    const blob = base64ToBlob(base64Data, contentType);
    formData.append(
      'image',
      new File([blob], imageName, { type: contentType })
    );

    await createMenu(formData);
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
            <TextInput
              placeholder={I18n.t('MenuDialog.namePlaceholder')}
              value={menuData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              mode="outlined"
              style={styles.input}
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

            <TextInput
              placeholder={I18n.t('MenuDialog.descriptionPlaceholder')}
              value={menuData.description}
              onChangeText={(text) => handleInputChange('description', text)}
              mode="outlined"
              multiline
              numberOfLines={isSmallScreen ? 3 : 8}
              style={styles.descInput}
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

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 15,
              }}
            >
              <Text style={{ color: '#40392B' }}>
                {I18n.t('MenuDialog.isGlobalLabel')}
              </Text>
              <Switch
                value={menuData.is_global}
                onValueChange={(value) => handleInputChange('is_global', value)}
                color="#91B275"
              />
            </View>
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
                  menuContentStyle={{
                    backgroundColor: '#fff',
                  }}
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

            {/* Category Selector */}
            <View style={styles.dropdownContainer}>
              <Button
                mode="outlined"
                style={styles.dropdownButton}
                labelStyle={{
                  color: '#333',
                  fontSize: 14,
                  width: '100%',
                  textAlign: 'left',
                }}
                onPress={() => setCategoryMenuVisible((prev) => !prev)}
                contentStyle={{
                  flexDirection: 'row-reverse',
                  width: '100%',
                }}
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

            <TextInput
              placeholder={I18n.t('MenuDialog.pricePlaceholder')}
              value={menuData.price}
              onChangeText={(text) => {
                const cleaned = text
                  .replace(/[^0-9.]/g, '') // remove non-digits and extra chars
                  .replace(/(\..*)\./g, '$1');
                handleInputChange('price', cleaned);
              }}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
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

            <Button
              onPress={pickImage}
              mode="outlined"
              style={styles.button}
              icon={menuData.image.uri ? 'image-edit' : 'image-plus'}
              labelStyle={{
                fontSize: 14,
                fontWeight: '400',
                color: '#40392B',
              }}
            >
              {menuData.image.uri
                ? I18n.t('MenuDialog.changeImage')
                : I18n.t('MenuDialog.pickImage')}
            </Button>

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
          {/* <Button onPress={onClose}>Cancel</Button> */}
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
    alignItems: 'center',
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
