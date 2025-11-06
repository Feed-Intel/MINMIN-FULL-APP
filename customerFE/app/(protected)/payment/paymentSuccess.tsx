import React, { use, useEffect } from 'react';
import { Alert, Platform, StyleSheet } from 'react-native';
import { Card, Text, Button, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { i18n } from '@/app/_layout';
import { useCreateOrder } from '@/services/mutation/orderMutation';
import { useCreatePayment } from '@/services/mutation/paymentMutation';
import { useDispatch } from 'react-redux';
import { clearCart } from '@/lib/reduxStore/cartSlice';

const PaymentSuccessScreen = () => {
  const { mutateAsync: createOrder } = useCreateOrder();
  const { mutateAsync: createPayment } = useCreatePayment();
  const dispatch = useDispatch();
  useEffect(() => {
    if (Platform.OS === 'web') {
      const unparsedOrderData = localStorage.getItem('orderData');
      const transactionID = localStorage.getItem('transactionID');
      const amount = localStorage.getItem('amount');
      const orderData = JSON.parse(unparsedOrderData || '{}');
      createOrder(orderData, {
        onSuccess: (data: any) => {
          createPayment(
            {
              order: data.id,
              payment_method: 'chapa',
              amount_paid: amount,
              transaction_id: transactionID,
            },
            {
              onSuccess: () => {
                dispatch(clearCart());
                setTimeout(() => {
                  router.replace('/(protected)/orderHistory');
                }, 500);
              },
            }
          );
        },
        onError: () => {
          Alert.alert(
            i18n.t('error_toast_title'),
            i18n.t('failed_to_place_order_alert')
          );
        },
      });
    }
  }, []);
  return (
    <SafeAreaView style={styles.container}>
      <Card style={styles.card}>
        <IconButton
          icon="check-circle"
          size={60}
          iconColor="green"
          style={{ alignSelf: 'center' }}
        />
        <Text variant="headlineMedium" style={styles.title}>
          {i18n.t('payment_successful_title')}
        </Text>
        <Text variant="bodyMedium" style={styles.message}>
          {i18n.t('payment_successful_message')}
        </Text>

        <Button
          mode="contained"
          onPress={() => router.replace('/(protected)/orderHistory')}
          style={styles.button}
        >
          {i18n.t('view_orders_button')}
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.replace('/(protected)/feed')}
          style={styles.button}
        >
          {i18n.t('go_to_home_button')}
        </Button>
      </Card>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  card: {
    width: '90%',
    padding: 20,
    elevation: 4,
  },
  title: {
    marginTop: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#666',
  },
  label: {
    marginTop: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  input: {
    marginVertical: 10,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
});

export default PaymentSuccessScreen;
