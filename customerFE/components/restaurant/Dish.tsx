import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  setRemarks as addRemarks,
} from "@/lib/reduxStore/cartSlice";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { RootState } from "@/lib/reduxStore/store";
import { useGetMenu } from "@/services/mutation/menuMutation";
import { StarRating } from "../stars/ratingStars";
import { TextInput } from "react-native";

type Dish = {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  tags: string[];
  category: string;
  is_side: boolean;
  average_rating?: number;
};

type DishRowProps = {
  item: Dish;
  restaurantId: string;
  branchId: string;
  tableId: string;
  onAddItem?: (itemId: string) => void;
  isRelated?: boolean;
  relatedItems?: Dish[]; // Related items prop
};

export const DishRow = ({
  item,
  restaurantId,
  branchId,
  tableId,
  onAddItem,
  isRelated = false,
  relatedItems = [], // Default to empty array
}: DishRowProps) => {
  const dispatch = useDispatch();
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const quantity =
    cartItems.find((cartItem) => cartItem.id === item.id)?.quantity || 0;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const scaleValue = new Animated.Value(0);

  const closeModal = () => {
    setShowFullDescription(false);
    Animated.timing(scaleValue, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setShowDetailModal(false));
  };

  const modalScale = scaleValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const openModal = () => {
    setShowDetailModal(true);
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleAddItem = () => {
    if (onAddItem) {
      onAddItem(item.id);
    }
    if (quantity > 0) {
      dispatch(
        updateQuantity({
          id: item.id,
          quantity: quantity + 1,
        })
      );
    } else {
      dispatch(
        addToCart({
          item: {
            ...item,
            quantity: 1,
            price: parseFloat(item.price),
          },
          restaurantId,
          branchId,
          tableId,
          paymentAPIKEY: "",
          paymentPUBLICKEY: "",
          tax: 0,
          serviceCharge: 0,
        })
      );
    }
    dispatch(addRemarks(remarks));
  };

  const handleRemoveItem = () => {
    if (quantity > 1) {
      dispatch(
        updateQuantity({
          id: item.id,
          quantity: quantity - 1,
        })
      );
    } else {
      dispatch(removeFromCart(item.id));
    }
  };

  // Handle adding related items to cart
  const handleAddRelatedItem = (relatedItem: Dish) => {
    const existingItem = cartItems.find((item) => item.id === relatedItem.id);
    if (existingItem) {
      dispatch(
        updateQuantity({
          id: relatedItem.id,
          quantity: existingItem.quantity + 1,
        })
      );
    } else {
      dispatch(
        addToCart({
          item: {
            ...relatedItem,
            quantity: 1,
            price: parseFloat(relatedItem.price),
          },
          restaurantId,
          branchId,
          tableId,
          paymentAPIKEY: "",
          paymentPUBLICKEY: "",
          tax: 0,
          serviceCharge: 0,
        })
      );
    }
  };

  // Handle removing related items from cart
  const handleRemoveRelatedItem = (relatedItem: Dish) => {
    const existingItem = cartItems.find((item) => item.id === relatedItem.id);
    if (existingItem) {
      if (existingItem.quantity > 1) {
        dispatch(
          updateQuantity({
            id: relatedItem.id,
            quantity: existingItem.quantity - 1,
          })
        );
      } else {
        dispatch(removeFromCart(relatedItem.id));
      }
    }
  };

  // Function to truncate text to 2 lines
  const truncateDescription = (text: string) => {
    const maxLength = 70; // Adjust based on your font size and container width
    if (text?.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, isRelated && styles.relatedContainer]}
        onPress={openModal}
      >
        <Image
          style={styles.image}
          source={{ uri: item.image?.replace("http://", "https://") }}
        />
        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text
            style={styles.description}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {truncateDescription(item.description)}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.price}>ETB {item.price}</Text>
            {quantity > 0 ? (
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  onPress={handleRemoveItem}
                  style={styles.quantityButton}
                  disabled={quantity === 0}
                >
                  <Feather name="minus" size={20} color={Colors.light.tint} />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  onPress={handleAddItem}
                  style={styles.quantityButton}
                >
                  <Feather name="plus" size={20} color={Colors.light.tint} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleAddItem}
                style={styles.orderNowButton}
              >
                <Text style={styles.orderNowText}>Order Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showDetailModal}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalBackdrop}>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ scale: modalScale }] },
              ]}
            >
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeModal}
                  >
                    <Feather name="x" size={24} color="black" />
                  </TouchableOpacity>
                  <View style={styles.modalHeader}>
                    <Image
                      source={{
                        uri: item.image?.replace("http://", "https://"),
                      }}
                      style={styles.modalImage}
                    />
                    <View style={styles.modalHeaderDetails}>
                      <Text style={styles.modalTitle}>{item.name}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setShowFullDescription(!showFullDescription)
                        }
                        activeOpacity={0.8}
                      >
                        <Text
                          style={styles.modalDescription}
                          numberOfLines={showFullDescription ? 0 : 2}
                        >
                          {item.description}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.modalQuantityContainer}>
                        <Text style={styles.modalPrice}>ETB {item.price}</Text>
                        <View style={styles.modalQuantityControls}>
                          <TouchableOpacity
                            onPress={handleRemoveItem}
                            style={styles.quantityButton}
                            disabled={quantity === 0}
                          >
                            <Feather name="minus" size={20} color={"black"} />
                          </TouchableOpacity>
                          <Text style={styles.quantityText}>{quantity}</Text>
                          <TouchableOpacity
                            onPress={handleAddItem}
                            style={styles.quantityButton}
                          >
                            <Feather name="plus" size={20} color={"black"} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                  <ScrollView style={styles.modalDetails}>
                    <Text style={styles.sectionTitle}>
                      Special Instructions
                    </Text>
                    <TextInput
                      style={styles.instructionsInput}
                      placeholder="Add special instructions here..."
                      placeholderTextColor="#999"
                      value={remarks[item.id] || ""}
                      onChangeText={(text) =>
                        setRemarks((prev) => ({ ...prev, [item.id]: text }))
                      }
                      multiline
                      numberOfLines={1}
                      underlineColorAndroid="transparent"
                    />

                    {relatedItems.length > 0 && (
                      <>
                        <Text style={styles.sectionTitle}>Related Items</Text>
                        <View style={styles.relatedItemsContainer}>
                          {relatedItems.map((relatedItem) => {
                            const relatedQuantity =
                              cartItems.find(
                                (cartItem) => cartItem.id === relatedItem.id
                              )?.quantity || 0;
                            return (
                              <View
                                key={relatedItem.id}
                                style={styles.relatedItem}
                              >
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                  }}
                                >
                                  {relatedItem.image && (
                                    <Image
                                      source={{
                                        uri: relatedItem.image.replace(
                                          "http://",
                                          "https://"
                                        ),
                                      }}
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 6,
                                        marginRight: 10,
                                      }}
                                    />
                                  )}
                                  <View style={styles.relatedItemText}>
                                    <Text
                                      style={styles.relatedItemName}
                                      numberOfLines={1}
                                      ellipsizeMode="tail"
                                    >
                                      {relatedItem.name}
                                    </Text>
                                    <Text
                                      style={styles.relatedItemDescription}
                                      numberOfLines={2}
                                      ellipsizeMode="tail"
                                    >
                                      {truncateDescription(
                                        relatedItem.description
                                      )}
                                    </Text>
                                    <Text style={styles.relatedItemPrice}>
                                      ETB {relatedItem.price}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.relatedItemControls}>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleRemoveRelatedItem(relatedItem)
                                    }
                                    disabled={relatedQuantity === 0}
                                    style={[
                                      styles.relatedItemButton,
                                      relatedQuantity === 0 &&
                                        styles.disabledButton,
                                    ]}
                                  >
                                    <Feather
                                      name="minus"
                                      size={16}
                                      color={
                                        relatedQuantity > 0 ? "black" : "black"
                                      }
                                    />
                                  </TouchableOpacity>
                                  <Text style={styles.relatedQuantityText}>
                                    {relatedQuantity}
                                  </Text>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleAddRelatedItem(relatedItem)
                                    }
                                    style={styles.relatedItemButton}
                                  >
                                    <Feather
                                      name="plus"
                                      size={16}
                                      color={"black"}
                                    />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </>
                    )}
                  </ScrollView>
                  <View style={styles.cartButtonContainer}>
                    <TouchableOpacity
                      onPress={handleAddItem}
                      style={styles.cartButton}
                    >
                      <Text style={styles.cartButtonText}>
                        {quantity > 0 ? "Update Bowl" : "Add to Bowl"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFCF5",
    marginBottom: 1,
    padding: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D3D3D3",
    height: 120,
  },
  relatedContainer: {
    backgroundColor: "#E9E9E9",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
  },
    detailsContainer: {
      flex: 1,
      justifyContent: "space-between",
      paddingVertical: 4,
    },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 18,
    height: 36, // 2 lines * 18 lineHeight
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: -8,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  orderNowButton: {
    backgroundColor: "#9AC26B",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  orderNowText: {
    color: "black",
    fontWeight: "500",
    fontSize: 14,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 4,
  },
  quantityButton: {
    width: 20,
    height: 20,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 40,
    textAlign: "center",
    color: "#333",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "90%",
    borderRadius: 24,
    overflow: "hidden",
  },
  modalContent: {
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#FFFCF5",
  },
    modalImage: {
      width: 120,
      height: 120,
      borderRadius: 12,
      marginRight: 16,
    },
  modalHeaderDetails: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  modalDescription: {
    fontSize: 15,
    color: "#666",
    marginBottom: 10,
    lineHeight: 22,
  },
  modalPrice: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 0,
  },
  modalQuantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
    borderRadius: 12,
  },
  modalQuantityControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 2,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 8,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  modalDetails: {
    padding: 10,
    marginBottom: 60,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    marginTop: 2,
  },
  instructionsInput: {
    backgroundColor: "#E9E9E9",
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
    textAlignVertical: "top",
    borderRadius: 30,
    padding: 12,
    borderWidth: 0,
  },
  relatedItemsContainer: {
    marginBottom: 50,
  },
  relatedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E9E9E9",
    borderRadius: 12,
    padding: 5,
    marginBottom: 12,
  },
    relatedItemText: {
      flex: 1,
      justifyContent: "space-between",
    },
  relatedItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  relatedItemDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    lineHeight: 18,
    height: 36, // 2 lines * 18 lineHeight
    flex: 1,
  },
  relatedItemPrice: {
    fontSize: 14,
    color: "#9AC26B",
  },
  relatedItemControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E9E9E9",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 0,
    paddingVertical: 4,
    minWidth: 80,
  },
  relatedItemButton: {
    padding: 3,
  },
  relatedQuantityText: {
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 30,
    textAlign: "center",
    color: "black",
  },
  disabledButton: {
    opacity: 0.5,
  },
  cartButtonContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  cartButton: {
    backgroundColor: "#9AC26B",
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  cartButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
