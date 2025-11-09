import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text, Button, Snackbar, ActivityIndicator } from 'react-native-paper';
import { Dropdown } from 'react-native-paper-dropdown';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useGetMenus,
  useGetRelatedMenuItem,
  useUpdateRelatedMenuItem,
} from '@/services/mutation/menuMutation';

const TAGS = ['Best Paired With', 'Alternative', 'Customer Favorite'];

export default function EditRelatedItem() {
  const { width } = useWindowDimensions();
  const { relatedItemId } = useLocalSearchParams();
  const [menuItem, setMenuItem] = useState<string | undefined>('');
  const [relatedItem, setRelatedItem] = useState<string | undefined>('');
  const [tag, setTag] = useState<string | undefined>('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Screen size breakpoints
  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;
  const isLargeScreen = width >= 1024;

  const { data: itemData, isLoading: loadingItemData } = useGetRelatedMenuItem(
    relatedItemId as string
  );
  const { data: menus } = useGetMenus();
  const { mutate: updateRelatedItem, isPending: updating } =
    useUpdateRelatedMenuItem();

  useEffect(() => {
    if (itemData) {
      setMenuItem(
        typeof itemData.menu_item === 'string'
          ? itemData.menu_item
          : itemData.menu_item?.id
      );
      setRelatedItem(
        typeof itemData.related_item === 'string'
          ? itemData.related_item
          : itemData.related_item?.id
      );
      setTag(itemData?.tag);
    }
  }, [itemData]);

  const handleUpdateItem = async () => {
    if (!menuItem || !relatedItem || !tag) {
      setSnackbarMessage('All fields are required.');
      setSnackbarVisible(true);
      return;
    }

    await updateRelatedItem({
      id: relatedItemId,
      menu_item: menuItem,
      related_item: relatedItem,
      tag,
    });
    setSnackbarMessage('Related item updated successfully!');
    setSnackbarVisible(true);
    router.back();
  };

  if (loadingItemData) {
    return (
      <ActivityIndicator
        animating={true}
        style={styles.loading}
        size={isSmallScreen ? 'small' : 'large'}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={[
          styles.container,
          {
            width: isSmallScreen ? '100%' : '70%',
            paddingHorizontal: isSmallScreen ? 16 : 24,
            maxWidth: 600,
          },
        ]}
      >
        <Text
          variant={isSmallScreen ? 'headlineMedium' : 'headlineLarge'}
          style={[styles.title, { marginBottom: isSmallScreen ? 12 : 24 }]}
        >
          Edit Related Item
        </Text>

        <View style={styles.input}>
          <Dropdown
            label="Menu Item"
            placeholder="Select Menu Item"
            options={
              (menus
                ?.filter((menu) => menu.id !== relatedItem)
                .map((menu) => ({
                  label: menu.name,
                  value: menu.id,
                })) as any) || []
            }
            value={menuItem}
            onSelect={setMenuItem}
            mode={isSmallScreen ? 'flat' : 'outlined'}
          />
        </View>

        <View style={styles.input}>
          <Dropdown
            label="Related Menu Item"
            placeholder="Select Related Menu Item"
            options={
              (menus
                ?.filter((menu) => menu.id !== menuItem)
                .map((menu) => ({
                  label: menu.name,
                  value: menu.id,
                })) as any) || []
            }
            value={relatedItem}
            onSelect={setRelatedItem}
            mode={isSmallScreen ? 'flat' : 'outlined'}
          />
        </View>

        <View style={styles.input}>
          <Dropdown
            label="Tag"
            placeholder="Select Tag"
            options={
              (TAGS.map((tg) => ({
                label: tg,
                value: tg,
              })) as any) || []
            }
            value={tag}
            onSelect={setTag}
            mode={isSmallScreen ? 'flat' : 'outlined'}
          />
        </View>

        <Button
          mode="contained"
          onPress={handleUpdateItem}
          style={[
            styles.addButton,
            {
              width: isSmallScreen ? '100%' : 'auto',
              alignSelf: 'center',
            },
          ]}
          loading={updating}
          disabled={updating}
          contentStyle={{ height: isSmallScreen ? 40 : 48 }}
          labelStyle={{ fontSize: isSmallScreen ? 14 : 16 }}
        >
          {updating ? 'Updating...' : 'Update Item'}
        </Button>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={{
            marginBottom: isSmallScreen ? 16 : 24,
            marginHorizontal: isSmallScreen ? 16 : 0,
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    alignSelf: 'center',
    paddingVertical: 24,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
  },
  addButton: {
    marginTop: 24,
    borderRadius: 8,
    maxWidth: 400,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
