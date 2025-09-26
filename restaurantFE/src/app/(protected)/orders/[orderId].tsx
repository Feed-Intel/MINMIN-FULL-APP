import { useGetOrder, useUpdateOrder } from '@/services/mutation/orderMutation';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, Button, Card, Divider, DataTable } from 'react-native-paper';
import DeleteIcon from '@/assets/icons/Delete.svg';
import { Order } from '@/types/orderTypes';
import { useQueryClient } from '@tanstack/react-query';

export default function AcceptOrders() {
  const shipping = 5;
  const tax = 5;
  const { orderId } = useLocalSearchParams();
  const { data: order, isLoading } = useGetOrder(orderId as string);
  const subtotal = useMemo(
    () =>
      order?.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [order]
  );
  const total = subtotal || 0 + shipping + tax;
  const updateOrderStatus = useUpdateOrder();
  const queryClient = useQueryClient();
  // const formatCurrency = (amount: number | null | undefined) => {
  //   if (amount === null || amount === undefined) return 'ETB 0';
  //   const numeric = Number(amount) || 0;
  //   return `ETB ${numeric.toLocaleString()}`;
  // };

  // const handleDelete = (id: number) => {
  //   setItems(items.filter((item) => item.id !== id));
  // };

  const handleStatusUpdate = useCallback(
    async (orderId: string, status: Order['status']) => {
      try {
        await updateOrderStatus.mutateAsync({ id: orderId, order: { status } });
        queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        // setSnackbarMessage("Order status updated successfully");
        // setSnackbarVisible(true);
      } catch (error) {
        // setSnackbarMessage("Failed to update order status");
        // setSnackbarVisible(true);
      }
    },
    [queryClient, updateOrderStatus]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Accept Orders</Text>

      {/* Customer Info */}
      <View style={styles.row}>
        <TextInput
          placeholder="Customer name"
          style={styles.input}
          value={
            typeof order?.customer == 'string'
              ? order.customer
              : order?.customer.full_name
          }
          aria-disabled
        />
        <TextInput
          placeholder="Contact number"
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
          placeholder="TIN number"
          style={styles.input}
          aria-disabled
          value={
            (typeof order?.customer == 'object' && order.customer.phone) ||
            undefined
          }
        />
        <Button
          mode="contained"
          style={styles.addButton}
          labelStyle={{ color: '#fff' }}
        >
          + Add item
        </Button>
      </View>

      <View style={styles.tableWrapper}>
        <DataTable>
          <DataTable.Header style={styles.tableHeader}>
            <DataTable.Title style={[styles.headerCell, { flex: 1.6 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                Name
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.2 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                Price
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.1 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                Qty
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                Remark
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.6 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                TAX
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.4 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                Total
              </Text>
            </DataTable.Title>
            <DataTable.Title style={[styles.headerCell, { flex: 1.5 }]}>
              <Text variant="bodyMedium" style={styles.headerCellText}>
                Action
              </Text>
            </DataTable.Title>
          </DataTable.Header>
          {order?.items.map((item) => {
            // const nextStatus = getNextStatus(order.status);
            // const statusMeta = STATUS_DISPLAY[order.status] ?? {
            //   label: order.status.replace(/_/g, ' '),
            //   borderColor: '#D6DCCD',
            //   backgroundColor: '#EEF1EB',
            //   textColor: '#21281B',
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
                    // variant={isSmallScreen ? 'bodySmall' : 'bodyMedium'}
                    style={[styles.cellText, { paddingRight: 55 }]}
                  >
                    {'Tax'}
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
                <DataTable.Cell style={[styles.cell, { flex: 1 }]}>
                  <TouchableOpacity>
                    <DeleteIcon color={'#91B275'} height={25.55} />
                  </TouchableOpacity>
                </DataTable.Cell>
                {/* <DataTable.Cell style={[styles.cell, { flex: 1.4 }]}> */}
                {/* <Text style={styles.cellText}>
                    {formatCurrency(order.total_price)}
                  </Text> */}
                {/* </DataTable.Cell> */}
                {/* <DataTable.Cell style={[styles.cell, { flex: 1.5 }]}>
                  {nextStatus ? (
                    <Button
                      mode="outlined"
                      compact
                      // onPress={
                      // }
                      style={styles.actionButton}
                      labelStyle={styles.actionButtonLabel}
                    >
                      {nextStatus.label}
                    </Button>
                  ) : (
                    <View
                      style={[
                        styles.statusPill,
                        {
                          borderColor: statusMeta.borderColor,
                          backgroundColor: statusMeta.backgroundColor,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: statusMeta.textColor,
                          fontWeight: '600',
                        }}
                      >
                        {statusMeta.label}
                      </Text>
                    </View>
                  )}
                </DataTable.Cell> */}
              </DataTable.Row>
            );
          })}
        </DataTable>
      </View>

      {/* Order Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content style={{ flex: 1 }}>
          <Text style={{ color: '#21281B', fontWeight: 'bold' }}>
            Order Summary
          </Text>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202B189E' }}>Subtotal</Text>
            <Text style={{ color: '#202B189E' }}>${subtotal?.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202B189E' }}>Shipping</Text>
            <Text style={{ color: '#202B189E' }}>${shipping.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={{ color: '#202B189E' }}>Tax</Text>
            <Text style={{ color: '#202B189E' }}>${tax.toFixed(2)}</Text>
          </View>
          <Divider style={{ marginVertical: 6 }} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </Card.Content>
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            style={styles.acceptButton}
            labelStyle={{ color: '#fff' }}
            onPress={() => handleStatusUpdate(order?.id as string, 'progress')}
          >
            Accept order
          </Button>
          <Button
            mode="outlined"
            style={styles.cancelButton}
            labelStyle={{ color: '#000' }}
            onPress={() => handleStatusUpdate(order?.id as string, 'cancelled')}
          >
            Cancel order
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
