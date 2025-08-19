import React, { useState, useRef, useEffect } from "react";
import {
  ScrollView,
  Modal,
  Alert, // Keeping Alert for now as per previous instruction, but will replace if a Toast equivalent is available for all cases.
  Platform,
  StyleSheet,
  View,
  Animated,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RelativePathString, router } from "expo-router";
import {
  Appbar,
  Card,
  Button,
  List,
  RadioButton,
  Text,
} from "react-native-paper";
import { TextInput } from "react-native"; // Using react-native's TextInput for placeholder styling
import { MaterialIcons } from "@expo/vector-icons";
import { useCreateOrder } from "@/services/mutation/orderMutation";
import { useCheckDiscount } from "@/services/mutation/discountMutation";
import {
  clearCart,
  setDiscount,
  setTransactionId,
} from "@/lib/reduxStore/cartSlice";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/lib/reduxStore/hooks";
import { generateTransactionID } from "@/utils/transactionIDGenerator";
import { initializePayment } from "@/utils/chapaPaymentRequest";
import { useGetUser } from "@/services/mutation/authMutation";
import { useCreatePayment } from "@/services/mutation/paymentMutation";
import { useAuth } from "@/context/auth";
import { ThemedView } from "@/components/ThemedView";
import { useLocalSearchParams } from "expo-router";
import { i18n } from "@/app/_layout";

export default function CheckoutScreen() {
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const contentAnimation = useRef(new Animated.Value(0)).current;
  const discount = useAppSelector((state) => state.cart.discount);
  const [discountCode, setDiscountCode] = useState("");
  const cartItems = useAppSelector((state) => state.cart.items);
  const [orderId] = useState(""); // This is not being set, consider if it's needed or can be removed
  const redeem_amount = useAppSelector((state) => state.cart.redeemAmount);
  const [total, setTotal] = useState(0); // This state isn't directly used for final calculation in render, consider removing or using it
  const [discountInput, setDiscountInput] = useState("");
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountResponse, setDiscountResponse] = useState(""); // This is not being used to display response, consider removing or implementing
  const remarks = useAppSelector((state) => state.cart.remarks);
  const paymentAPI = useAppSelector((state) => state.cart.paymentAPIKEY);
  const paymentPublicKey = useAppSelector(
    (state) => state.cart.paymentPUBLICKEY
  );
  const taxRate = useAppSelector((state) => state.cart.tax);
  const serviceChargeRate = useAppSelector((state) => state.cart.serviceCharge);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const branch = useAppSelector((state) => state.cart.branchId);
  const restaurant = useAppSelector((state) => state.cart.restaurantId);
  const table = useAppSelector((state) => state.cart.tableId);
  const { user: userInfo } = useAuth();
  const { data: user } = useGetUser(
    userInfo?.user_id ? userInfo?.user_id : userInfo?.id!
  );
  const { mutate: createPayment } = useCreatePayment();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const dispatch = useDispatch();
  const updTable =
    table === null || table === undefined || table === "null" ? "" : table;
  const newQuantities = cartItems.reduce((acc: any, item: any) => {
    acc[item.id] = item.quantity;
    return acc;
  }, {} as Record<string, number>);
  const [tempDiscount, setTempDiscount] = useState(discount);
  const checkDiscount = useCheckDiscount();
  const subtotal = cartItems.reduce(
    (sum: any, dish: any) => sum + dish.price * (newQuantities[dish.id] || 0),
    0
  );
  const tax = subtotal * (taxRate! / 100);
  const serviceCharge = subtotal * (serviceChargeRate! / 100);
  const params = useLocalSearchParams();
  const previousScreen = params.from as "cart" | "restaurant" | undefined;
  const restaurantId = params.restaurantId as string;
  const branchs = params.branchId as string;
  const menus = params.menus as string;
  const tableId = params.tableId as string;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnimation, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnimation, contentAnimation]);

  const handleApplyDiscount = async () => {
    try {
      const itemsData = cartItems.map((item: any) => ({
        menu_item: item.id,
        quantity: newQuantities[item.id] || 0,
        price: item.price,
      }));

      const discountResponse = await checkDiscount.mutateAsync({
        tenant: restaurant,
        branch: branch,
        coupon: discountCode,
        items: itemsData,
      });
      const discountValue = discountResponse.discount_amount || 0;
      setTempDiscount(discountValue);
      dispatch(setDiscount(discountValue));
      setTotal(subtotal - discountValue); // Update total state
    } catch (error) {
      console.error("Error applying discount:", error);
      // Optionally show a toast or alert for discount application failure
    }
  };

  const createOrder = useCreateOrder();

  const handlePlaceOrder = async () => {
    const orderData = {
      tenant: restaurant,
      branch: branch,
      table: updTable,
      coupon: discountCode,
      items: cartItems.map((item: any) => ({
        menu_item: item.id,
        quantity: newQuantities[item.id] || 1,
        price: item.price,
        remarks: remarks[item.id],
      })),
    };
    const transactionID = generateTransactionID();
    if (paymentMethod === "cash") {
      createOrder.mutate(orderData, {
        onSuccess: (data: any) => {
          setShowSuccessModal(true);
          createPayment(
            {
              order: data.id,
              payment_method: "cash",
              amount_paid: (
                subtotal +
                serviceCharge +
                tax -
                (tempDiscount + redeem_amount)
              ).toFixed(2),
              transaction_id: transactionID,
            },
            {
              onSuccess: () => {
                dispatch(clearCart());
                setTempDiscount(0);
              },
            }
          );
        },
        onError: () => {
          Alert.alert(
            i18n.t("error_toast_title"),
            i18n.t("failed_to_place_order_alert")
          ); // Replaced hardcoded string
        },
      });
    } else {
      dispatch(setTransactionId(transactionID));
      const paymentDetail = await initializePayment(
        user,
        subtotal + serviceCharge + tax - (tempDiscount + redeem_amount),
        transactionID,
        paymentAPI?.toString() || ""
      );
      const indexOfLast = paymentDetail.data.checkout_url.lastIndexOf("/");
      const paymentID = paymentDetail.data.checkout_url.substring(
        indexOfLast + 1
      );
      router.push(`/(protected)/payment/${paymentID}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.appbarContainer,
            {
              opacity: headerAnimation,
              transform: [
                {
                  translateY: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Appbar.Header style={styles.appbar}>
            <Appbar.BackAction
              onPress={() => {
                if (previousScreen === "restaurant") {
                  router.push({
                    pathname: "/(protected)/restaurant/(branch)",
                    params: {
                      restaurantId,
                      branchId: JSON.stringify(branchs),
                      tableId,
                      menus: menus,
                      from: "/(protected)/checkOut",
                    },
                  });
                } else {
                  router.push("/(protected)/cart");
                }
              }}
            />
            <Appbar.Content
              title={i18n.t("order_summary_title")} // Replaced hardcoded string
              titleStyle={styles.appbarTitle}
            />
          </Appbar.Header>
        </Animated.View>

        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: contentAnimation,
              transform: [
                {
                  translateY: contentAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingContainer}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.card}>
                <Card.Title
                  title={i18n.t("order_summary_title")} // Replaced hardcoded string
                  titleStyle={styles.cardTitle}
                />
                <View style={styles.discountContainer}>
                  <TextInput
                    placeholder={i18n.t("discount_code_placeholder")} // Replaced hardcoded string
                    value={discountCode}
                    onChangeText={setDiscountCode}
                    style={styles.discountInput}
                    placeholderTextColor="gray" // Added for consistency with other TextInputs
                  />
                  <Button
                    mode="contained"
                    onPress={handleApplyDiscount}
                    style={styles.applyButton}
                    theme={{ colors: { primary: "#9AC26B" } }}
                    labelStyle={{ fontSize: 14, color: "#000" }}
                  >
                    {i18n.t("apply_button")} {/* Replaced hardcoded string */}
                  </Button>
                </View>
                {cartItems.map((item: any, index: any) => (
                  <View key={index}>
                    <View style={styles.summaryRow}>
                      <List.Subheader style={styles.itemName}>
                        {`${item.name} x ${newQuantities[item.id] || 1}`}
                      </List.Subheader>
                      <List.Subheader style={styles.itemPrice}>
                        {item.price.toFixed(2)}
                      </List.Subheader>
                    </View>
                    {remarks[item.id] && (
                      <View style={styles.remarkContainer}>
                        <Text style={styles.remarkLabel}>
                          {i18n.t("remark_label")}
                        </Text>
                        <Text style={styles.remarkText}>
                          {remarks[item.id]}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
                <View style={styles.summaryRow}>
                  <List.Subheader style={styles.itemName}>
                    {i18n.t("tax_label")} ({taxRate}%)
                  </List.Subheader>
                  <List.Subheader style={styles.itemPrice}>
                    {tax.toFixed(2)}
                  </List.Subheader>
                </View>
                <View style={styles.summaryRow}>
                  <List.Subheader style={styles.itemName}>
                    {i18n.t("service_charge_label")} ({serviceChargeRate}%)
                  </List.Subheader>
                  <List.Subheader style={styles.itemPrice}>
                    {serviceCharge.toFixed(2)}
                  </List.Subheader>
                </View>
                <View style={styles.summaryRow}>
                  <List.Subheader style={styles.itemName}>
                    {i18n.t("subtotal_label")} {/* Replaced hardcoded string */}
                  </List.Subheader>
                  <List.Subheader style={styles.itemPrice}>
                    {subtotal.toFixed(2)}
                  </List.Subheader>
                </View>
                <View style={styles.summaryRow}>
                  <List.Subheader style={styles.itemName}>
                    {i18n.t("discount_label")} {/* Replaced hardcoded string */}
                  </List.Subheader>
                  <List.Subheader style={styles.itemPrice}>
                    -{tempDiscount.toFixed(2)}
                  </List.Subheader>
                </View>
                <View style={styles.summaryRow}>
                  <List.Subheader style={styles.itemName}>
                    {i18n.t("redeem_amount_label")}{" "}
                    {/* Replaced hardcoded string */}
                  </List.Subheader>
                  <List.Subheader style={styles.discountValue}>
                    - {redeem_amount.toFixed(2)}
                  </List.Subheader>
                </View>
                <View style={styles.summaryRow}>
                  <List.Subheader style={styles.boldText}>
                    {i18n.t("total_label")} {/* Replaced hardcoded string */}
                  </List.Subheader>
                  <List.Subheader style={styles.boldText}>
                    {(subtotal + serviceCharge + tax - tempDiscount).toFixed(2)}{" "}
                    {i18n.t("currency_unit")} {/* Replaced hardcoded string */}
                  </List.Subheader>
                </View>
              </View>
            </ScrollView>
            <View style={styles.fixedBottom}>
              <View style={styles.paymentCard}>
                <Card.Title
                  title={i18n.t("payment_method_title")} // Replaced hardcoded string
                  titleStyle={styles.cardTitle}
                />
                <RadioButton.Group
                  onValueChange={(value) => setPaymentMethod(value)}
                  value={paymentMethod}
                >
                  <RadioButton.Item
                    label={i18n.t("cash_payment_method")} // Replaced hardcoded string
                    value="cash"
                    color="#9AC26B"
                    rippleColor="#9AC26B"
                    uncheckedColor="#9AC26B"
                    labelStyle={{
                      fontSize: 17,
                      color: "#222C169E",
                      opacity: 0.9,
                    }}
                    style={{ marginBottom: -14, marginTop: -14 }}
                  />
                  <RadioButton.Item
                    label={i18n.t("chapa_payment_method")} // Replaced hardcoded string
                    value="chapa"
                    color="#9AC26B"
                    rippleColor="#9AC26B"
                    uncheckedColor="#9AC26B"
                    labelStyle={{
                      fontSize: 17,
                      color: "#222C169E",
                      opacity: 0.9,
                    }}
                  />
                </RadioButton.Group>
              </View>

              {Platform.OS === "web" && paymentMethod === "chapa" && (
                <form
                  method="POST"
                  action="https://api.chapa.co/v1/hosted/pay"
                  style={{ margin: "0 auto", minWidth: 353 }}
                >
                  <input
                    type="hidden"
                    name="public_key"
                    value={paymentPublicKey}
                  />
                  <input
                    type="hidden"
                    name="tx_ref"
                    value={generateTransactionID()}
                  />
                  <input
                    type="hidden"
                    name="amount"
                    value={
                      subtotal +
                      serviceCharge +
                      tax -
                      (tempDiscount + redeem_amount)
                    }
                  />
                  <input
                    type="hidden"
                    name="currency"
                    value={i18n.t("currency_unit")} // Replaced hardcoded string
                  />
                  <input type="hidden" name="email" value={user.email} />
                  <input
                    type="hidden"
                    name="first_name"
                    value={user?.full_name?.split(" ")[0] || ""}
                  />
                  <input
                    type="hidden"
                    name="last_name"
                    value={user?.full_name?.split(" ")[1] || ""}
                  />
                  <input
                    type="hidden"
                    name="title"
                    value={i18n.t("chapa_title")} // Replaced hardcoded string
                  />
                  <input
                    type="hidden"
                    name="description"
                    value={i18n.t("chapa_description")} // Replaced hardcoded string
                  />
                  <input
                    type="hidden"
                    name="logo"
                    value="https://chapa.link/asset/images/chapa_swirl.svg"
                  />
                  <input
                    type="hidden"
                    name="return_url"
                    value="https://customer.feed-intel.com/orderHistory"
                  />
                  <input type="hidden" name="meta[title]" value="test" />
                  <button
                    type="submit"
                    style={{
                      marginTop: 16,
                      marginBottom: 16,
                      borderRadius: 30,
                      color: "#22281B",
                      height: 50,
                      width: 353,
                      border: "none",
                      fontWeight: "bold",
                      fontSize: 17,
                      display: "block",
                      textAlign: "center",
                      background: "#9AC26B",
                      ...Platform.select({
                        web: {
                          maxWidth: 353,
                          width: "100%",
                          alignSelf: "center",
                        },
                      }),
                    }}
                  >
                    {i18n.t("place_order_button")}{" "}
                    {/* Replaced hardcoded string */}
                  </button>
                </form>
              )}

              {!(Platform.OS === "web" && paymentMethod === "chapa") && (
                <Button
                  mode="contained"
                  onPress={handlePlaceOrder}
                  style={styles.placeOrderButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={{
                    fontSize: 17,
                    fontWeight: "bold",
                    color: "#22281B",
                  }}
                  theme={{ colors: { primary: "#9AC26B" } }}
                >
                  {i18n.t("place_order_button")}
                  {/* Replaced hardcoded string */}
                </Button>
              )}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>

        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
              <Text style={styles.modalTitle}>
                {i18n.t("order_successful_modal_title")}{" "}
                {/* Replaced hardcoded string */}
              </Text>
              <Text style={styles.modalSubtitle}>
                {i18n.t("order_successful_modal_subtitle")}{" "}
                {/* Replaced hardcoded string */}
              </Text>
              <Text style={styles.modalItemsTitle}>
                {i18n.t("ordered_items_modal_title")}{" "}
                {/* Replaced hardcoded string */}
              </Text>
              {cartItems.map((item: any, index: any) => (
                <Text key={index} style={styles.modalItem}>
                  {item.name} x {newQuantities[item.id] || 1}
                </Text>
              ))}
              <Button
                mode="contained"
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push({
                    pathname: "/(protected)/feed",
                  });
                }}
                style={styles.modalButton}
                theme={{ colors: { primary: "#9AC26B" } }}
              >
                {i18n.t("return_to_home_button")}{" "}
                {/* Replaced hardcoded string */}
              </Button>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showDiscountModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDiscountModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {i18n.t("apply_discount_modal_title")}
              </Text>
              <TextInput
                placeholder={i18n.t("enter_discount_code_placeholder")}
                value={discountInput}
                onChangeText={setDiscountInput}
                style={styles.modalInput}
                placeholderTextColor="gray" // Added for consistency
              />
              <Button
                mode="contained"
                onPress={handleApplyDiscount}
                style={styles.modalButton}
                theme={{ colors: { primary: "#9AC26B" } }}
              >
                {i18n.t("apply_discount_modal_button")}{" "}
                {/* Replaced hardcoded string */}
              </Button>
              {discountResponse && (
                <Text style={styles.discountResponseText}>
                  {discountResponse}
                </Text>
              )}
              <Button
                mode="contained"
                onPress={() => {
                  setShowDiscountModal(false);
                  router.push({
                    pathname: "/(protected)/payment" as RelativePathString,
                    params: {
                      cartItems: JSON.stringify(cartItems),
                      newQuantities: JSON.stringify(newQuantities),
                      subtotal: subtotal.toString(),
                      discount: (discount + tempDiscount).toString(),
                      total: total.toString(),
                      order: orderId,
                    },
                  });
                }}
                style={styles.modalButton}
                theme={{ colors: { primary: "#9AC26B" } }}
              >
                {i18n.t("proceed_to_payment_button")}{" "}
                {/* Replaced hardcoded string */}
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowDiscountModal(false);
                  router.push({
                    pathname: "/(protected)/payment" as RelativePathString,
                    params: {
                      cartItems: JSON.stringify(cartItems),
                      newQuantities: JSON.stringify(newQuantities),
                      subtotal: subtotal.toString(),
                      discount: discount.toString(),
                      total: total.toString(),
                      restaurantId: restaurant,
                      branchId: branch,
                      order: orderId,
                      tableId: table,
                    },
                  });
                }}
                style={styles.modalButton}
                theme={{ colors: { primary: "#9AC26B" } }}
              >
                {i18n.t("pay_without_discount_button")}{" "}
                {/* Replaced hardcoded string */}
              </Button>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFDFC",
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  appbarContainer: {
    ...Platform.select({
      web: {
        maxWidth: 800,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  appbar: {
    backgroundColor: "#FDFDFC",
  },
  appbarTitle: {
    fontWeight: "600",
    color: "#333",
    alignSelf: "center",
    marginLeft: -20,
  },
  contentContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        maxWidth: 800,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Platform.OS === "web" ? 5 : 3,
    paddingBottom: 20,
  },
  fixedBottom: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 16,
    backgroundColor: "#FDFDFC",
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#FDFDFC",
    borderRadius: 12,
    ...Platform.select({
      web: {
        // boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      },
    }),
  },
  paymentCard: {
    marginBottom: 16,
    padding: 0,
  },
  cardTitle: {
    fontWeight: "400",
    fontSize: 17,
    color: "#333",
  },
  discountContainer: {
    flexDirection: "row",
    marginVertical: 8,
    ...Platform.select({
      web: {
        maxWidth: 380,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  discountInput: {
    flexGrow: 1,
    marginRight: 8,
    backgroundColor: "#546D3617",
    borderRadius: 40,
    paddingVertical: 8,
    color: "gray",
    paddingHorizontal: 16,
  },
  applyButton: {
    borderRadius: 30,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    margin: -4,
  },
  itemName: {
    fontSize: 17,
    color: "#222C169E",
    opacity: 0.9,
  },
  itemPrice: {
    fontSize: 17,
    color: "#222C169E",
    opacity: 0.9,
  },
  boldText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  discountValue: {
    fontSize: 17,
    color: "#388e3c",
  },
  remarkContainer: {
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginVertical: 4,
  },
  remarkLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  remarkText: {
    fontSize: 14,
    color: "#666",
  },
  placeOrderButton: {
    marginTop: 16,
    marginBottom: Platform.OS === "ios" ? 50 : 16,
    borderRadius: 30,
    width: 353,
    height: 50,
    alignSelf: "center",
    alignContent: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        maxWidth: 353,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  buttonContent: {
    // paddingVertical: 2, // This was commented out in the original, keeping it as is.
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FDFDFC",
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      web: {
        maxWidth: 400,
        width: "100%",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      },
      default: {
        width: "90%",
      },
    }),
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  modalItemsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  modalItem: {
    fontSize: 16,
    color: "#333",
    marginTop: 8,
  },
  modalButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  modalInput: {
    marginVertical: 12,
    backgroundColor: "#fff",
    color: "#9AC26B",
  },
  discountResponseText: {
    marginTop: 12,
    color: "#4CAF50",
    fontSize: 16,
    textAlign: "center",
  },
});
