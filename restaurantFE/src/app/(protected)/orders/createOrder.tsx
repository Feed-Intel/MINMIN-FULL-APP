import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';
import { useGetCombos } from '@/services/mutation/comboMutation';
import {
  useGetMenuAvailabilities,
  useGetMenus,
} from '@/services/mutation/menuMutation';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Button,
  DataTable,
  Searchbar,
  Portal,
  Modal,
  Chip,
  Checkbox,
} from 'react-native-paper';
import Trash from '@/assets/icons/Trash.svg';
import Plus from '@/assets/icons/Plus.svg';
import { useAppSelector } from '@/lib/reduxStore/hooks';
import { RootState } from '@/lib/reduxStore/store';
import { useDispatch } from 'react-redux';
import {
  addToCart,
  setRemarks,
  updateQuantity,
  setCustomerInfo,
} from '@/lib/reduxStore/cartSlice';

const DEFAULT_CATEGORIES = ['Main course', 'Pasta', 'Dessert', 'Drinks'];

export default function CreateOrder() {
  const [activeTab, setActiveTab] = useState<'all' | 'combos'>('all');
  const { data: menus, isLoading: isMenusLoading } = useGetMenus();
  const [currentMenuItem, setCurrentMenuItem] = useState<any>(null);
  const { data: combos, isLoading: isCombosLoading } = useGetCombos();
  const { isRestaurant, isBranch, branchId, tenantId } =
    useRestaurantIdentity();
  const [selectedBranch, setSelectedBranch] = useState<string | null>(
    isBranch ? branchId ?? null : null
  );
  const [modalSelectedCategory, setModalSelectedCategory] = useState('All');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showRelatedModal, setShowRelatedModal] = useState(false);
  const { data: availabilityData } = useGetMenuAvailabilities();
  const [tag, setTag] = useState('');
  const cart = useAppSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();

  const remarks = useAppSelector((state: RootState) => state.cart.remarks);

  const newQuantities = cart.items.reduce((acc: any, item: any) => {
    acc[item.id] = item.quantity;
    return acc;
  }, {} as Record<string, number>);

  // const [orderData, setOrderData] = useState({
  //   tenant: tenantId,
  //   branch: branchId,
  //   table: '',
  //   coupon: '',
  //   items: cart.items.map((item: any) => ({
  //     menu_item: item.id,
  //     quantity: newQuantities[item.id] || 1,
  //     price: item.price,
  //     remarks: remarks[item.id],
  //   })),
  // });

  const getMenuCategories = (menu: any): string[] => {
    if (Array.isArray(menu?.categories) && menu.categories.length) {
      return menu.categories;
    }
    if (Array.isArray(menu?.category) && menu.category.length) {
      return menu.category.filter((value: any) => typeof value === 'string');
    }
    if (typeof menu?.category === 'string' && menu.category) {
      return [menu.category];
    }
    return [];
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    menus?.results?.forEach((menuItem) => {
      getMenuCategories(menuItem).forEach((category) => {
        if (category) {
          set.add(category);
        }
      });
    });
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [menus]);

  const branchFilteredMenus = useMemo(() => {
    if (!menus?.results) return [] as unknown as typeof menus;
    if (!selectedBranch || selectedBranch === 'all') return menus.results;

    if (!availabilityData?.results) return menus.results;

    return menus.results.filter((menu) =>
      availabilityData.results.some((avail) => {
        const branchValue =
          typeof avail.branch === 'object' ? avail.branch?.id : avail.branch;
        const menuValue =
          typeof avail.menu_item === 'object'
            ? avail.menu_item?.id
            : avail.menu_item;

        return branchValue === selectedBranch && menuValue === menu.id;
      })
    );
  }, [menus, selectedBranch, availabilityData]);

  const branchFilteredCombos = useMemo(() => {
    if (!combos) return [] as unknown as typeof combos;
    if (!selectedBranch || selectedBranch === 'all') return combos.results;

    return combos.results.filter((combo) => {
      const branchValue =
        typeof combo.branch === 'object' ? combo.branch?.id : combo.branch;
      return branchValue === selectedBranch;
    });
  }, [combos, selectedBranch]);

  const modalFilteredMenus = branchFilteredMenus?.filter((menu) => {
    if (menu.id === currentMenuItem?.id) {
      return false;
    }
    const categories = getMenuCategories(menu);
    const matchesCategory =
      modalSelectedCategory === 'All' ||
      categories.includes(modalSelectedCategory);
    const categoryText = categories.join(' ');

    return (
      matchesCategory &&
      (menu.name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
        categoryText.toLowerCase().includes(modalSearchQuery.toLowerCase()))
    );
  });

  const openRelatedModal = (menu: any) => {
    setCurrentMenuItem(menu);
    setModalSearchQuery('');
    setModalSelectedCategory('All');
    setSelectedItems([]);
    setTag('');
    setShowRelatedModal(true);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleQuantityChange = (id: string, increment: boolean) => {
    dispatch(
      updateQuantity({
        id,
        quantity: increment
          ? (newQuantities[id] || 0) + 1
          : Math.max((newQuantities[id] || 0) - 1, 0),
      })
    );
  };

  const handleAddRelatedItem = () => {
    selectedItems.map((Ritem) => {
      const existingItem: any = cart.items.find((item) => item.id === Ritem);
      if (!existingItem) {
        const item = modalFilteredMenus?.find((t) => t.id === Ritem);
        dispatch(
          addToCart({
            item: {
              id: item?.id!,
              name: item?.name!,
              description: '',
              price: parseFloat(item?.price!),
              quantity: 1,
              image: '',
            },
            restaurantId: tenantId!,
            branchId: branchId!,
            tableId: '',
            paymentAPIKEY: item?.tenant.CHAPA_API_KEY,
            paymentPUBLICKEY: item?.tenant.CHAPA_PUBLIC_KEY,
            tax: item?.tenant.tax,
            serviceCharge: item?.tenant.service_charge,
          })
        );
      }
    });
    setShowRelatedModal(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Create order</Text>

      {/* Customer Info */}
      <View style={styles.row}>
        <TextInput
          placeholder="Contact number"
          style={styles.input}
          keyboardType="phone-pad"
          value={cart.contactNumber}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9.]/g, '');
            dispatch(setCustomerInfo({ contactNumber: cleaned }));
          }}
        />
        <TextInput
          placeholder="Customer name"
          value={cart.customerName}
          style={styles.input}
          onChangeText={(text) => {
            dispatch(setCustomerInfo({ customerName: text }));
          }}
        />
        <TextInput
          placeholder="TIN number"
          style={styles.input}
          value={cart.tinNumber}
          onChangeText={(text) => {
            dispatch(setCustomerInfo({ tinNumber: text }));
          }}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <TextInput placeholder="By Item name" style={styles.filterInput} />
        <TextInput placeholder="By category" style={styles.filterInput} />
        <Button
          mode="contained"
          style={styles.applyButton}
          labelStyle={{ color: '#fff' }}
        >
          Apply
        </Button>
      </View>

      {/* Table Header */}
      <View style={styles.tabContainer}>
        <View style={styles.tabGroup}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'all' && styles.activeTabLabel,
              ]}
            >
              All items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'combos' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('combos')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'combos' && styles.activeTabLabel,
              ]}
            >
              Combos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Indicator */}
      {isMenusLoading && (
        <ActivityIndicator
          animating={true}
          size="large"
          color="#91B275"
          style={styles.loader}
        />
      )}

      {/* Menu Items Table */}
      {activeTab === 'all' && !isMenusLoading && (
        <View style={styles.card}>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title style={styles.imageHeader}>
                {' '}
                <Text style={styles.tableTitle}>Image</Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Name</Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Category</Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Price</Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Remark</Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Quantity</Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Related items</Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Actions</Text>
              </DataTable.Title>
            </DataTable.Header>

            {branchFilteredMenus?.map((menu) => {
              const categories = getMenuCategories(menu);
              const categoriesLabel = categories.length
                ? categories.join(', ')
                : '—';

              return (
                <DataTable.Row key={menu.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.imageCell}>
                    <Image
                      source={{ uri: menu.image }}
                      style={styles.menuImage}
                    />
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1 }}>
                    <Text style={styles.menuName}>{menu.name}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 0.9 }}>
                    <Text style={styles.categoryTag}>{categoriesLabel}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 0.9 }}>
                    <Text style={styles.menuPrice}>${menu.price}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <TextInput
                      placeholder="Remark"
                      style={{ ...styles.input, height: 50, maxWidth: 80 }}
                      value={remarks[menu.id!] || ''}
                      onChangeText={(text) =>
                        dispatch(setRemarks({ [menu.id!]: text }))
                      }
                    />
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        borderWidth: 1,
                        borderColor: '#5D6E4933',
                        borderRadius: 10,
                        padding: 10,
                        width: 100,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleQuantityChange(menu.id!, false)}
                      >
                        <Trash color={'#22281B'} height={16} />
                      </TouchableOpacity>
                      <Text style={{ color: '#22281B', fontWeight: 'bold' }}>
                        {newQuantities[menu.id!] || 0}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleQuantityChange(menu.id!, true)}
                      >
                        <Plus color={'#22281B'} height={16} />
                      </TouchableOpacity>
                    </View>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Button
                      mode="outlined"
                      onPress={() => openRelatedModal(menu)}
                      style={styles.relatedButton}
                      labelStyle={styles.relatedButtonLabel}
                    >
                      + Related item
                    </Button>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <View style={styles.actionsContainer}>
                      <Button
                        mode="text"
                        onPress={() => {
                          dispatch(
                            addToCart({
                              item: {
                                id: menu.id!,
                                name: menu.name,
                                description: menu.description,
                                price: parseFloat(menu.price),
                                quantity: 1,
                                image: menu.image,
                              },
                              restaurantId: tenantId!,
                              branchId: branchId!,
                              tableId: '',
                              paymentAPIKEY: menu?.tenant.CHAPA_API_KEY,
                              paymentPUBLICKEY:
                                menu?.tenant.CHAPA_PUBLIC_KEY || '',
                              tax: menu.tenant.tax || 0,
                              serviceCharge: menu.tenant.service_charge || 0,
                            })
                          );
                        }}
                        contentStyle={styles.deleteButtonContent}
                        labelStyle={styles.deleteButtonLabel}
                        style={styles.actionButton}
                      >
                        Order
                      </Button>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable>
        </View>
      )}

      {/* Combos Table */}
      {activeTab === 'combos' && !isCombosLoading && (
        <View style={styles.card}>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Name</Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Branch</Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Price</Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Custom</Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>Actions</Text>
              </DataTable.Title>
            </DataTable.Header>

            {branchFilteredCombos?.map((combo) => (
              <DataTable.Row key={combo.id}>
                <DataTable.Cell>
                  <Text style={styles.menuName}>{combo.name}</Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.branchName}>
                    {typeof combo.branch === 'object'
                      ? combo.branch.address
                      : combo.branch}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.menuPrice}>${combo.combo_price}</Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Chip
                    mode="outlined"
                    style={styles.customChip}
                    textStyle={styles.customChipText}
                  >
                    {combo.is_custom ? 'Yes' : 'No'}
                  </Chip>
                </DataTable.Cell>
                <DataTable.Cell>
                  <View style={styles.actionsContainer}>
                    <Button
                      mode="text"
                      onPress={() => {
                        dispatch(
                          addToCart({
                            item: {
                              id: combo.id!,
                              name: combo.name,
                              description: '',
                              price: combo.combo_price!,
                              quantity: 1,
                              image: '',
                            },
                            restaurantId: tenantId!,
                            branchId: branchId!,
                            tableId: '',
                            paymentAPIKEY: combo?.tenant.CHAPA_API_KEY,
                            paymentPUBLICKEY:
                              combo?.tenant.CHAPA_PUBLIC_KEY || '',
                            tax: combo.tenant.tax || 0,
                            serviceCharge: combo.tenant.service_charge || 0,
                          })
                        );
                      }}
                      contentStyle={styles.deleteButtonContent}
                      labelStyle={styles.deleteButtonLabel}
                      icon="delete-outline"
                      style={styles.actionButton}
                    >
                      Order
                    </Button>
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </View>
      )}
      <Portal>
        <Modal
          visible={showRelatedModal}
          onDismiss={() => setShowRelatedModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>
                For: {currentMenuItem?.name}
              </Text>
            </View>

            <View style={styles.searchContainer}>
              <Searchbar
                placeholder="Search by Item name"
                onChangeText={setModalSearchQuery}
                value={modalSearchQuery}
                style={styles.searchBar}
                inputStyle={styles.inputStyle}
                placeholderTextColor={'#2E191466'}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
            >
              {categoryOptions.map((category) => (
                <Chip
                  key={category}
                  mode="outlined"
                  selected={modalSelectedCategory === category}
                  onPress={() => setModalSelectedCategory(category)}
                  style={[
                    styles.categoryChip,
                    modalSelectedCategory === category &&
                      styles.selectedCategoryChip,
                  ]}
                  textStyle={[
                    styles.categoryChipText,
                    modalSelectedCategory === category &&
                      styles.selectedCategoryChipText,
                  ]}
                >
                  {category}
                </Chip>
              ))}
            </ScrollView>

            <ScrollView style={styles.itemsContainer}>
              {modalFilteredMenus?.map((menu) => {
                const categories = getMenuCategories(menu);
                const categoriesLabel = categories.length
                  ? categories.join(', ')
                  : '—';

                return (
                  <View key={menu.id} style={styles.itemRow}>
                    <Checkbox.Android
                      status={
                        selectedItems.includes(menu.id || '')
                          ? 'checked'
                          : 'unchecked'
                      }
                      onPress={() => toggleItemSelection(menu.id || '')}
                    />
                    <Image
                      source={{ uri: menu.image }}
                      style={styles.itemImage}
                    />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{menu.name}</Text>
                      <Text style={styles.categoryText}>{categoriesLabel}</Text>
                    </View>
                    <Text style={styles.itemPrice}>${menu.price}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
          <View style={styles.modalFooter}>
            <View style={styles.footerActions}>
              <Button
                mode="contained"
                onPress={handleAddRelatedItem}
                icon="plus"
                textColor="#fff"
                style={styles.addItemButton}
                labelStyle={{ color: '#fff', fontWeight: '600', fontSize: 17 }}
                disabled={selectedItems.length === 0 || !tag}
              >
                Add Item
              </Button>
              <Text style={styles.selectedItemsText}>
                {selectedItems.length} items selected
              </Text>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Footer */}
      {cart.items.length !== 0 && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>
              {cart.items.length} Items Added
            </Text>
            <Text style={styles.footerTextDescription}>
              Click “review orders” to view the summary and confirm your order
            </Text>
          </View>
          <Button
            mode="contained"
            style={{ backgroundColor: '#91B275' }}
            labelStyle={{ color: '#fff' }}
            onPress={() => router.push('/(protected)/orders/orderReview')}
          >
            Review orders
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F6F9F4',
  },
  header: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    height: 50,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1,
    borderColor: '#C7D3C1',
    borderRadius: 10,
    fontSize: 16,
    color: '#2E3A24',
    backgroundColor: '#91B27517',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  filterInput: {
    flex: 1,
    maxWidth: 200,
    paddingHorizontal: 12,
    height: 50,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1,
    borderColor: '#C7D3C1',
    borderRadius: 10,
    fontSize: 16,
    color: '#2E3A24',
    backgroundColor: '#91B27517',
  },
  applyButton: {
    height: 48,
    justifyContent: 'center',
    backgroundColor: '#91B275',
  },
  tabContainer: {
    borderColor: '#5E6E4933',
    borderBottomWidth: 1,
  },
  tabGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    borderRadius: 6,
    padding: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: '#96B76E',
  },
  tabLabel: {
    color: '#8D8D8D',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#96B76E',
  },
  card: {
    backgroundColor: '#EFF4EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  loader: {
    marginVertical: 24,
  },
  tableHeader: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#20291933',
  },
  imageHeader: {
    width: 60,
  },
  tableTitle: {
    fontWeight: '500',
    color: '#4A4A4A',
    fontSize: 13,
    flex: 0,
  },
  tableRow: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#20291933',
  },
  imageCell: {
    width: 42,
    justifyContent: 'flex-start',
    flex: 0.9,
  },
  menuImage: {
    width: 61,
    height: 62,
    borderRadius: 10,
  },
  menuName: {
    fontWeight: '500',
    color: '#22281B',
    fontSize: 17,
  },
  branchName: {
    color: '#5F7A3D',
    fontSize: 17,
  },
  categoryTag: {
    color: '#40392B',
    fontSize: 17,
  },
  customChip: {
    backgroundColor: '#E9F0F7',
    borderColor: '#7591B2',
    height: 24,
  },
  customChipText: {
    color: '#3D5F7A',
    fontSize: 12,
  },
  menuPrice: {
    fontWeight: '500',
    color: '#22281B',
    fontSize: 17,
  },
  relatedButton: {
    borderColor: '#6E504933',
    borderWidth: 1.5,
    borderRadius: 16,
    height: 36,
    justifyContent: 'center',
  },
  relatedButtonLabel: {
    color: '#281D1B',
    fontSize: 15,
    fontWeight: '500',
    alignSelf: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    minWidth: 0,
    padding: 0,
  },
  deleteButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#91B275',
    borderRadius: 50,
    width: 150,
    height: 40,
  },
  deleteButtonLabel: {
    color: '#fff',
    fontWeight: '500',
    marginHorizontal: 10,
  },
  toggleContainer: {
    marginLeft: 4,
  },
  modalContainer: {
    backgroundColor: '#EBF1E6',
    borderRadius: 13,
    width: '90%',
    maxWidth: 700,
    alignSelf: 'center',
    maxHeight: '80%',
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalHeaderText: {
    fontWeight: '600',
    color: '#2E191466',
    fontSize: 16,
  },
  inputStyle: {
    color: '#2E191466',
    fontSize: 15,
    fontWeight: '400',
  },
  itemsContainer: {
    maxHeight: 300,
    marginBottom: 16,
    borderWidth: 0,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: '500',
    color: '#22281B',
  },
  categoryText: {
    color: '#5F7A3D',
    fontSize: 12,
  },
  itemPrice: {
    fontWeight: '500',
    color: '#22281B',
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#F9FFF4',
    borderBottomRightRadius: 13,
    borderBottomLeftRadius: 13,
  },
  footerActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#91B27517',
    borderRadius: 100,
    height: 40,
    elevation: 0,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  addItemButton: {
    backgroundColor: '#91B275',
    borderRadius: 100,
    height: 36,
    width: '100%',
  },
  selectedItemsText: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '400',
    color: '#2E191466',
  },
  categoryChip: {
    borderRadius: 100,
    backgroundColor: '#91B27517',
    borderColor: '#91B275',
    borderWidth: 0,
    height: 32,
  },
  selectedCategoryChip: {
    backgroundColor: '#96B76E',
  },
  categoryChipText: {
    color: '#5F7A3D',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: '#E9F6E9',
    borderRadius: 6,
  },
  footerText: {
    fontWeight: '600',
    color: '#040404',
  },
  footerTextDescription: {
    color: '#4B4B4B',
  },
});
