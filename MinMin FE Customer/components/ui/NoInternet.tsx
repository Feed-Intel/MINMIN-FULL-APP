import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const NoInternet = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <MaterialCommunityIcons name="wifi-off" size={64} color="#FF6B6B" />
          <Text style={styles.title}>No Internet Connection</Text>
          <Text style={styles.subtitle}>
            Please check your connection and try again.
          </Text>
          <Button
            mode="contained"
            onPress={onRetry}
            style={styles.button}
            icon="refresh"
          >
            Try Again
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

export default NoInternet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  card: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    marginTop: 16,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginVertical: 12,
  },
  button: {
    marginTop: 16,
    width: "60%",
  },
});
