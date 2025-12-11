import React, { useEffect, useState, useRef } from 'react';
import {
  Alert, // Keep Alert for now, but note that it should ideally be replaced with custom UI or Toast
  ScrollView,
  StyleSheet,
  View,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { IconButton, Button, Card, Text, Appbar } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { RootState } from '@/lib/reduxStore/store';
import {
  setRedeemAmount,
  updateQuantity,
  setDiscount,
  addToCart,
} from '@/lib/reduxStore/cartSlice';
import { router } from 'expo-router';
import { useAppSelector } from '@/lib/reduxStore/hooks';
import { useCheckDiscount } from '@/services/mutation/discountMutation';
import { ThemedView } from '@/components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { i18n } from '@/app/_layout';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { useGetMenus } from '@/services/mutation/menuMutation';

export default function CartScreen() {
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const contentAnimation = useRef(new Animated.Value(0)).current;
  const cartItems = useAppSelector((state: RootState) => state.cart.items);
  const branch = useAppSelector((state: RootState) => state.cart.branchId);
  const discount = useAppSelector((state: RootState) => state.cart.discount);
  const restaurant = useAppSelector(
    (state: RootState) => state.cart.restaurantId
  );
  const cart = useAppSelector((state: RootState) => state.cart);
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const serviceCharge = (subtotal * (cart.serviceCharge ?? 0)) / 100;
  const tax = (subtotal * (cart.tax ?? 0)) / 100;
  const [total, setTotal] = useState((subtotal || 0) + serviceCharge + tax);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const dispatch = useDispatch();
  const bottom = useBottomTabOverflow();
  const { mutateAsync: checkDiscount } = useCheckDiscount();
  const { data: menus } = useGetMenus(undefined, true);
  const newQuantities = cartItems.reduce((acc: any, item: any) => {
    acc[item.id] = item.quantity;
    return acc;
  }, {} as Record<string, number>);
  useEffect(() => {
    setTotal((subtotal || 0) + serviceCharge + tax);
  }, [subtotal, serviceCharge, tax]);

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

  const handleQuantityChange = (id: string, increment: boolean) => {
    dispatch(
      updateQuantity({
        id,
        quantity: increment
          ? (newQuantities[id] || 0) + 1
          : Math.max((newQuantities[id] || 0) - 1, 0),
      })
    );
  };

  // const subtotal = cartItems.reduce(
  //   (sum: any, dish: any) => sum + dish.price * (newQuantities[dish.id] || 0),
  //   0
  // );
  const [isProcessing, setIsProcessing] = useState(false);
  const checkoutButtonText = isProcessing
    ? i18n.t('checking_discount_button')
    : `${i18n.t('checkout_button')} • ${total.toFixed(2)} ${i18n.t(
        'currency_unit'
      )}`;
  // const checkDiscount = useCheckDiscount();

  async function checkDiscountFN(coupon?: string) {
    if (isUpdatingCart) return;

    const itemsData = cart.items
      .map((item: any) => ({
        menu_item: item.id,
        quantity:
          newQuantities[item.id] !== undefined
            ? newQuantities[item.id]
            : item.quantity,
      }))
      .filter(
        (item: any) =>
          (newQuantities[item.id] !== undefined
            ? newQuantities[item.id]
            : item.quantity) > 0
      );
    if (itemsData.length === 0) {
      dispatch(setDiscount(0));
      setTotal(subtotal);
      return;
    }

    // 2. Initial Discount Check API Call
    const discountResponse = await checkDiscount({
      tenant: restaurant,
      branch: branch,
      coupon: coupon?.trim() || undefined,
      items: itemsData,
    });

    const discountValue = discountResponse.discount_amount || 0;
    const typeDiscount = discountResponse.typeDiscount;
    const freeItemsData = discountResponse.freeItems || [];

    const requiredFreeItems: Record<string, number> = {};
    for (const item of freeItemsData) {
      const itemId = Object.keys(item)[0];
      requiredFreeItems[itemId] = Object.values(item)[0] as number;
    }

    let needsCartUpdate = false;
    let itemsToUpdate: { id: string; quantity: number; isNew?: boolean }[] = [];

    // A. Identify existing free items in the cart to remove or update
    for (const item of cart.items) {
      // Assuming a price of 0 is the flag for a free item added by the discount system
      const isCurrentFreeItem = item.price === 0;
      const requiredQuantity = requiredFreeItems[item.id] || 0;
      const currentQuantity = item.quantity; // Use cart quantity for comparison

      if (isCurrentFreeItem) {
        if (requiredQuantity === 0) {
          // Free item is no longer eligible (needs removal)
          if (currentQuantity > 0) {
            itemsToUpdate.push({ id: item.id, quantity: 0 });
            needsCartUpdate = true;
          }
        } else if (currentQuantity !== requiredQuantity) {
          // Free item is eligible but quantity is wrong (needs correction)
          itemsToUpdate.push({ id: item.id, quantity: requiredQuantity });
          needsCartUpdate = true;
        }
        // Mark as processed
        delete requiredFreeItems[item.id];
      }
    }
    if (typeDiscount === 'freeItem') {
      for (const itemId in requiredFreeItems) {
        const requiredQuantity = requiredFreeItems[itemId];
        if (requiredQuantity > 0) {
          // Needs to be added to the cart
          itemsToUpdate.push({
            id: itemId,
            quantity: requiredQuantity,
            isNew: true,
          });
          needsCartUpdate = true;
        }
      }
    }

    if (typeDiscount === 'bogo') {
      for (const itemId in requiredFreeItems) {
        const requiredQuantity = requiredFreeItems[itemId];

        const currentFreeItem = cart.items.find(
          (i) => i.id === itemId && i.price === 0
        );

        if (!currentFreeItem && requiredQuantity > 0) {
          // add new free item
          itemsToUpdate.push({
            id: itemId,
            quantity: requiredQuantity,
            isNew: true,
          });
          needsCartUpdate = true;
        } else if (
          currentFreeItem &&
          currentFreeItem.quantity !== requiredQuantity
        ) {
          // update existing free item quantity
          itemsToUpdate.push({
            id: itemId,
            quantity: requiredQuantity,
            isNew: false,
          });
          needsCartUpdate = true;
        }
      }
    }

    // C. Execute Cart Updates (if any)
    if (needsCartUpdate) {
      setIsUpdatingCart(true); // Set flag to prevent re-triggering useEffect

      for (const update of itemsToUpdate) {
        const item = menus?.find((t: any) => t.id === update.id);
        if (update.isNew) {
          if (item) {
            dispatch(
              addToCart({
                item: {
                  id: item?.id!,
                  name: item?.name!,
                  description: '',
                  price: 0,
                  quantity: update.quantity,
                  image: item?.image,
                },
                restaurantId: restaurant || '',
                branchId: branch || '',
                tableId: cart.tableId,
                paymentAPIKEY: item?.tenant.CHAPA_API_KEY,
                paymentPUBLICKEY: item?.tenant.CHAPA_PUBLIC_KEY,
                tax: item?.tenant.tax,
                serviceCharge: item?.tenant.service_charge,
              })
            );
            setTotal((prev) => prev + update.quantity * item.price);
          }
        } else {
          dispatch(
            updateQuantity({ id: update.id, quantity: update.quantity })
          );
          setTotal((prev) => prev + update.quantity * item.price);
        }
      }

      setTimeout(() => {
        setIsUpdatingCart(false);
      }, 50);
    }
    dispatch(setDiscount(discountValue));
    setTotal(subtotal - discountValue);
  }

  useEffect(() => {
    if (branch) {
      checkDiscountFN();
    }
  }, [cart.items]);

  useEffect(() => {
    async function fetchDiscount() {
      const itemsData = cartItems.map((item: any) => ({
        menu_item: item.id,
        quantity: newQuantities[item.id] || 0,
        price: item.price,
      }));
    }
    fetchDiscount();
  }, [cartItems, branch, restaurant, dispatch, newQuantities]); // Added all dependencies

  const handleCheckout = async () => {
    if (!branch) {
      // Replaced Alert.alert with i18n.t
      Alert.alert(i18n.t('error_toast_title'), i18n.t('select_branch_error'));
      return;
    }

    setIsProcessing(true);

    try {
      router.push({
        pathname: '/checkOut',
      });
    } catch (error) {
      console.error('Discount check error:', error);
    } finally {
      setIsProcessing(false);
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
            <Appbar.Content
              title={i18n.t('your_bowl_title')} // Replaced hardcoded string
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
          {cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyCartText}>
                {i18n.t('your_bowl_empty')} {/* Replaced hardcoded string */}
              </Text>
            </View>
          ) : (
            <View style={styles.scrollContainer}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
              >
                {cartItems.map((dish: any) => (
                  <View key={dish.id} style={styles.card}>
                    <View style={styles.cardContent}>
                      <Image
                        source={{ uri: normalizeImageUrl(dish.image) }}
                        style={styles.cardImage}
                      />
                      <View style={styles.dishDetails}>
                        <Text variant="titleMedium" style={styles.dishName}>
                          {dish.name}
                        </Text>
                        <View style={styles.priceContainer}>
                          <View style={styles.quantityContainer}>
                            <IconButton
                              icon="minus"
                              onPress={() =>
                                handleQuantityChange(dish.id.toString(), false)
                              }
                              style={styles.quantityButton}
                              iconColor="gray"
                              size={20}
                            />
                            <Text style={styles.quantityText}>
                              {newQuantities[dish.id]}
                            </Text>
                            <IconButton
                              icon="plus"
                              onPress={() =>
                                handleQuantityChange(dish.id.toString(), true)
                              }
                              style={styles.quantityButton}
                              iconColor="#388e3c"
                              size={20}
                            />
                          </View>
                          <Text style={styles.dishPrice}>
                            {dish.price.toFixed(2)} {i18n.t('currency_unit')}{' '}
                            {/* Replaced hardcoded string */}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
        {cartItems.length > 0 && (
          <View
            style={[styles.fixedBottomContainer, { paddingBottom: bottom }]}
          >
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {i18n.t('subtotal_label')} {/* Replaced hardcoded string */}
                </Text>
                <Text style={styles.summaryValue}>
                  {subtotal.toFixed(2)} {i18n.t('currency_unit')}{' '}
                  {/* Replaced hardcoded string */}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {i18n.t('discount_label')} {/* Replaced hardcoded string */}
                </Text>
                <Text style={styles.discountValue}>
                  - {discount.toFixed(2)} {i18n.t('currency_unit')}{' '}
                  {/* Replaced hardcoded string */}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text variant="titleMedium" style={styles.totalLabel}>
                  {i18n.t('total_label')} {/* Replaced hardcoded string */}
                </Text>
                <Text variant="titleMedium" style={styles.totalValue}>
                  {total.toFixed(2)} {i18n.t('currency_unit')}{' '}
                  {/* Replaced hardcoded string */}
                </Text>
              </View>
            </View>
            <Button
              mode="contained"
              loading={isProcessing}
              disabled={cartItems.length === 0 || isProcessing}
              onPress={handleCheckout}
              style={styles.checkoutButton}
              contentStyle={styles.buttonContent}
              labelStyle={{
                fontSize: 17,
                color: '#22281B',
                fontWeight: 'bold',
              }}
              theme={{ colors: { primary: '#9AC26B' } }}
              accessible
              accessibilityRole="button"
              accessibilityLabel={checkoutButtonText}
              accessibilityHint={i18n.t('proceed_to_payment_button')}
            >
              {checkoutButtonText}
            </Button>
          </View>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFC',
  },
  safeArea: {
    flex: 1,
  },
  appbarContainer: {
    ...Platform.select({
      web: {
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
      },
    }),
  },
  modalButton: {
    marginTop: 16,
    borderRadius: 25,
  },
  appbar: {
    backgroundColor: '#FDFDFC',
  },
  appbarTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#333',
    alignSelf: 'center',
  },
  contentContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        maxWidth: 800,
        width: '100%',
        alignSelf: 'center',
      },
    }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FDFDFC',
  },
  scrollContent: {
    padding: Platform.OS === 'web' ? 10 : 6,
    paddingBottom: 16,
  },
  card: {
    marginBottom: 6,
    backgroundColor: '#FDFDFC',
    borderRadius: 12,
    ...Platform.select({
      web: {
        // boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 16,
  },
  dishDetails: {
    flex: 1,
    marginLeft: 6,
    marginRight: 6,
  },
  dishName: {
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dishPrice: {
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 20,
    borderColor: '#E0E0E0',
    height: 36, // Reduced height
    paddingHorizontal: 0, // Reduced padding
  },
  quantityButton: {
    margin: 0,
    width: 32, // Fixed width for buttons
    height: 32, // Fixed height for buttons
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginHorizontal: 8,
    minWidth: 24, // Reduced width
    textAlign: 'center',
  },
  fixedBottomContainer: {
    backgroundColor: '#FDFDFC',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  summaryCard: {
    backgroundColor: '#FDFDFC',
    borderRadius: 12,
    ...Platform.select({
      web: {
        // boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      },
    }),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  summaryLabel: {
    color: '#666',
    fontSize: 14,
  },
  summaryValue: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  discountValue: {
    color: '#388e3c',
    fontSize: 14,
    fontWeight: '500',
  },
  totalLabel: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalValue: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkoutButton: {
    marginTop: 16,
    borderRadius: 30,
    width: 353,
    height: 50,
    alignSelf: 'center',
    alignContent: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        maxWidth: 353,
        width: '100%',
        alignSelf: 'center',
        marginBottom: 20,
      },
    }),
  },
  buttonContent: {
    paddingVertical: 5,
  },
});
