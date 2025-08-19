import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { FontAwesome } from "@expo/vector-icons"; // Example icon library

const OrderConfirmationScreen: React.FC = () => {
  // Dummy data
  const orderNumber = "12345";
  const eta = "30 minutes";
  const total = 50.75;
  const items = [
    { name: "Pizza Margherita", quantity: 2, price: 12.99 },
    { name: "Cheese Garlic Bread", quantity: 1, price: 5.49 },
    { name: "Coke", quantity: 3, price: 1.99 },
  ];

  return (
    <View style={styles.container}>
      <FontAwesome name="check-circle" size={80} color="green" />
      <Text style={styles.title}>Order Confirmed!</Text>
      <Text style={styles.subtitle}>Order #{orderNumber}</Text>
      <Text style={styles.subtitle}>Estimated Delivery: {eta}</Text>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        {items.map((item) => (
          <View key={item.name} style={styles.itemRow}>
            <Text style={styles.itemText}>
              {item.quantity} x {item.name}
            </Text>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalText}>${total.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.trackButton}
        onPress={() => router.push("/(orderTracking)" as any)}
      >
        <Text style={styles.trackButtonText}>Track Order</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OrderConfirmationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "gray",
    marginVertical: 5,
  },
  summaryContainer: {
    width: "100%",
    padding: 20,
    backgroundColor: "#f1f1f1",
    borderRadius: 10,
    marginVertical: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  itemText: {
    fontSize: 18,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 10,
  },
  totalText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  trackButton: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  trackButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
