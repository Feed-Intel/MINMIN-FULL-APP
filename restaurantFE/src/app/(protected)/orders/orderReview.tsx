import { useAppSelector } from '@/lib/reduxStore/hooks';
import { RootState } from '@/lib/reduxStore/store';
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, Button, Card, Divider, DataTable } from 'react-native-paper';
import { router } from 'expo-router';
import DeleteIcon from '@/assets/icons/Delete.svg';
import { useDispatch } from 'react-redux';
import { clearCart, updateQuantity } from '@/lib/reduxStore/cartSlice';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';
import { useCreateOrder } from '@/services/mutation/orderMutation';
import { useQueryClient } from '@tanstack/react-query';
import { i18n as I18n } from '@/app/_layout';

export default function AcceptOrders() {
  const cartItems = useAppSelector((state: RootState) => state.cart.items);
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = 5;
  const tax = 5;
  const total = subtotal + shipping + tax;
  const remarks = useAppSelector((state: RootState) => state.cart.remarks);
  const MenuTax = useAppSelector((state: RootState) => state.cart.tax);
  const cart = useAppSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();
  const { mutateAsync: createOrder } = useCreateOrder();
  const { tenantId, branchId } = useRestaurantIdentity();
  const queryClient = useQueryClient();

  const newQuantities = cartItems.reduce((acc: any, item: any) => {
    acc[item.id] = item.quantity;
    return acc;
  }, {} as Record<string, number>);
  const handleQuantityChange = (id: string) => {
    dispatch(
      updateQuantity({
        id,
        quantity: Math.max((newQuantities[id] || 0) - 1, 0),
      })
    );
  };

  const handlePlaceOrder = async () => {
    const orderData = {
      tenant: tenantId,
      branch: branchId,
      customer_name: cart.customerName,
      customer_phone: cart.contactNumber,
      customer_tinNo: cart.tinNumber,
      table: '',
      coupon: '',
      items: cartItems.map((item: any) => ({
        menu_item: item.id,
        quantity: newQuantities[item.id] || 1,
        price: item.price,
        remarks: remarks[item.id],
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{I18n.t('orderReview.header')}</Text>

      {/* Customer Info */}
      <View
        style={{
          ...styles.row,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#5E6E4933',
          padding: 10,
          width: 400,
        }}
      >
        <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 18 }}>
          {I18n.t('orderReview.customerInfoTitle')}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ color: '#000', fontWeight: 'bold' }}>
            {I18n.t('orderReview.customerNameLabel')}: {cart.customerName}
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ color: '#000', fontWeight: 'bold' }}>
            {I18n.t('orderReview.customerContactLabel')}: {cart.contactNumber}
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row' }}>
            <Text style={{ color: '#000', fontWeight: 'bold' }}>
              {I18n.t('orderReview.customerTinLabel')}: {cart.tinNumber}
            </Text>
          </View>
          <Button
            mode="contained"
            style={styles.addButton}
            labelStyle={{ color: '#fff' }}
            onPress={() => router.back()}
          >
            {I18n.t('orderReview.editInfoButton')}
          </Button>
        </View>
      </View>

      <View style={styles.tableWrapper}>
        <DataTable>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title style={[styles.headerCell, { flex: 1.6 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('orderReview.tableName')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.2 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('orderReview.tablePrice')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.1 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('orderReview.tableQty')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('orderReview.tableRemark')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.6 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('orderReview.tableTax')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.4 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('orderReview.tableTotal')}
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.5 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                {I18n.t('orderReview.tableAction')}
              </Text>
            </DataTable.Title>
          </DataTable.Header>
          {cartItems.map((it) => {
            return (
              <DataTable.Row key={it.id} style={[styles.row]}>
                <DataTable.Cell style={[styles.cell, { flex: 1.6 }]}>
                  <View>
                    <Text
                      numberOfLines={1}
                      // variant={isSmallScreen ? 'bodySmall' : 'bodyMedium'}
                      style={styles.cellText}
                    >
                      {it.name}
                    </Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 1.2 }]}>
                  <Text variant="bodySmall" style={{ color: '#40392B' }}>
                    {it.price}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell
                  style={[styles.cell, { flex: 1.1, paddingLeft: 20 }]}
                >
                  <View style={[styles.channelBadge]}>
                    <Text style={styles.channelBadgeText}>{it.quantity}</Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 1.2 }]}>
                  <Text style={styles.cellText}>{remarks[it.id] || ''}</Text>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 1.6 }]}>
                  <Text
                    numberOfLines={1}
                    // variant={isSmallScreen ? 'bodySmall' : 'bodyMedium'}
                    style={styles.cellText}
                  >
                    {MenuTax}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 1.6 }]}>
                  <Text
                    numberOfLines={2}
                    // variant={isSmallScreen ? 'bodySmall' : 'bodyMedium'}
                    style={styles.cellText}
                  >
                    {it.price * it.quantity}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 1.4 }]}>
                  <TouchableOpacity
                    onPress={() => {
                      handleQuantityChange(it.id);
                    }}
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
            {I18n.t('orderReview.summaryTitle')}
          </Text>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202B189E' }}>
              {I18n.t('orderReview.summarySubtotal')}
            </Text>
            <Text style={{ color: '#202B189E' }}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202B189E' }}>
              {I18n.t('orderReview.summaryShipping')}
            </Text>
            <Text style={{ color: '#202B189E' }}>${shipping.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202B189E' }}>
              {I18n.t('orderReview.summaryTax')}
            </Text>
            <Text style={{ color: '#202B189E' }}>${tax.toFixed(2)}</Text>
          </View>
          <Divider style={{ marginVertical: 6 }} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>
              {I18n.t('orderReview.summaryTotalLabel')}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#EFF4EB',
  },
  header: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  row: {
    flexDirection: 'column',
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
    backgroundColor: '#91B275',
    width: 150,
  },
  card: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
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
    color: '#21281B',
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
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    flex: 1,
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
});
