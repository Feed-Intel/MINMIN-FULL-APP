import { useGetOrder, useUpdateOrder } from '@/services/mutation/orderMutation';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { Text, Button, Card, Divider, DataTable } from 'react-native-paper';
import { Order } from '@/types/orderTypes';
import { useQueryClient } from '@tanstack/react-query';
import { i18n as I18n } from '@/app/_layout';

export default function AcceptOrders() {
  const { orderId } = useLocalSearchParams();
  const { data: order } = useGetOrder(orderId as string);
  const subtotal = useMemo(
    () =>
      order?.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [order]
  );
  const serviceCharge =
    (subtotal ?? 0 * ((order?.tenant as any)?.service_charge ?? 0)) / 100;
  const tax = (subtotal ?? 0 * ((order?.tenant as any)?.tax ?? 0)) / 100;
  const total = (subtotal || 0) + serviceCharge + tax;
  const updateOrderStatus = useUpdateOrder();
  const queryClient = useQueryClient();

  const handleStatusUpdate = useCallback(
    async (orderId: string, status: Order['status']) => {
      try {
        await updateOrderStatus.mutate({ id: orderId, order: { status } });
        queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      } catch (error) {}
    },
    [queryClient, updateOrderStatus]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{I18n.t('acceptOrders.header')}</Text>

      {/* Customer Info */}
      <View style={styles.row}>
        <TextInput
          placeholder={I18n.t('acceptOrders.placeholderCustomerName')}
          style={styles.input}
          value={
            typeof order?.customer == 'string'
              ? order.customer
              : order?.customer.full_name
          }
          aria-disabled
        />
        <TextInput
          placeholder={I18n.t('acceptOrders.placeholderContactNumber')}
          style={styles.input}
          value={
            typeof order?.customer == 'string'
              ? order.customer
              : order?.customer.phone
          }
          aria-disabled
        />
      </View>
      <View style={styles.row}>
        <TextInput
          placeholder={I18n.t('acceptOrders.placeholderTinNumber')}
          style={styles.input}
          aria-disabled
          value={
            (typeof order?.customer == 'object' && order.customer.phone) ||
            undefined
          }
        />
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
          </DataTable.Header>
          {order?.items.map((item) => {
            return (
              <DataTable.Row key={item.id} style={[styles.row]}>
                <DataTable.Cell style={[styles.cell, { flex: 1 }]}>
                  <View>
                    <Text numberOfLines={1} style={styles.cellText}>
                      {item.menu_item_name}
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
                  <Text style={styles.cellText}>{item.remarks}</Text>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 0.9 }]}>
                  <Text
                    numberOfLines={1}
                    style={[styles.cellText, { paddingRight: 55 }]}
                  >
                    {(order?.tenant as any).tax ?? 0 / 100}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell style={[styles.cell, { flex: 1 }]}>
                  <Text numberOfLines={2} style={styles.cellText}>
                    {item.price * item.quantity}
                  </Text>
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
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202B189E' }}>
              {I18n.t('acceptOrders.discount')}
            </Text>
            <Text style={{ color: '#202B189E' }}>
              {order?.discount_amount?.toFixed(2)}
            </Text>
          </View>
          <Divider style={{ marginVertical: 6 }} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>
              {I18n.t('acceptOrders.summaryTotal')}
            </Text>
            <Text style={styles.totalValue}>
              ${(total - (Number(order?.discount_amount) || 0)).toFixed(2)}
            </Text>
          </View>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            style={styles.acceptButton}
            labelStyle={{ color: '#fff' }}
            onPress={() => handleStatusUpdate(order?.id as string, 'progress')}
          >
            {I18n.t('acceptOrders.acceptButton')}
          </Button>
          <Button
            mode="outlined"
            style={styles.cancelButton}
            labelStyle={{ color: '#000' }}
            onPress={() => handleStatusUpdate(order?.id as string, 'cancelled')}
          >
            {I18n.t('acceptOrders.cancelButton')}
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
});
