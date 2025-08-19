import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
  Modal as RNModal,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { Chip, TextInput } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  addToCart,
  clearCartError,
  removeFromCart,
  updateQuantity,
  setRemarks as addRemarks,
} from "@/lib/reduxStore/cartSlice";
import {
  useGetMenu,
  useGetRelatedMenus,
} from "@/services/mutation/menuMutation";
import { RootState } from "@/lib/reduxStore/store";

const MenuItemModal = ({
  menuId,
  branchId,
  restaurantId,
  onDismiss,
}: {
  menuId?: string;
  branchId?: string;
  restaurantId?: string;
  onDismiss: () => void;
}) => {
  const { data: item, isLoading: loading } = useGetMenu(menuId as string);
  const { data: fetchAllRelatedItems = [] } = useGetRelatedMenus();
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const dispatch = useDispatch();
  const {
    items: cartItems,
    restaurantId: currentRestaurantId,
    branchId: currentBranchId,
    error: cartError,
  } = useSelector((state: RootState) => state.cart);

  const filteredRelatedItems = useMemo(() => {
    if (!menuId || !fetchAllRelatedItems) {
      return fetchAllRelatedItems || [];
    }
    return fetchAllRelatedItems.filter(
      (related: any) => related.menu_item?.id === menuId
    );
  }, [menuId, fetchAllRelatedItems]);

  const quantity =
    cartItems?.find((cartItem) => cartItem.id === menuId)?.quantity || 1;

  // Handle cart errors
  useEffect(() => {
    if (cartError) {
      Toast.show({
        type: "error",
        text1: cartError,
      });
      dispatch(clearCartError());
    }
  }, [cartError, dispatch]);

  const handleAddToCart = () => {
    onDismiss();

    // Check if adding from a different restaurant or branch
    if (currentRestaurantId && currentBranchId) {
      if (
        currentRestaurantId !== restaurantId ||
        currentBranchId !== branchId
      ) {
        Toast.show({
          type: "error",
          text1: "You cannot add items from different restaurants or branches.",
        });
        return;
      }
    }

    const existingItem = cartItems.find((item) => item.id === menuId);
    if (!existingItem) {
      dispatch(
        addToCart({
          item: {
            ...item,
            id: item?.id!,
            name: item?.name!,
            description: item?.description!,
            image: item?.image!,
            quantity: 1,
            price: parseFloat(item?.price!),
          },
          restaurantId: restaurantId!,
          paymentAPIKEY: item?.tenant.CHAPA_API_KEY!,
          paymentPUBLICKEY: item?.tenant.CHAPA_PUBLIC_KEY!,
          tax: item?.tenant?.tax!,
          serviceCharge: item?.tenant?.service_charge!,
          branchId: branchId!,
          tableId: "",
        })
      );
      Toast.show({
        type: "success",
        text1: `${item?.name} added to cart`,
      });
    } else {
      dispatch(
        updateQuantity({
          id: menuId!,
          quantity: existingItem.quantity + 1,
        })
      );
      Toast.show({
        type: "info",
        text1: `${item?.name} quantity updated`,
      });
    }
    dispatch(addRemarks(remarks));
  };

  const handleAddItem = () => {
    if (quantity > 1) {
      dispatch(
        updateQuantity({
          id: item?.id as string,
          quantity: quantity + 1,
        })
      );
    } else {
      dispatch(
        addToCart({
          item: {
            ...item,
            id: item?.id!,
            name: item?.name!,
            description: item?.description!,
            image: item?.image!,
            quantity: 1,
            price: parseFloat(item?.price!),
          },
          restaurantId: restaurantId!,
          paymentAPIKEY: item?.tenant.CHAPA_API_KEY!,
          paymentPUBLICKEY: item?.tenant.CHAPA_PUBLIC_KEY!,
          tax: item?.tenant.tax!,
          serviceCharge: item?.tenant.service_charge!,
          branchId: branchId!,
          tableId: "",
        })
      );
      dispatch(
        updateQuantity({
          id: item?.id as string,
          quantity: quantity + 1,
        })
      );
    }
  };

  const handleRemoveItem = () => {
    if (!menuId) return;

    if (quantity > 1) {
      dispatch(
        updateQuantity({
          id: menuId,
          quantity: quantity - 1,
        })
      );
    } else {
      dispatch(removeFromCart(menuId));
    }
  };

  const handleAddRelatedItem = (relatedItem: any) => {
    const existingItem = cartItems.find(
      (item) => item.id === relatedItem.related_item.id
    );
    if (existingItem) {
      dispatch(
        updateQuantity({
          id: relatedItem.related_item.id,
          quantity: existingItem.quantity + 1,
        })
      );
    } else {
      dispatch(
        addToCart({
          item: {
            ...relatedItem.related_item,
            id: relatedItem.related_item.id,
            name: relatedItem.related_item.name,
            description: relatedItem.description,
            image: relatedItem.related_item.image,
            quantity: 1,
            price: parseFloat(relatedItem.related_item.price),
          },
          restaurantId: restaurantId!,
          paymentAPIKEY: relatedItem?.tenant.CHAPA_API_KEY!,
          paymentPUBLICKEY: relatedItem?.tenant.CHAPA_PUBLIC_KEY!,
          tax: relatedItem?.tenant.tax,
          serviceCharge: relatedItem?.tenant.service_charge,
          branchId: branchId!,
          tableId: "",
        })
      );
    }

    Toast.show({
      type: "success",
      text1: `${relatedItem.related_item.name} added to cart`,
    });
  };

  const handleRemoveRelatedItem = (relatedItem: any) => {
    const existingItem = cartItems.find((item) => item.id === relatedItem.id);
    if (existingItem && existingItem.quantity > 1) {
      dispatch(
        updateQuantity({
          id: relatedItem.id,
          quantity: existingItem.quantity - 1,
        })
      );
    } else if (existingItem && existingItem.quantity === 1) {
      dispatch(removeFromCart(relatedItem.id));
    }
  };

  const scaleValue = new Animated.Value(0);
  const [showModal, setShowModal] = useState(Boolean(menuId));

  useEffect(() => {
    if (menuId) {
      setShowModal(true);
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setShowModal(false));
    }
  }, [menuId]);

  const modalScale = scaleValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const closeModal = () => {
    Animated.timing(scaleValue, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setShowModal(false);
      onDismiss();
    });
  };

  return (
    <RNModal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={closeModal}
      style={{ minWidth: "95%" }}
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
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                  <View style={styles.modalHeader}>
                    <Image
                      source={{
                        uri: item?.image?.replace("http://", "https://"),
                      }}
                      style={styles.modalImage}
                    />
                    <View style={styles.modalHeaderDetails}>
                      <Text style={styles.modalTitle}>{item?.name}</Text>
                      <Text style={styles.modalDescription}>
                        {item?.description}
                      </Text>
                      <View style={styles.modalQuantityContainer}>
                        <Text style={styles.modalPrice}>
                          ETB {Number(item?.price).toFixed(2)}
                        </Text>
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

                  <View style={styles.detailsContainer}>
                    <Text style={styles.sectionTitle}>Category</Text>
                    <Text style={styles.categoryText}>{item?.category}</Text>

                    <Text style={styles.sectionTitle}>Tags</Text>
                    <View style={styles.chipContainer}>
                      {item?.tags.map((tag, index) => (
                        <Chip key={index} style={styles.chip}>
                          {tag}
                        </Chip>
                      ))}
                    </View>

                    <Text style={styles.sectionTitle}>
                      Special Instructions
                    </Text>
                    <TextInput
                      label=""
                      value={remarks[menuId as string] || ""}
                      onChangeText={(text) =>
                        setRemarks((prev) => ({
                          ...prev,
                          [menuId as string]: text,
                        }))
                      }
                      mode="outlined"
                      style={styles.remarkInput}
                      placeholder="E.g., No onions, extra sauce"
                      outlineStyle={{ borderRadius: 30 }}
                    />

                    {filteredRelatedItems.length > 0 && (
                      <>
                        <Text style={styles.sectionTitle}>Related Items</Text>
                        <View style={styles.relatedItemsContainer}>
                          {filteredRelatedItems.map((related: any) => {
                            const menuItem = related.related_item;
                            const cartQuantity =
                              cartItems.find((item) => item.id === menuItem.id)
                                ?.quantity || 0;

                            return (
                              <View
                                key={menuItem.id}
                                style={styles.relatedItem}
                              >
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    flex: 1, // Added flex:1 to ensure content wraps
                                  }}
                                >
                                  <Image
                                    source={{ uri: menuItem.image }}
                                    style={{
                                      width: 70,
                                      height: 70,
                                      borderRadius: 6,
                                      marginRight: 10,
                                    }}
                                  />
                                  <View style={styles.relatedItemText}>
                                    <Text
                                      style={styles.relatedItemName}
                                      numberOfLines={1}
                                      ellipsizeMode="tail"
                                    >
                                      {menuItem.name}
                                    </Text>
                                    <Text style={styles.relatedItemPrice}>
                                      ETB {Number(menuItem.price).toFixed(2)}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.relatedItemControls}>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleRemoveRelatedItem(menuItem)
                                    }
                                    disabled={cartQuantity === 0}
                                    style={[
                                      styles.relatedItemButton,
                                      cartQuantity === 0 &&
                                        styles.disabledButton,
                                    ]}
                                  >
                                    <Feather
                                      name="minus"
                                      size={16}
                                      color={
                                        cartQuantity > 0 ? "black" : "gray"
                                      }
                                    />
                                  </TouchableOpacity>
                                  <Text style={styles.relatedQuantityText}>
                                    {cartQuantity}
                                  </Text>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleAddRelatedItem(related)
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
                  </View>
                </ScrollView>
                <View style={styles.cartButtonContainer}>
                  <TouchableOpacity
                    onPress={handleAddToCart}
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
    </RNModal>
  );
};

const styles = StyleSheet.create({
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
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 8,
  },
  modalHeader: {
    flexDirection: "row",
    padding: 16,
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
    fontSize: 16,
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
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 30,
    textAlign: "center",
    color: "#333",
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    marginTop: 10,
  },
  categoryText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  chip: {
    margin: 4,
    backgroundColor: "#E9E9E9",
  },
  remarkInput: {
    backgroundColor: "#E9E9E9",
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
  },
  relatedItemsContainer: {
    marginBottom: 16,
  },
  relatedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E9E9E9",
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
      },
      web: {
        boxShadow: "0px 1px 3px rgba(0,0,0,0.2)",
      },
    }),
  },
  relatedItemText: {
    flex: 1,
    paddingRight: 10,
  },
  relatedItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  relatedItemPrice: {
    fontSize: 14,
    color: "#9AC26B",
    fontWeight: "bold",
  },
  relatedItemControls: {
    flexDirection: "row",
    alignItems: "center",
    // To make sure buttons are visually distinct, add a light background
    backgroundColor: "#F0F0F0", // A subtle grey background
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 4, // Reduced padding
    paddingVertical: 2, // Reduced padding
    minWidth: 90, // Adjusted minWidth to accommodate buttons and text
    justifyContent: "space-around", // Distribute space evenly
  },
  relatedItemButton: {
    padding: 6, // Increased padding for easier touch
    borderRadius: 15, // Make them circular
    backgroundColor: "#FFFFFF", // White background for the buttons themselves
    justifyContent: "center",
    alignItems: "center",
    width: 30, // Fixed width
    height: 30, // Fixed height
  },
  relatedQuantityText: {
    fontSize: 16,
    fontWeight: "bold",
    minWidth: 25, // Adjusted minWidth
    textAlign: "center",
    color: "black",
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: "#E0E0E0", // Lighter background for disabled button
  },
  cartButtonContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  cartButton: {
    backgroundColor: "#9AC26B",
    height: 42,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  cartButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollContainer: {
    paddingBottom: 16,
  },
});

export default MenuItemModal;
