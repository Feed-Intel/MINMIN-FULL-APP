import { useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";
import { WebView } from "react-native-webview";
import { useAppSelector } from "@/lib/reduxStore/hooks";
import { useCreateOrder } from "@/services/mutation/orderMutation";
import { useDispatch } from "react-redux";
import { clearCart } from "@/lib/reduxStore/cartSlice";
import { useCreatePayment } from "@/services/mutation/paymentMutation";

const PaymentWebView = () => {
  const { paymentID } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [webViewKey, setWebViewKey] = useState(Date.now());
  const discount = useAppSelector((state) => state.cart.discount);
  const cartItems = useAppSelector((state) => state.cart.items);
  const branch = useAppSelector((state) => state.cart.branchId);
  const remarks = useAppSelector((state) => state.cart.remarks);
  const restaurant = useAppSelector((state) => state.cart.restaurantId);
  const table = useAppSelector((state) => state.cart.tableId);
  const coupon = useAppSelector((state) => state.cart.coupon);
  const { mutate: createOrder } = useCreateOrder();
  const { mutate: createPayment } = useCreatePayment();
  const transationId = useAppSelector((state) => state.cart.restaurantId);
  const dispatch = useDispatch();
  const updTable =
    table === null || table === undefined || table === "null" ? "" : table;

  const newQuantities = cartItems.reduce((acc: any, item: any) => {
    acc[item.id] = item.quantity;
    return acc;
  }, {} as Record<string, number>);
  const subtotal = cartItems.reduce(
    (sum: any, dish: any) => sum + dish.price * (newQuantities[dish.id] || 0),
    0
  );

  useEffect(() => {
    return () => {
      // Cleanup effect to reset WebView when component unmounts
      setWebViewKey((prevKey) => prevKey + 1);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {Platform.OS === "web" ? (
        <iframe
          key={webViewKey}
          src={
            (process.env.EXPO_PUBLIC_CHAPA_CHECKOUT_URL! + paymentID) as string
          }
            style={{ flex: 1, border: 0 }}
          onLoad={() => setLoading(false)}
        />
      ) : (
        <WebView
          key={webViewKey} // Ensures a fresh WebView instance
          source={{
            uri: (process.env.EXPO_PUBLIC_CHAPA_CHECKOUT_URL! +
              paymentID) as string,
          }}
          onLoad={() => setLoading(false)}
          onNavigationStateChange={(navState) => {
            if (navState.url.includes("payment-receipt")) {
              const orderData = {
                tenant: restaurant,
                branch: branch,
                table: updTable,
                coupon: coupon,
                items: cartItems.map((item: any) => ({
                  menu_item: item.id,
                  quantity: newQuantities[item.id] || 1,
                  price: item.price,
                  remarks: remarks[item.id],
                })),
              };
              setLoading(true); // Show loading before navigating
              createOrder(orderData, {
                onSuccess: (data: any) => {
                  createPayment(
                    {
                      order: data.id as any,
                      payment_method: "chapa",
                      amount_paid: subtotal - discount,
                      transaction_id: transationId,
                    },
                    {
                      onSuccess: () => {
                        dispatch(clearCart());
                      },
                    }
                  );
                },
                onError: () => {
                  Alert.alert("Error", "Failed to place order");
                },
              });
              setTimeout(() => {
                setWebViewKey((prevKey) => prevKey + 1); // Unmount and remount WebView
                router.replace({
                  pathname: "/(protected)/payment/paymentSuccess",
                  params: {},
                });
              }, 500);
            }
          }}
        />
      )}
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator animating={true} size="large" color="#96B76E" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
});

export default PaymentWebView;
