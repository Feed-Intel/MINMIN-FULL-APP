import { useCreateOrder } from '@/services/mutation/orderMutation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Divider,
  DataTable,
  Portal,
  Modal,
  Checkbox,
  Chip,
  Searchbar,
} from 'react-native-paper';
import DeleteIcon from '@/assets/icons/Delete.svg';
import { useQueryClient } from '@tanstack/react-query';
import { i18n as I18n } from '@/app/_layout';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/lib/reduxStore/hooks';
import { router } from 'expo-router';
import { PlusCircleIcon as PlusIcon } from 'lucide-react-native';
import { RootState } from '@/lib/reduxStore/store';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';
import {
  addToCart,
  clearCart,
  setCustomerInfo,
  updateQuantity,
} from '@/lib/reduxStore/cartSlice';
import { useGetMenus } from '@/services/mutation/menuMutation';
import Toast from 'react-native-toast-message';

const DEFAULT_CATEGORIES = ['Main course', 'Pasta', 'Dessert', 'Drinks'];
export default function AcceptOrders() {
  const queryClient = useQueryClient();
  const [showRelatedModal, setShowRelatedModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [modalSelectedCategory, setModalSelectedCategory] = useState('All');
  const dispatch = useDispatch();
  const cart = useAppSelector((state: RootState) => state.cart);
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const serviceCharge = (subtotal * (cart.serviceCharge ?? 0)) / 100;
  const tax = (subtotal * (cart.tax ?? 0)) / 100;
  const total = (subtotal || 0) + serviceCharge + tax;
  const { data: menus, isLoading: isMenusLoading } = useGetMenus(
    undefined,
    true
  );
  const { branchId, tenantId } = useRestaurantIdentity();
  const { mutateAsync: createOrder } = useCreateOrder();
  const newQuantities = cart.items.reduce((acc: any, item: any) => {
    acc[item.id] = item.quantity;
    return acc;
  }, {} as Record<string, number>);
  useEffect(() => {
    setSelectedItems(cart.items.map((item) => item.id));
  }, [cart.items]);

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

  const handlePlaceOrder = async () => {
    if (
      cart.customerName === '' ||
      cart.contactNumber === '' ||
      cart.tinNumber === ''
    ) {
      Toast.show({
        type: 'error',
        text1: I18n.t('Common.error_title'),
        text2: I18n.t('createOrderScreen.errorCustomerInfo'),
      });
      return;
    }
    const orderData = {
      tenant: tenantId,
      branch: branchId,
      customer_name: cart.customerName,
      customer_phone: cart.contactNumber,
      customer_tinNo: cart.tinNumber,
      table: '',
      coupon: '',
      items: cart.items.map((item: any) => ({
        menu_item: item.id,
        quantity: newQuantities[item.id] || 1,
        price: item.price,
        remarks: cart.remarks[item.id],
      })),
    };
    // const transactionID = generateTransactionID();
    await createOrder(orderData);
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    dispatch(clearCart());
    router.replace('/(protected)/orders');
  };

  const handleCancelOrder = () => {
    dispatch(clearCart());
    router.replace('/(protected)/orders');
  };

  const modalFilteredMenus = menus?.filter((menu) => {
    // if (selectedItems.includes(menu.id || '')) {
    //   return false;
    // }
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

  const handleAddRelatedItem = () => {
    selectedItems.map((Ritem) => {
      const existingItem: any = cart.items.find((item) => item.id === Ritem);
      if (!existingItem) {
        const item = modalFilteredMenus?.find((t: any) => t.id === Ritem);
        console.log(item);
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

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleQuantityChangeDelete = (id: string) => {
    dispatch(
      updateQuantity({
        id,
        quantity: Math.max((newQuantities[id] || 0) - 1, 0),
      })
    );
  };

  const handleQuantityChangeAdd = (id: string) => {
    dispatch(
      updateQuantity({
        id,
        quantity: Math.max((newQuantities[id] || 0) + 1, 0),
      })
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{I18n.t('acceptOrders.header')}</Text>

      {/* Customer Info */}
      <View style={styles.row}>
        <TextInput
          placeholder={I18n.t('acceptOrders.placeholderCustomerName')}
          style={styles.input}
          value={cart.customerName}
          onChangeText={(text: string) => {
            dispatch(setCustomerInfo({ customerName: text }));
          }}
        />
        <TextInput
          placeholder={I18n.t('acceptOrders.placeholderContactNumber')}
          style={styles.input}
          value={cart.contactNumber}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9.]/g, '');
            dispatch(setCustomerInfo({ contactNumber: cleaned }));
          }}
        />
      </View>
      <View style={styles.row}>
        <TextInput
          placeholder={I18n.t('acceptOrders.placeholderTinNumber')}
          style={styles.input}
          value={cart.tinNumber}
          onChangeText={(text) => {
            dispatch(setCustomerInfo({ tinNumber: text }));
          }}
        />
        <Button
          mode="contained"
          style={styles.addButton}
          labelStyle={{ color: '#fff' }}
          onPress={() => setShowRelatedModal(true)}
        >
          {I18n.t('acceptOrders.addItemButton')}
        </Button>
      </View>

      <View style={styles.tableWrapper}>
        <DataTable>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title style={[styles.headerCell, { flex: 1.6 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('acceptOrders.tableHeaderName')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.2 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('acceptOrders.tableHeaderPrice')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.1 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('acceptOrders.tableHeaderQty')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('acceptOrders.tableHeaderRemark')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.6 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('acceptOrders.tableHeaderTax')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.4 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('acceptOrders.tableHeaderTotal')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.5 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('acceptOrders.tableHeaderAction')}
              </Text>
            </DataTable.Title>
          </DataTable.Header>
          {cart?.items.map((item) => {
            // const nextStatus = getNextStatus(order.status);
            // const statusMeta = STATUS_DISPLAY[order.status] ?? {
            //  label: order.status.replace(/_/g, ' '),
            //  borderColor: '#D6DCCD',
            //  backgroundColor: '#EEF1EB',
            //  textColor: '#21281B',
            // };
            // const orderChannel = getChannelFromOrder(order);
            // const isHighlighted = Boolean(highlightedOrders[order.id]);

            return (
              <DataTable.Row
                key={item.id}
                // onPress={() => openOrderDetail(order.id)}
                style={[
                  styles.row,
                  // isHighlighted && styles.highlightedRow
                ]}
              >
                <DataTable.Cell style={[styles.cell, { flex: 1 }]}>
                  <View>
                    <Text
                      numberOfLines={1}
                      // variant={isSmallScreen ? 'bodySmall' : 'bodyMedium'}
                      style={styles.cellText}
                    >
                      {item.name}
                    </Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 1 }]}>
                  <Text variant="bodySmall" style={styles.cellText}>
                    {item.price}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 0.7 }]}>
                  <View style={styles.channelBadge}>
                    <Text style={styles.channelBadgeText}>{item.quantity}</Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 1 }]}>
                  <Text style={styles.cellText}>
                    {cart.remarks[item.id] || ''}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 0.9 }]}>
                  <Text
                    numberOfLines={1}
                    // variant={isSmallScreen ? 'bodySmall' : 'bodyMedium'}
                    style={[styles.cellText, { paddingRight: 55 }]}
                  >
                    {cart.tax ?? 0 / 100}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 1 }]}>
                  <Text
                    numberOfLines={2}
                    // variant={isSmallScreen ? 'bodySmall' : 'bodyMedium'}
                    style={styles.cellText}
                  >
                    {item.price * item.quantity}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 1, rowGap: 10 }]}>
                  <TouchableOpacity
                    onPress={() => handleQuantityChangeAdd(item.id)}
                  >
                    <PlusIcon color={'#91B275'} height={25.55} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleQuantityChangeDelete(item.id)}
                  >
                    <DeleteIcon color={'#91B275'} height={25.55} />
                  </TouchableOpacity>
                </DataTable.Cell>
              </DataTable.Row>
            );
          })}
        </DataTable>
      </View>

      {/* Order Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content style={{ flex: 1 }}>
          <Text style={{ color: '#21281B', fontWeight: 'bold' }}>
            {I18n.t('acceptOrders.summaryHeader')}
          </Text>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202B189E' }}>
              {I18n.t('acceptOrders.summarySubtotal')}
            </Text>
            <Text style={{ color: '#202B189E' }}>${subtotal?.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202B189E' }}>
              {I18n.t('acceptOrders.serviceCharge')}
            </Text>
            <Text style={{ color: '#202B189E' }}>
              ${serviceCharge.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202B189E' }}>
              {I18n.t('acceptOrders.summaryTax')}
            </Text>
            <Text style={{ color: '#202B189E' }}>${tax.toFixed(2)}</Text>
          </View>
          <Divider style={{ marginVertical: 6 }} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>
              {I18n.t('acceptOrders.summaryTotal')}
            </Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            style={styles.acceptButton}
            labelStyle={{ color: '#fff' }}
            onPress={handlePlaceOrder}
          >
            {I18n.t('orderReview.placeOrderButton')}
          </Button>
          <Button
            mode="outlined"
            style={styles.cancelButton}
            labelStyle={{ color: '#000' }}
            onPress={handleCancelOrder}
          >
            {I18n.t('orderReview.cancelOrderButton')}
          </Button>
        </Card.Actions>
      </Card>
      <Portal>
        <Modal
          visible={showRelatedModal}
          onDismiss={() => setShowRelatedModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.searchContainer}>
              <Searchbar
                placeholder={I18n.t('createOrderScreen.modalSearchPlaceholder')}
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
                  {I18n.t('menus.category.' + category)}
                </Chip>
              ))}
            </ScrollView>

            <ScrollView style={styles.itemsContainer}>
              {modalFilteredMenus?.map((menu: any) => {
                const categories = getMenuCategories(menu);
                const categoriesLabel = categories.length
                  ? categories.join(', ')
                  : I18n.t('createOrderScreen.noCategory');

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
                disabled={selectedItems.length === 0}
              >
                {I18n.t('createOrderScreen.modalAddItemButton')}
              </Button>
              <Text style={styles.selectedItemsText}>
                {I18n.t('createOrderScreen.modalItemsSelected', {
                  count: selectedItems.length,
                })}
              </Text>
            </View>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#EFF4EB',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    width: 600,
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
  addButton: {
    marginBottom: 16,
    backgroundColor: '#91B275',
  },
  card: {
    marginBottom: 12,
  },
  // itemRow: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   marginVertical: 6,
  // },
  // itemName: {
  //   fontSize: 16,
  //   fontWeight: '500',
  // },
  qtyInput: {
    flex: 0.3,
    marginRight: 8,
  },
  remarkInput: {
    flex: 0.7,
  },
  summaryCard: {
    marginTop: 16,
    backgroundColor: '#D7E0CF',
    height: 270,
    width: 430,
    borderRadius: 10,
    alignSelf: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#202B189E',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  acceptButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#91B275',
  },
  cancelButton: {
    flex: 1,
    marginLeft: 8,
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  tableWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E5DC',
    backgroundColor: '#EFF4EB',
  },
  headerCell: {
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  actionButton: {
    borderColor: '#6E504933',
    borderRadius: 999,
  },
  highlightedRow: {
    backgroundColor: '#F1F8E9',
  },
  headerCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  cellText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  actionButtonLabel: {
    color: '#281D1B',
    fontSize: 14,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    flex: 1,
    justifyContent: 'center',
  },
  channelBadge: {
    backgroundColor: '#EEF1EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  channelBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3A4A2A',
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
});
