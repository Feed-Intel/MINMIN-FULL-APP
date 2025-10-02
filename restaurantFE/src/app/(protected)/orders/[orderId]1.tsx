import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  Text,
  Card,
  RadioButton,
  ActivityIndicator,
  Chip,
  Divider,
} from 'react-native-paper';
import { useGetOrder, useUpdateOrder } from '@/services/mutation/orderMutation';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';

const OrderAdminPage = () => {
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { orderId } = useLocalSearchParams();
  const { data: order, isLoading } = useGetOrder(orderId as string);
  const { mutateAsync: updateOrderStatus } = useUpdateOrder();

  // Screen size breakpoints
  const isSmallScreen = width < 768;

  const handleStatusChange = async (status: string) => {
    await updateOrderStatus(
      {
        id: orderId as string,
        order: { status },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <ActivityIndicator
        size={isSmallScreen ? 'large' : 'small'}
        style={styles.loader}
      />
    );
  }

  if (!order) {
    return <Text style={styles.errorText}>Order not found</Text>;
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'placed':
        return '#FFA500';
      case 'progress':
        return '#2196F3';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text
        style={[
          styles.header,
          {
            fontSize: isSmallScreen ? 20 : 24,
            marginBottom: isSmallScreen ? 12 : 16,
          },
        ]}
      >
        Manage Order
      </Text>

      <Card style={[styles.card, { padding: isSmallScreen ? 12 : 16 }]}>
        <Card.Title
          title={`Order: ${order.order_id}`}
          titleNumberOfLines={2}
          subtitle={`Table: ${order.table?.table_code || 'N/A'}`}
          subtitleStyle={styles.subtitle}
        />

        <Card.Content style={styles.content}>
          <View style={styles.statusContainer}>
            <Text variant="labelLarge">Current Status:</Text>
            <Chip
              style={{ backgroundColor: getStatusColor(order.status) }}
              textStyle={styles.chipText}
            >
              {order.status.toUpperCase()}
            </Chip>
          </View>

          <View style={styles.detailSection}>
            <Text variant="bodyMedium">
              Customer:{' '}
              {typeof order.customer === 'object'
                ? order.customer.full_name
                : order.customer || 'N/A'}
            </Text>
            <Text variant="bodyMedium">Total: ${order.total_price}</Text>
          </View>

          <Divider style={styles.divider} />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Order Items:
          </Text>
          {order.items.map((item, index) => (
            <View key={item.id} style={styles.itemContainer}>
              <Text variant="bodyMedium">
                {item.quantity}x {item.menu_item_name} - $
                {(item.quantity * item.price).toFixed(2)}
              </Text>
              {item.remarks && (
                <Text variant="bodySmall" style={styles.remarks}>
                  Remarks: {item.remarks}
                </Text>
              )}
              {index < order.items.length - 1 && <Divider />}
            </View>
          ))}

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Update Status:
          </Text>
          <RadioButton.Group
            onValueChange={handleStatusChange}
            value={order.status}
          >
            <View
              style={[
                styles.radioGroup,
                { flexDirection: isSmallScreen ? 'column' : 'row' },
              ]}
            >
              <RadioButton.Item
                label="Placed"
                value="placed"
                mode={isSmallScreen ? 'android' : 'ios'}
                labelStyle={styles.radioLabel}
              />
              <RadioButton.Item
                label="Progress"
                value="progress"
                mode={isSmallScreen ? 'android' : 'ios'}
                labelStyle={styles.radioLabel}
              />
              <RadioButton.Item
                label="Delivered"
                value="delivered"
                mode={isSmallScreen ? 'android' : 'ios'}
                labelStyle={styles.radioLabel}
              />
              <RadioButton.Item
                label="Cancelled"
                value="cancelled"
                mode={isSmallScreen ? 'android' : 'ios'}
                labelStyle={styles.radioLabel}
              />
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  header: {
    fontWeight: '600',
    textAlign: 'center',
    color: '#2c3e50',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
  },
  content: {
    paddingVertical: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  detailSection: {
    gap: 8,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: '#34495e',
    fontWeight: '500',
  },
  itemContainer: {
    gap: 4,
    paddingVertical: 12,
  },
  remarks: {
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  radioGroup: {
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  radioLabel: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 14,
    color: '#95a5a6',
  },
  errorText: {
    textAlign: 'center',
    margin: 20,
    color: '#e74c3c',
  },
});

export default OrderAdminPage;
