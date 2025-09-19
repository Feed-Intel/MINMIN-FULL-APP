import { useGetMenu } from "@/services/mutation/menuMutation";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Title, Paragraph, Chip, Button } from "react-native-paper";
import { Colors } from "@/constants/Colors";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/reduxStore/store";
import { i18n } from "@/app/_layout";
import { normalizeImageUrl } from "@/utils/imageUrl";

const MenuItemPage = () => {
  const { menuID } = useLocalSearchParams();
  const { data: item } = useGetMenu(menuID as string);
  const [modalVisible, setModalVisible] = useState(false);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const quantity =
    cartItems.find((cartItem) => cartItem.id === menuID)?.quantity || 0;

  const handleAddToCart = () => {
    setModalVisible(false);
  };

  const handleRemoveItem = () => {
    console.log("Remove item clicked (functionality not implemented)");
  };

  const handleAddItem = () => {
    console.log("Add item clicked (functionality not implemented)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Card style={styles.card}>
          <Card.Cover
            source={{ uri: normalizeImageUrl(item?.image) }}
            style={styles.image}
          />
          <Card.Content>
            <Title style={styles.title}>{item?.name}</Title>
            <Paragraph style={styles.description}>
              {item?.description}
            </Paragraph>
            <View style={styles.chipContainer}>
              {item?.tags.map((tag, index) => (
                <Chip key={index} style={styles.chip}>
                  {tag}
                </Chip>
              ))}
            </View>
            <Paragraph style={styles.price}>
              {i18n.t("currency_symbol")}
              {Number(item?.price).toFixed(2)}
            </Paragraph>
            {item?.is_side && (
              <Chip icon="food" style={styles.sideDish}>
                {i18n.t("side_dish_label")}
              </Chip>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="cart" size={24} color="#fff" />
        <Text style={styles.addToCartText}>{i18n.t("add_to_cart_button")}</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Title style={styles.modalTitle}>
              {i18n.t("select_quantity_title")}
            </Title>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={handleRemoveItem}
                // style={styles.quantityButton} // Commented out as in original
                disabled={quantity === 0}
              >
                <Feather name="minus" size={20} color={Colors.light.tint} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                onPress={handleAddItem} // Added onPress for handleAddItem
                // style={styles.quantityButton} // Commented out as in original
              >
                <Feather name="plus" size={20} color={Colors.light.tint} />
              </TouchableOpacity>
            </View>
            <Button mode="contained" onPress={handleAddToCart}>
              {i18n.t("confirm_button")}
            </Button>
            <Button onPress={() => setModalVisible(false)}>
              {i18n.t("cancel_button")}
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  card: {
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 3,
  },
  image: {
    height: 200,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 16,
    color: "#333",
  },
  description: {
    fontSize: 16,
    marginTop: 8,
    color: "#666",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 8,
  },
  chip: {
    margin: 4,
    backgroundColor: "#ddd",
  },
  sideDish: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  price: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginTop: 16,
  },
  addToCartButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#ff6600",
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },
  addToCartText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  quantityText: {
    fontSize: 18,
    marginHorizontal: 16,
  },
});

export default MenuItemPage;
