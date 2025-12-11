import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  Platform,
  ViewStyle,
} from 'react-native';
import {
  Card,
  Text,
  ActivityIndicator,
  useTheme,
  Divider,
  Button,
  Portal,
  Modal,
} from 'react-native-paper';
import { useOrders, useUpdateOrder } from '@/services/mutation/orderMutation';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/lib/reduxStore/cartSlice';
import Toast from 'react-native-toast-message';
import DeliveredBowl from '@/assets/icons/delivered_bowl.svg';
import PlacedBowl from '@/assets/icons/placed_bowl.svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updatePendingOrders } from '@/lib/reduxStore/OrderSlice';
import { i18n } from '@/app/_layout';
import { useGetMenus } from '@/services/mutation/menuMutation';

type OrderStatus = 'placed' | 'progress' | 'delivered' | 'cancelled';

const OrderHistoryScreen = () => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [nextPage, setNextPage] = useState<string | undefined>(undefined);
  const dispatch = useDispatch();
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<OrderStatus | 'all'>('all');
  const { data, isLoading, isError, refetch } = useOrders(nextPage || '');
  const isWeb = Platform.OS === 'web';
  const isSmallWeb = isWeb && width < 768;

  const columnCount = isWeb ? Math.max(1, Math.floor((width - 240) / 400)) : 1;

  const updateOrderHistory = useCallback(() => {
    if (data?.results) {
      setOrderHistory((prev) => [
        ...prev.filter(
          (prevOrder) =>
            !data.results.some((newOrder: any) => newOrder.id === prevOrder.id)
        ),
        ...data.results,
      ]);
    }
  }, [data]);

  useEffect(() => {
    dispatch(
      updatePendingOrders({
        pendingOrders:
          orderHistory.filter((or) => or.status == 'placed').length || 0,
      })
    );
  }, [orderHistory, dispatch]); // Added dispatch to dependency array

  useEffect(updateOrderHistory, [data, updateOrderHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    setNextPage(undefined);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const loadMoreOrders = useCallback(() => {
    if (data?.next && !isLoading) {
      setNextPage(data.next);
    }
  }, [data?.next, isLoading]);

  const handleWebScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const paddingToBottom = 400;
      if (
        contentSize.height - layoutMeasurement.height - contentOffset.y <
        paddingToBottom
      ) {
        loadMoreOrders();
      }
    },
    [loadMoreOrders]
  );

  if (isLoading && orderHistory.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" animating={true} color="#96B76E" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          {i18n.t('loading_orders_text')}
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons
          name="alert-circle"
          size={40}
          color={theme.colors.error}
        />
        <Text variant="bodyLarge" style={styles.errorText}>
          {i18n.t('failed_to_load_orders_error')}
        </Text>
      </View>
    );
  }

  const filteredOrders = orderHistory.filter((order) =>
    selectedTab === 'all' ? true : order.status === selectedTab
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isWeb && styles.webHeader]}>
        <Text variant="headlineMedium" style={styles.headerText}>
          {i18n.t('my_orders_title')}
        </Text>
      </View>

      {/* Main Content Container */}
      <View
        style={[
          isWeb && styles.webMainContainer,
          isSmallWeb && styles.smallWebMainContainer,
        ]}
      >
        {/* Tabs - Responsive Sidebar */}
        {!isWeb || isSmallWeb ? (
          <View style={styles.tabContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScrollContent}
            >
              {(
                ['all', 'placed', 'progress', 'delivered', 'cancelled'] as const
              ).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabButton,
                    selectedTab === tab && styles.activeTabButton,
                  ]}
                  onPress={() => setSelectedTab(tab === 'all' ? 'all' : tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === tab && styles.activeTabText,
                    ]}
                  >
                    {i18n.t(`${tab}_tab_label`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <ScrollView
            horizontal={!isWeb || isSmallWeb}
            contentContainerStyle={[
              styles.tabsContainer,
              isWeb && !isSmallWeb && styles.webTabsContainer,
            ]}
            showsHorizontalScrollIndicator={false}
          >
            {(
              ['all', 'placed', 'progress', 'delivered', 'cancelled'] as const
            ).map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedTab(tab === 'all' ? 'all' : tab)}
                style={[
                  styles.tabItem,
                  selectedTab === tab && styles.activeTab,
                  isWeb && !isSmallWeb && styles.webTabItem,
                  isSmallWeb && styles.smallWebTabItem,
                ]}
              >
                <Text
                  variant="labelLarge"
                  style={[
                    styles.tabText,
                    selectedTab === tab && styles.activeTabText,
                  ]}
                >
                  {i18n.t(`${tab}_tab_label`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Order List */}
        {isWeb ? (
          <ScrollView
            style={[
              styles.webScrollContainer,
              isSmallWeb && styles.smallWebScrollContainer,
            ]}
            onScroll={handleWebScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.webListContentContainer}
          >
            {filteredOrders.length == 0 && (
              <Text style={styles.message}>{i18n.t('no_orders_found')}</Text>
            )}
            <View style={styles.gridContainer}>
              {filteredOrders.map((item) => (
                <View
                  key={`web-${item.id}`}
                  style={[
                    styles.webCardContainer,
                    { width: isSmallWeb ? '100%' : `${100 / columnCount}%` },
                  ]}
                >
                  <OrderCard
                    order={item}
                    orders={orderHistory}
                    setOrders={setOrderHistory}
                  />
                </View>
              ))}
            </View>
            {isLoading && (
              <ActivityIndicator style={styles.loader} size="small" />
            )}
          </ScrollView>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => `mobile-${item.id}`}
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                orders={orderHistory}
                setOrders={setOrderHistory}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            contentContainerStyle={styles.flatListContentContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
            onEndReached={loadMoreOrders}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoading ? <ActivityIndicator size="small" animating /> : null
            }
            ListEmptyComponent={
              <Text style={styles.message}>{i18n.t('no_orders_found')}</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const statusConfig = {
  placed: {
    icon: 'cart',
    color: '#FFB74D',
    label: i18n.t('status_placed_label'),
  },
  progress: {
    icon: 'chef-hat',
    color: '#4FC3F7',
    label: i18n.t('status_progress_label'),
  },
  delivered: {
    icon: 'truck-check',
    color: '#81C784',
    label: i18n.t('status_delivered_label'),
  },
  cancelled: {
    icon: 'close-circle',
    color: '#E57373',
    label: i18n.t('status_cancelled_label'),
  },
};

const OrderCard = ({
  order,
  orders,
  setOrders,
}: {
  order: any;
  orders: any[];
  setOrders: (orderHistory: any[]) => void;
}) => {
  const theme = useTheme();
  const status = order.status.toLowerCase() as keyof typeof statusConfig;
  const { icon, color, label } = statusConfig[status] || statusConfig.placed;
  const orderDate = status === 'placed' ? order.created_at : order.updated_at;
  const formattedDate = new Date(orderDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const { mutateAsync: updateOrderStatus, isPending } = useUpdateOrder();
  const dispatch = useDispatch();
  const isWeb = Platform.OS === 'web';
  const { width } = useWindowDimensions();
  const isSmallWeb = isWeb && width < 768;
  const { data: menus } = useGetMenus(undefined, true);

  const handleAddToCartAgain = (order: any) => {
    order.items.forEach((item: any) => {
      const menuItem = menus?.find((t: any) => t.id === item.menu_item);
      dispatch(
        addToCart({
          item: {
            id: item.menu_item,
            name: item.menu_item_name || i18n.t('unnamed_item_placeholder'),
            description: '',
            price: parseFloat(menuItem?.price),
            quantity: item.quantity,
            image: item.menu_item_image || '',
          },
          restaurantId: order.tenant.id,
          branchId: order.branch.id,
          paymentAPIKEY: order?.tenant.CHAPA_API_KEY,
          paymentPUBLICKEY: order?.tenant.CHAPA_PUBLIC_KEY,
          tax: order?.tenant?.tax || 0,
          serviceCharge: order?.tenant?.service_charge || 0,
          tableId: order.table.id,
        })
      );
    });
    setModalVisible(false);
    Toast.show({
      type: 'success',
      text1: i18n.t('item_added_to_cart_toast_title'),
      text2: i18n.t('item_added_to_cart_toast_message'),
    });
  };

  const handleCancelOrder = async (orderId: string) => {
    // Check if we are on web
    const isWeb = Platform.OS === 'web';

    const confirmCancel = isWeb
      ? window.confirm(
          `${i18n.t('cancel_order_alert_title')}\n${i18n.t(
            'cancel_order_alert_message'
          )}`
        )
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            i18n.t('cancel_order_alert_title'),
            i18n.t('cancel_order_alert_message'),
            [
              {
                text: i18n.t('alert_no_button'),
                style: 'cancel',
                onPress: () => resolve(false),
              },
              {
                text: i18n.t('alert_yes_button'),
                onPress: () => resolve(true),
              },
            ]
          );
        });

    if (!confirmCancel) return;

    try {
      await updateOrderStatus(
        {
          id: orderId,
          order: {
            status: 'cancelled',
          },
        },
        {
          onSuccess: (data: any) => {
            const newOrders = orders.filter((order) => order.id !== orderId);
            setOrders(newOrders);
            Toast.show({
              type: 'success',
              text1: i18n.t('order_cancelled_toast_title'),
            });
          },
          onError: (error) => {
            console.error('Failed to cancel order:', error);
            Toast.show({
              type: 'error',
              text1: i18n.t('cancel_order_failed_toast_title'),
              text2: i18n.t('cancel_order_failed_toast_message'),
            });
          },
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView>
      <TouchableOpacity
        style={[styles.card, isWeb && styles.webCard]}
        onPress={() => setModalVisible(true)}
        accessible
        accessibilityLabel={i18n.t('order_card_accessibility_label')}
        accessibilityHint={i18n.t('order_card_accessibility_hint')}
      >
        {/* Status Indicator Bar */}
        <View style={[styles.statusIndicatorBar, { backgroundColor: color }]} />

        <View style={styles.cardContent}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.orderIdContainer}>
                <Text variant="titleSmall" style={styles.orderId}>
                  #{order.order_id}
                </Text>
              </View>
            </View>

            <View style={styles.detailsContainer}>
              <View>
                <Text variant="bodyLarge" style={styles.statusText}>
                  {label}
                </Text>
                <View style={styles.metaRow}>
                  <Text variant="bodyMedium" style={styles.dateText}>
                    {formattedDate}
                  </Text>
                </View>
                <View style={styles.metaRow}>
                  <Text variant="bodyMedium" style={styles.locationText}>
                    {order.customer.full_name}
                  </Text>
                </View>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.itemsContainer}>
              {order.items.slice(0, 2).map((item: any) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.quantity}x{' '}
                    {item.menu_item_name || i18n.t('menu_item_placeholder')}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {parseFloat(item.price).toFixed(2)}{' '}
                    {i18n.t('currency_unit')}
                  </Text>
                </View>
              ))}
              {order.items.length > 2 && (
                <Text style={styles.moreItemsText}>
                  {i18n.t('more_items_text', { count: order.items.length - 2 })}
                </Text>
              )}
            </View>

            <Button
              onPress={() => handleAddToCartAgain(order)}
              style={styles.addToCartButton}
              mode="text"
              theme={{ colors: { primary: '#96B76E' } }}
            >
              <View style={styles.addToCartContent}>
                <Text
                  variant="bodyMedium"
                  style={[styles.addToCartText, { color: '#000' }]}
                >
                  {i18n.t('add_to_cart_again_button')}
                </Text>
              </View>
            </Button>

            {['placed', 'progress'].includes(status) && (
              <Button
                onPress={() => handleCancelOrder(order.id)}
                style={styles.cancelOrderButton}
                mode="text"
                loading={isPending}
                theme={{ colors: { primary: '#EEF0EA' } }}
              >
                <View style={styles.cancelOrderContent}>
                  <Text
                    variant="bodyMedium"
                    style={[styles.cancelOrderText, { color: '#E65C2D' }]}
                  >
                    {i18n.t('cancel_order_button')}
                  </Text>
                </View>
              </Button>
            )}
          </Card.Content>
        </View>
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={[styles.modalGradient, { maxHeight: isWeb ? '90%' : '80%' }]}
          >
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={!isSmallWeb}
            >
              <View style={styles.statusHeader}>
                <View
                  style={[styles.statusIndicator, { backgroundColor: color }]}
                />
                {label === i18n.t('status_delivered_label') && (
                  <DeliveredBowl width={24} height={24} color="#96B76E" />
                )}
                {label === i18n.t('status_placed_label') && (
                  <PlacedBowl width={24} height={24} color="#96B76E" />
                )}
                <View>
                  <Text variant="titleMedium" style={{ color: '#000' }}>
                    {label}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ ...styles.orderDate, marginVertical: 4 }}
                  >
                    {new Date(orderDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Text style={{ color: '#6C757D', fontSize: 12 }}>
                    {order?.tenant.restaurant_name}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text variant="labelLarge" style={styles.sectionTitle}>
                  {i18n.t('branch_information_section_title')}
                </Text>
                <View style={styles.detailItem}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={20}
                      color="#6C757D"
                    />
                    <Text style={styles.detailText}>
                      {order.branch.distance_km}{' '}
                      {i18n.t('distance_from_location_text')}
                    </Text>
                  </View>
                  <Button
                    mode="text"
                    onPress={() => {
                      // Handle navigation to Google Maps
                    }}
                    textColor="#f37042"
                  >
                    {i18n.t('view_on_google_maps_button')}
                  </Button>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text variant="labelLarge" style={styles.sectionTitle}>
                  {i18n.t('order_items_section_title', {
                    count: order.items.length,
                  })}
                </Text>
                {order.items.map((item: any) => (
                  <View key={item.id} style={styles.modalItemRow}>
                    {item.menu_item_image ? (
                      <Image
                        source={{
                          uri: item.menu_item_image.replace(
                            'http://',
                            'https://'
                          ),
                        }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <MaterialCommunityIcons
                          name="image-off"
                          size={24}
                          color="#6C757D"
                        />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.modalItemName}>
                        {item.quantity}x {item.menu_item_name}
                      </Text>
                      {item.variants && (
                        <Text style={styles.variantText}>
                          {item.variants.map((v: any) => v.name).join(', ')}
                        </Text>
                      )}
                      {item.special_instructions && (
                        <Text style={styles.instructionsText}>
                          <MaterialCommunityIcons
                            name="note-text"
                            size={14}
                            color="#FF9800"
                          />
                          {item.special_instructions}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.modalItemPrice}>
                      {parseFloat(item.price).toFixed(2)}{' '}
                      {i18n.t('currency_unit')}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.summarySection}>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text variant="titleMedium">{i18n.t('total_label')}:</Text>
                  <Text variant="titleMedium">
                    {order.total_price.toFixed(2)}
                    {i18n.t('currency_unit')}
                  </Text>
                </View>
              </View>

              <View style={styles.buttonGroup}>
                <Button
                  mode="text"
                  style={styles.reorderButton}
                  onPress={() => handleAddToCartAgain(order)}
                  textColor="#000"
                >
                  {i18n.t('reorder_all_items_button')}
                </Button>
                {status === 'delivered' && (
                  <Button
                    mode="outlined"
                    style={styles.feedbackButton}
                    textColor="#000"
                    onPress={() => {
                      setModalVisible(false);
                      router.push({
                        pathname: '/(protected)/orderHistory/feedback',
                        params: {
                          orderId: order.id,
                          menuId: order.items[0].menu_item,
                          restaurantId: order.tenant.id,
                        },
                      });
                    }}
                  >
                    {i18n.t('leave_feedback_button')}
                  </Button>
                )}
              </View>
            </ScrollView>
          </LinearGradient>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: '#EF5350',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    padding: 20,
    backgroundColor: '#FDFDFC',
  },
  webHeader: {
    paddingHorizontal: '10%',
  },
  webMainContainer: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  smallWebMainContainer: {
    flexDirection: 'column',
    paddingHorizontal: 0,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  webTabsContainer: {
    flexDirection: 'column',
    width: 200,
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    flex: 1,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  smallWebTabItem: {
    minWidth: 120,
  },
  webTabItem: {
    width: '100%',
    marginRight: 0,
    marginBottom: 8,
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    color: '#6C757D',
    fontWeight: '500',
    fontSize: 14,
  },
  activeTabText: {
    color: '#96B76E',
    fontWeight: '600',
  },
  webScrollContainer: {
    flex: 1,
    paddingHorizontal: 0,
    paddingLeft: 0,
    flexGrow: 50,
  },
  webListContentContainer: {
    paddingBottom: 80,
  },
  smallWebScrollContainer: {
    paddingHorizontal: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  webCardContainer: {
    padding: 8,
    marginBottom: 5,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#5D6E4933',
    position: 'relative', // Added for status indicator positioning
  },
  flatListContentContainer: {
    paddingHorizontal: 6,
    paddingBottom: 80,
    paddingTop: 16,
  },
  webCard: Platform.select<ViewStyle>({
    web: {
      cursor: 'pointer',
      transitionProperty: 'transform, box-shadow',
      transitionDuration: '0.2s',
      transform: [{ translateY: 0 }],
      ':hover': {
        transform: [{ translateY: -2 }],
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
      },
    },
    default: {},
  }),
  gradient: {
    padding: 16,
    paddingLeft: 20,
  },
  statusIndicatorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    color: '#495057',
    fontWeight: '600',
  },
  totalChip: {
    borderRadius: 6,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 16,
  },
  statusText: {
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  dateText: {
    color: '#6C757D',
    fontSize: 14,
  },
  locationText: {
    color: '#6C757D',
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#E9ECEF',
  },
  itemsContainer: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    color: '#495057',
    flex: 1,
    marginRight: 16,
  },
  itemPrice: {
    color: '#2B2D42',
    fontWeight: '500',
  },
  moreItemsText: {
    color: '#6C757D',
    fontSize: 12,
    marginTop: 4,
  },
  cancelOrderButton: {
    marginTop: 10,
    // width: 321, // Commented out
    height: 38,
    borderColor: 'red',
    backgroundColor: '#EEF0EA',
  },
  cancelOrderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOrderText: {
    marginLeft: 8,
  },
  addToCartButton: {
    marginTop: 12,
    // width: 321, // Commented out
    height: 38,
    borderRadius: 30,
    backgroundColor: '#96B76E',
  },
  addToCartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartText: {
    fontWeight: '500',
  },
  modalContainer: {
    backgroundColor: 'white',
    ...Platform.select({
      native: {
        marginHorizontal: 10,
        marginVertical: 40,
        maxHeight: '100%',
        flex: 1,
      },
      web: {
        width: '90%',
        maxWidth: 800,
        margin: 'auto',
        maxHeight: '90%',
        overflow: 'hidden',
      } as ViewStyle,
    }),
  },
  modalGradient: {
    borderRadius: 16,
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    minHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  restaurantName: {
    fontWeight: '700',
    color: '#2B2D42',
  },
  branchName: {
    color: '#6C757D',
    fontSize: 14,
  },
  statusHeader: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  orderDate: {
    color: '#6C757D',
    fontSize: 12,
  },
  detailSection: {
    marginVertical: 12,
  },
  sectionTitle: {
    color: '#2B2D42',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 30,
  },
  detailText: {
    color: '#495057',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  variantText: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  instructionsText: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
    alignItems: 'center',
    gap: 4,
  },
  summarySection: {
    marginVertical: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  totalDivider: {
    marginVertical: 8,
  },
  totalRow: {
    marginTop: 8,
  },
  buttonGroup: {
    gap: 12,
    marginTop: 20,
  },
  reorderButton: {
    // width: 321, // Commented out
    height: 38,
    backgroundColor: '#96B76E',
    alignContent: 'center',
    justifyContent: 'center',
  },
  feedbackButton: {
    borderColor: '#96B76E',
  },
  loader: {
    marginVertical: 20,
  },
  headerText: {
    fontWeight: '700',
    color: '#2B2D42',
    alignSelf: 'center',
    fontSize: 17,
  },
  modalItemPrice: {
    color: '#2B2D42',
    fontWeight: '500',
    fontSize: 16,
  },
  modalItemName: {
    color: '#495057',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  message: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#777' },
  // New styles for mobile category selector
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    overflow: 'hidden',
    marginTop: 10,
    marginHorizontal: 1,
    marginBottom: 10,
    padding: 3,
    borderRadius: 10,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
  },
});

export default OrderHistoryScreen;
