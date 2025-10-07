import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  Searchbar,
  Card,
  Text,
  ActivityIndicator,
  Button,
} from 'react-native-paper';
import debounce from 'lodash.debounce';
import { useGetMenuAvailabilities } from '@/services/mutation/menuMutation';
import MenuItemModal from '@/components/ui/menuModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import RestaurantCard, {
  RestaurantCards,
} from '@/components/ui/RestaurantCard';
import { router } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateQuantity } from '@/lib/reduxStore/cartSlice';
import Toast from 'react-native-toast-message';
import { RootState } from '@/lib/reduxStore/store';
import { i18n } from '@/app/_layout';
import { normalizeImageUrl } from '@/utils/imageUrl';

const { width } = Dimensions.get('window');

const RestaurantSearch: React.FC = () => {
  // --- UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'Dishes' | 'Restaurants'
  >('Dishes');
  const [selectedMenu, setSelectedMenu] = useState<{
    menuItem: any;
    restaurantId: any;
    branchId: any;
  }>({
    menuItem: null,
    restaurantId: null,
    branchId: null,
  });
  const [showAllDishes, setShowAllDishes] = useState(false);

  const dispatch = useDispatch();
  const cart = useSelector((state: RootState) => state.cart);

  // --- Debounce (cleanup on unmount)
  const debouncedSearch = useMemo(
    () => debounce((q: string) => setDebouncedQuery(q), 300),
    []
  );
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // --- Data fetching (the hook you already use)
  const {
    data = [],
    isLoading,
    error,
  } = useGetMenuAvailabilities(debouncedQuery);

  const categorizedResults = useMemo(() => {
    const lowerQuery = (debouncedQuery || '').toLowerCase();
    const restaurantsMap = new Map<string | number, any>();
    const branchesMap = new Map<string | number, any>();
    const dishes: any[] = [];

    for (const item of data) {
      const branch = item.branch || {};
      const menu_item = item.menu_item || {};
      const tenant = branch.tenant || {};
      const branchId = branch.id;
      const tenantId = tenant.id;

      const restaurantName = tenant.restaurant_name || '';
      const branchAddress = branch.address || '';

      const matchesRestaurant = restaurantName
        .toLowerCase()
        .includes(lowerQuery);
      const matchesDish = (menu_item.name || '')
        .toLowerCase()
        .includes(lowerQuery);
      const matchesBranch = branchAddress.toLowerCase().includes(lowerQuery);

      // collect dishes
      if (
        lowerQuery === '' ||
        matchesDish ||
        matchesRestaurant ||
        matchesBranch
      ) {
        // Push to dishes only when menu name matches the query (matching original behavior)
        if (matchesDish) dishes.push(item);
      }

      // restaurants: one entry per tenant (restaurant)
      if (
        matchesRestaurant &&
        tenantId != null &&
        !restaurantsMap.has(tenantId)
      ) {
        restaurantsMap.set(tenantId, {
          id: branchId,
          restaurant_name: restaurantName,
          tenant_id: tenantId,
          sampleDishes: [],
          address: branchAddress,
          distance_km: branch.distance_km, // using distance_km per your request
          location: branch.location,
        });
      }

      // branches: one entry per branch
      if (
        (matchesRestaurant || matchesBranch) &&
        branchId != null &&
        !branchesMap.has(branchId)
      ) {
        branchesMap.set(branchId, {
          id: branchId,
          restaurant_name: `${restaurantName}, ${branchAddress}`,
          tenant_id: tenantId,
          sampleDishes: [],
          address: branchAddress,
          distance_km: branch.distance_km,
          location: branch.location,
        });
      }

      // populate sample dishes (max 3) for both restaurant and branch objects
      const restObj = restaurantsMap.get(tenantId);
      if (restObj && restObj.sampleDishes.length < 3 && menu_item.image) {
        restObj.sampleDishes.push(
          normalizeImageUrl(menu_item.image) || menu_item.image
        );
      }
      const brObj = branchesMap.get(branchId);
      if (brObj && brObj.sampleDishes.length < 3 && menu_item.image) {
        brObj.sampleDishes.push(
          normalizeImageUrl(menu_item.image) || menu_item.image
        );
      }
    }

    return {
      restaurants: Array.from(restaurantsMap.values()),
      dishes,
      branches: Array.from(branchesMap.values()),
    };
  }, [data, debouncedQuery]);

  // --- Cart / add-to-cart logic (keeps original behavior)
  const handleAddToCart = useCallback(
    (item: any) => {
      const { branch, menu_item } = item;

      // If cart already has items from another restaurant/branch, block
      if (cart.restaurantId && cart.branchId) {
        if (
          cart.restaurantId !== branch.tenant.id ||
          cart.branchId !== branch.id
        ) {
          Toast.show({
            type: 'error',
            text1: i18n.t(
              'cannot_add_items_different_restaurants_branches_toast'
            ),
            text2: i18n.t('add_to_cart_error_message'),
          });
          return;
        }
      }

      const existingItem = cart.items.find((ci: any) => ci.id === menu_item.id);
      if (existingItem) {
        dispatch(
          updateQuantity({
            id: menu_item.id,
            quantity: existingItem.quantity + 1,
          })
        );
      } else {
        dispatch(
          addToCart({
            item: {
              ...menu_item,
              id: menu_item.id,
              name: menu_item.name,
              description: menu_item.description,
              image: menu_item.image,
              quantity: 1,
              price: parseFloat(menu_item.price),
            },
            restaurantId: branch.tenant.id,
            branchId: branch.id,
            tableId: '',
            paymentAPIKEY: branch.tenant.CHAPA_API_KEY || '',
            paymentPUBLICKEY: branch.tenant.CHAPA_PUBLIC_KEY || '',
            tax: branch.tenant.tax || 0,
            serviceCharge: branch.tenant.service_charge || 0,
          })
        );
      }

      Toast.show({
        type: 'success',
        text1: i18n.t('item_added_to_cart_toast', { itemName: menu_item.name }),
      });
    },
    [cart, dispatch]
  );

  const handleOrderNow = useCallback(
    (item: any) => {
      // Add to cart first (keeps same behavior as your original)
      handleAddToCart(item);

      // then open modal
      setSelectedMenu({
        menuItem: item.menu_item.id,
        restaurantId: item.branch.tenant?.id,
        branchId: item.branch.id,
      });
    },
    [handleAddToCart]
  );

  // --- Dish renderer (memoized)
  const renderDishItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={styles.dishCard}>
        <Card.Content style={styles.dishContent}>
          <View style={styles.dishTextContainer}>
            <Text style={styles.dishTitle}>{item.menu_item.name}</Text>
            <Text style={styles.dishRestaurantName}>
              {item.branch.tenant?.restaurant_name}
            </Text>

            <View style={styles.priceRow}>
              <Text>{i18n.t('price_label')}: </Text>
              <Text style={styles.dishPrice}>
                {item.menu_item.price} {i18n.t('currency_unit')}
              </Text>
            </View>

            <Card.Actions style={styles.dishCardActions}>
              <Button
                mode="text"
                labelStyle={styles.orderButtonLabel}
                contentStyle={styles.orderButtonContent}
                style={styles.orderButton}
                onPress={() => handleOrderNow(item)}
              >
                {i18n.t('order_now_button')}
              </Button>
            </Card.Actions>
          </View>

          <Image
            source={{
              uri: normalizeImageUrl(item.menu_item.image),
            }}
            style={styles.dishImage}
          />
        </Card.Content>
      </View>
    ),
    [handleOrderNow, handleAddToCart]
  );

  // stable key extractors
  const dishKeyExtractor = useCallback(
    (item: any) => `dish-${item.menu_item.id}-${item.branch.id}`,
    []
  );
  const restaurantKeyExtractor = useCallback(
    (item: any) => `restaurant-${item.id}`,
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar / search */}
      <View style={styles.topBar}>
        <Searchbar
          placeholder={i18n.t('search_dish_restaurant_placeholder')}
          value={searchQuery}
          onChangeText={handleSearchChange}
          style={styles.customSearchbar}
          icon="magnify"
          clearIcon="close"
          onIconPress={() => {
            setSearchQuery('');
            setDebouncedQuery('');
          }}
        />

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedCategory === 'Dishes' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedCategory('Dishes')}
          >
            <Text
              style={[
                styles.tabText,
                selectedCategory === 'Dishes' && styles.activeTabText,
              ]}
            >
              {i18n.t('dishes_tab')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedCategory === 'Restaurants' && styles.activeTabButton,
            ]}
            onPress={() => setSelectedCategory('Restaurants')}
          >
            <Text
              style={[
                styles.tabText,
                selectedCategory === 'Restaurants' && styles.activeTabText,
              ]}
            >
              {i18n.t('restaurants_tab')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading / error */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#96B76E" />
        </View>
      ) : error ? (
        <Text style={styles.message}>
          {i18n.t('failed_to_load_results_message')}
        </Text>
      ) : (
        <>
          {/* DISHES TAB */}
          {selectedCategory === 'Dishes' && (
            <FlatList
              ListHeaderComponent={
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {i18n.t('dishes_tab')}
                  </Text>
                  {categorizedResults.dishes.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setShowAllDishes(!showAllDishes)}
                    >
                      <Text style={styles.seeAllText}>
                        {showAllDishes
                          ? i18n.t('see_less_button')
                          : i18n.t('see_all_button')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
              data={categorizedResults.dishes.slice(
                0,
                showAllDishes ? undefined : 3
              )}
              keyExtractor={dishKeyExtractor}
              renderItem={renderDishItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.message}>
                  {i18n.t('no_dishes_found_for_search', { searchQuery })}
                </Text>
              }
              ListFooterComponent={
                <View style={{ marginVertical: 10, paddingVertical: 10 }}>
                  <RestaurantCards data={categorizedResults.restaurants} />
                </View>
              }
              ListFooterComponentStyle={{ gap: 10 }}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* RESTAURANTS TAB */}
          {selectedCategory === 'Restaurants' && (
            <FlatList
              ListHeaderComponent={
                searchQuery !== '' ? (
                  <ScrollView
                    horizontal
                    contentContainerStyle={styles.listContentTop}
                    showsHorizontalScrollIndicator={false}
                  >
                    {categorizedResults.branches.length > 0 ? (
                      categorizedResults.branches.map((item: any) => (
                        <View
                          key={`restaurant-horizontal-${item.id}`}
                          style={{ width: 327 }}
                        >
                          <RestaurantCard
                            item={item}
                            rounded
                            callBack={() =>
                              router.push({
                                pathname:
                                  `(protected)/restaurant/(branch)` as any,
                                params: {
                                  restaurantId: item.tenant_id,
                                  branchId: JSON.stringify(item),
                                  rating: item.average_rating || 0,
                                  tableId: 'null',
                                  from: '/(protected)/search',
                                },
                              })
                            }
                          />
                        </View>
                      ))
                    ) : (
                      <Text style={styles.message}>
                        {i18n.t('no_restaurants_found_for_search', {
                          searchQuery,
                        })}
                      </Text>
                    )}
                  </ScrollView>
                ) : null
              }
              ListHeaderComponentStyle={{
                paddingVertical: 0,
                marginVertical: 0,
              }}
              data={categorizedResults.restaurants}
              keyExtractor={restaurantKeyExtractor}
              renderItem={({ item }) => <RestaurantCard item={item} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.message}>
                  {Boolean(searchQuery)
                    ? i18n.t('no_restaurants_found_for_search', {
                        searchQuery,
                      })
                    : i18n.t('no_restaurants_found')}
                </Text>
              }
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* default hint when nothing typed and no data */}
          {debouncedQuery === '' && data.length === 0 && !isLoading && (
            <View style={styles.centered}>
              <Text style={styles.message}>
                {i18n.t('start_typing_to_search_message')}
              </Text>
            </View>
          )}
        </>
      )}

      {/* Modal */}
      {Boolean(selectedMenu.menuItem) && (
        <MenuItemModal
          menuId={selectedMenu.menuItem}
          restaurantId={selectedMenu.restaurantId}
          branchId={selectedMenu.branchId}
          onDismiss={() =>
            setSelectedMenu({
              menuItem: null,
              restaurantId: null,
              branchId: null,
            })
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFDFC' },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  customSearchbar: {
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    height: 50,
    marginBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    overflow: 'hidden',
    marginTop: 10,
    padding: 3,
  },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  activeTabButton: { borderBottomWidth: 2, borderBottomColor: '#ccc' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  activeTabText: { color: '#333' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  message: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#777' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  seeAllText: { color: '#546D36', fontSize: 14, fontWeight: '600' },
  listContentTop: { paddingVertical: 10, gap: 7 },
  listContent: { paddingBottom: 100, paddingHorizontal: 16, gap: 7 },
  dishCard: {
    marginVertical: 8,
    overflow: 'hidden',
    flexDirection: 'column',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  dishContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 0,
  },
  dishTextContainer: { marginRight: 10 },
  dishTitle: { fontSize: 18, fontWeight: 'bold' },
  dishPrice: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 10,
  },
  dishRestaurantName: { fontSize: 13, color: '#555' },
  dishImage: { width: 163, height: 110, borderRadius: 8, resizeMode: 'cover' },
  dishCardActions: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    marginLeft: -20,
  },
  orderButton: {
    borderRadius: 20,
    height: 28,
    width: 110,
    backgroundColor: '#96B76E',
    alignContent: 'center',
    justifyContent: 'center',
  },
  orderButtonContent: { height: 38, alignSelf: 'center' },
  orderButtonLabel: { fontSize: 12, color: '#000' },
  restaurantFullCard: {
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    padding: 15,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantIcon: { marginRight: 8 },
  restaurantTitleRating: { flex: 1 },
  restaurantCardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  restaurantRatingContainer: { flexDirection: 'row', alignItems: 'center' },
  restaurantRatingText: { fontSize: 13, color: '#666', marginLeft: 5 },
  restaurantLocation: { fontSize: 13, color: '#888', marginBottom: 10 },
  restaurantDishPreviews: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 15,
  },
  restaurantDishPreviewImage: {
    width: (width - 32 - 30) / 3,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    resizeMode: 'cover',
  },
  viewOnMapButton: { marginTop: 10, alignSelf: 'flex-start' },
  viewOnMapButtonLabel: { color: '#6200ee', fontSize: 14 },
});

export default RestaurantSearch;
