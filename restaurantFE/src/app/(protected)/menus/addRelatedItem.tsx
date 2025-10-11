import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { Dropdown, Option } from 'react-native-paper-dropdown';
import { router } from 'expo-router';
import {
  useAddRelatedMenuItem,
  useGetMenus,
} from '@/services/mutation/menuMutation';

const TAGS = ['Best Paired With', 'Alternative', 'Customer Favorite'];

export default function AddRelatedItem() {
  const { width } = useWindowDimensions();
  const [menuItem, setMenuItem] = useState<string | undefined>('');
  const [relatedItem, setRelatedItem] = useState<string | undefined>('');
  const [tag, setTag] = useState<string | undefined>('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Screen size breakpoints
  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;
  const isLargeScreen = width >= 1024;

  const { data: menus } = useGetMenus();
  const { mutateAsync: addRelatedItem, isPending } = useAddRelatedMenuItem();

  const handleAddItem = async () => {
    if (!menuItem || !relatedItem || !tag) {
      setSnackbarMessage('All fields are required.');
      setSnackbarVisible(true);
      return;
    }

    await addRelatedItem({
      menu_item: menuItem,
      related_item: relatedItem,
      tag,
    });
    setSnackbarMessage('Related item added successfully!');
    setSnackbarVisible(true);
    router.push('/(protected)/menus/relatedMenu');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View
        style={[
          styles.container,
          {
            width: isSmallScreen ? '100%' : isMediumScreen ? '90%' : '70%',
            paddingHorizontal: isSmallScreen ? 16 : isMediumScreen ? 24 : 32,
            maxWidth: 800,
          },
        ]}
      >
        <Text
          variant={isSmallScreen ? 'headlineMedium' : 'headlineLarge'}
          style={[styles.title, { marginBottom: isSmallScreen ? 12 : 24 }]}
        >
          Add Related Item
        </Text>

        <View style={styles.formContent}>
          <View style={styles.input}>
            <Dropdown
              label="Menu Item"
              placeholder="Select Menu Item"
              options={
                (menus?.results
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
                (menus?.results
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
            onPress={handleAddItem}
            style={[
              styles.addButton,
              {
                marginTop: isSmallScreen ? 8 : 16,
                borderRadius: 8,
              },
            ]}
            loading={isPending}
            disabled={isPending}
            contentStyle={{ height: isSmallScreen ? 40 : 48 }}
            labelStyle={{ fontSize: isSmallScreen ? 14 : 16 }}
          >
            {isPending ? 'Adding...' : 'Add Item'}
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
  formContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
  },
  addButton: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
  },
});
