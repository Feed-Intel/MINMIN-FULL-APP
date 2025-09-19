import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  Alert,
  TouchableOpacity,
  Platform,
  ViewStyle,
  TextStyle,
  Animated,
} from "react-native";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

import { useSelector } from "react-redux";
import { RootState } from "@/lib/reduxStore/store";
import { Appbar, Searchbar, Text } from "react-native-paper";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import {
  useGetRelatedMenus,
  useSearchMenuAvailabilities,
} from "@/services/mutation/menuMutation";
import * as Haptics from "expo-haptics";
import { useCreateAWaiterCall } from "@/services/mutation/branchMutation";
import { SafeAreaView } from "react-native-safe-area-context";
import { DishRow } from "@/components/restaurant/Dish";
import { StarRating } from "@/components/stars/ratingStars";
import { i18n } from "@/app/_layout";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  tags: string[];
  categories: string[];
  category?: string;
  is_side: boolean;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  gps_coordinates: string;
  is_default: boolean;
  menus: MenuItem[];
  tenant: {
    id: string;
    restaurant_name: string;
  };
}

const useResponsive = () => {
  const [screenWidth, setScreenWidth] = useState(SCREEN_WIDTH);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (isWeb) {
      const updateWidth = () => setScreenWidth(window.innerWidth);
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
  }, [isWeb]);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  return { isMobile, isTablet, isDesktop, isWeb, screenWidth };
};

const BellComponent = ({ tableId }: any) => {
  const callWaiter = useCreateAWaiterCall();
  const [isBellDisabled, setIsBellDisabled] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const pulseStyle = {
    transform: [
      {
        scale: pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.5],
        }),
      },
    ],
    opacity: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0],
    }),
  };

  async function playSound() {
    if (isBellDisabled) return;

    setIsBellDisabled(true);
    try {
      callWaiter.mutate({ table_id: tableId });
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      Alert.alert(
        i18n.t("waiter_called_alert_title"),
        i18n.t("waiter_called_alert_message")
      );
    } catch (error) {
      console.error(i18n.t("error_playing_sound_console_message"), error);
      Alert.alert(
        i18n.t("notice_alert_title"),
        i18n.t("could_not_play_sound_alert_message")
      );
    }

    setTimeout(() => setIsBellDisabled(false), 30000);
  }

  return (
    <View style={styles.bellContainer}>
      <TouchableOpacity
        onPress={playSound}
        style={[styles.bellButton, isBellDisabled && styles.disabledBell]}
        disabled={isBellDisabled}
      >
        <Feather name="bell" size={30} color="#fff" />
        <Animated.View style={[styles.pulse, pulseStyle]} />
      </TouchableOpacity>
    </View>
  );
};

const BranchDetailsScreen = () => {
  const router = useRouter();
  const { isMobile, isWeb } = useResponsive();
  const cartItems = useSelector((state: RootState) => state.cart.items.length); // Unused variable
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null); // Unused variable
  const {
    restaurantId,
    rating = 0,
    branchId = "{}",
    tableId = "null",
    from,
  } = useLocalSearchParams();
  const parsedBranches: Branch = useMemo(() => {
    try {
      return JSON.parse(branchId as string);
    } catch (e) {
      console.error(i18n.t("failed_to_parse_branch_id_console_message"), e);
      return {} as Branch;
    }
  }, [branchId]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(
    i18n.t("all_category_tab")
  );

  const {
    data: menuAvailabilities = [],
    isLoading,
    error: menuError,
  } = useSearchMenuAvailabilities(
    searchQuery
      ? `branch=${parsedBranches.id}&menu_item=${searchQuery}&is_available=true`
      : `branch=${parsedBranches.id}&is_available=true`
  );

  // Transform menu data to match MenuItem interface
  const parsedMenus: MenuItem[] = useMemo(() => {
    return menuAvailabilities.map((item) => ({
      id: item.menu_item.id as string,
      name: item.menu_item.name,
      description: item.menu_item.description,
      price: item.menu_item.price.toString(),
      image: item.menu_item.image,
      tags: item.menu_item.tags,
      categories:
        Array.isArray(item.menu_item.categories) &&
        item.menu_item.categories.length
          ? item.menu_item.categories
          : item.menu_item.category
          ? [item.menu_item.category]
          : [],
      category: item.menu_item.category ?? undefined,
      is_side: item.menu_item.is_side,
    }));
  }, [menuAvailabilities]);

  // Use useMemo to create the branch object directly, without relying on a state update
  const branch = useMemo(() => {
    return {
      ...parsedBranches,
      menus: parsedMenus,
    };
  }, [parsedBranches, parsedMenus]);

  // Get unique categories from menu items
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    parsedMenus.forEach((menu) => {
      const categoryList = menu.categories && menu.categories.length
        ? menu.categories
        : menu.category
        ? [menu.category]
        : [];

      categoryList.forEach((category) => {
        if (category) {
          uniqueCategories.add(category);
        }
      });
    });

    return [i18n.t("all_category_tab"), ...Array.from(uniqueCategories)];
  }, [parsedMenus]);

  // Filter menus based on active category and search query
  const filteredMenus = useMemo(() => {
    const lowerSearchQuery = searchQuery.toLowerCase();

    return parsedMenus.filter((menu) => {
      const categoryList = menu.categories && menu.categories.length
        ? menu.categories
        : menu.category
        ? [menu.category]
        : [];

      const matchesCategory =
        activeCategory === i18n.t("all_category_tab") ||
        categoryList.includes(activeCategory);
      const matchesSearch =
        searchQuery === "" ||
        menu.name.toLowerCase().includes(lowerSearchQuery) ||
        menu.description.toLowerCase().includes(lowerSearchQuery) ||
        categoryList.some((category) =>
          category.toLowerCase().includes(lowerSearchQuery)
        );

      return matchesCategory && matchesSearch;
    });
  }, [parsedMenus, activeCategory, searchQuery]);

  // Group filtered menus by category
  const categorizedMenus = useMemo(() => {
    const categoriesMap: { [key: string]: MenuItem[] } = {};

    filteredMenus.forEach((menu) => {
      const categoryList = menu.categories && menu.categories.length
        ? menu.categories
        : menu.category
        ? [menu.category]
        : [];
      const primaryCategory = categoryList[0] ?? "Others";

      if (!categoriesMap[primaryCategory]) {
        categoriesMap[primaryCategory] = [];
      }
      categoriesMap[primaryCategory].push(menu);
    });

    return categoriesMap;
  }, [filteredMenus]);

  const { data: allRelatedItems } = useGetRelatedMenus();

  // Map of related items for each menu item
  const relatedItemsMap = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    if (allRelatedItems) {
      allRelatedItems.forEach((item: any) => {
        const menuItemId = item.menu_item?.id;
        if (menuItemId) {
          if (!map[menuItemId]) {
            map[menuItemId] = [];
          }
          map[menuItemId].push({
            id: item.related_item.id,
            ...item.related_item,
          });
        }
      });
    }
    return map;
  }, [allRelatedItems]);

  if (isLoading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={"#96B76E"} />
        <Text style={styles.loadingText}>
          {i18n.t("loading_branch_details_text")}
        </Text>
      </View>
    );

  if (menuError)
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {i18n.t("failed_to_load_branch_details_error")}
        </Text>
      </View>
    );

  return (
    <SafeAreaView
      style={[styles.container, isWeb && !isMobile && styles.webContainer]}
    >
      <Appbar.Header
        style={[styles.header, isWeb && !isMobile && styles.webHeader]}
      >
        <Appbar.BackAction
          onPress={() =>
            router.replace({
              pathname: from as RelativePathString,
              params: { id: restaurantId as string },
            })
          }
        />
        <Appbar.Content
          title={i18n.t("menus_screen_title")}
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>
      <BellComponent tableId={tableId} />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && !isMobile && styles.webScrollContent,
        ]}
      >
        <View
          style={[
            styles.branchHeader,
            isWeb && !isMobile && styles.webBranchHeader,
          ]}
        >
          <Text style={styles.branchTitle}>{branch?.name || ""}</Text>
          <Text style={styles.branchAddress}>{branch?.address}</Text>
          <View style={styles.locationContainer}>
            <StarRating rating={parseInt(rating as string) || 0} />
            <Text style={styles.locationText}>{rating}/(200)</Text>
          </View>
        </View>

        <View
          style={[
            styles.searchContainer,
            isWeb && !isMobile && styles.webSearchContainer,
          ]}
        >
          <Searchbar
            placeholder={i18n.t("search_dishes_placeholder")}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[
              styles.searchBar,
              isWeb && !isMobile && (styles.webSearchBar as any),
            ]}
            iconColor={Colors.light.tint}
            inputStyle={styles.searchInput}
          />
        </View>

        <View style={styles.menuSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryTabsContainer}
            contentContainerStyle={styles.categoryTabsContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  activeCategory === category && styles.activeCategoryTab,
                ]}
                onPress={() => setActiveCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    activeCategory === category && styles.activeCategoryTabText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredMenus.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>
                {i18n.t("no_items_found_search_text")}
              </Text>
            </View>
          ) : (
            Object.entries(categorizedMenus).map(([category, items]) => (
              <View key={category} style={styles.categoryContainer}>
                <View
                  style={[
                    styles.itemsContainer,
                    isWeb && !isMobile && styles.webItemsContainer,
                  ]}
                >
                  {items.map((menu: MenuItem) => {
                    const relatedItemsForThisMenu =
                      relatedItemsMap[menu.id] || [];
                    return (
                      <View
                        key={menu.id}
                        style={[
                          styles.menuItem,
                          isWeb && !isMobile && styles.webMenuItem,
                          { width: isWeb && !isMobile ? "48%" : "100%" },
                        ]}
                      >
                        <DishRow
                          item={menu}
                          restaurantId={restaurantId as string}
                          branchId={branch?.id as string}
                          tableId={tableId as string}
                          onAddItem={() => setSelectedItemId(menu.id)}
                          relatedItems={relatedItemsForThisMenu}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFCF5",
  },
  webContainer: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1200,
  } as ViewStyle,
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  webScrollContent: {
    paddingHorizontal: 50,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: Colors.light.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.tint,
  },
  branchHeader: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: "#FFFCF5",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#D3D3D3",
  } as ViewStyle,
  webBranchHeader: {
    marginHorizontal: 20,
    marginTop: 20,
  } as ViewStyle,
  branchTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  branchAddress: {
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  locationText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 8,
  },
  defaultBranchText: {
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 8,
  },
  defaultBranchValue: {
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#FFFCF5",
  },
  webSearchContainer: {
    paddingHorizontal: 50,
  } as ViewStyle,
  searchBar: {
    borderRadius: 30,
    backgroundColor: "#546D3617",
    height: 45,
  } as ViewStyle,
  webSearchBar: {
    maxWidth: 600,
    alignSelf: "center",
  } as ViewStyle,
  searchInput: {
    color: Colors.light.text,
  },
  menuSection: {
    paddingHorizontal: 0,
    backgroundColor: "#FFFCF5",
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 16,
  },
  webMenuTitle: {
    fontSize: 28,
    textAlign: "center",
    marginVertical: 30,
  } as TextStyle,
  categoryContainer: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.light.tint,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.tabIconDefault,
  },
  webCategoryTitle: {
    fontSize: 24,
    marginVertical: 20,
  } as TextStyle,
  itemsContainer: {
    flexDirection: "column",
  },
  webItemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  } as ViewStyle,
  menuItem: {
    marginBottom: 0,
  },
  webMenuItem: {
    marginHorizontal: "1%",
  } as ViewStyle,
  recommendedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 16,
  },
  relatedItemContainer: {
    width: 280,
    marginRight: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  header: {
    backgroundColor: "#FFFCF5",
  },
  webHeader: {
    paddingHorizontal: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.text,
    alignSelf: "center",
    marginLeft: -20,
  },
  bellContainer: {
    position: "absolute",
    right: 20,
    top: 60,
    zIndex: 999,
    alignItems: "flex-end",
  },
  bellButton: {
    backgroundColor: "#E65C2D",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#fff",
  } as ViewStyle,
  pulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E65C2D",
    borderRadius: 30,
  } as ViewStyle,
  disabledBell: {
    opacity: 0.5,
  } as ViewStyle,
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  noResultsText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
  // Category tabs styles
  categoryTabsContainer: {
    marginBottom: 20,
    maxHeight: 50,
  },
  categoryTabsContent: {
    paddingHorizontal: 5,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#FAF3E9",
  },
  activeCategoryTab: {
    backgroundColor: "#9AC26B",
  },
  categoryTabText: {
    color: "#666",
    fontWeight: "500",
  },
  activeCategoryTabText: {
    color: "white",
    fontWeight: "bold",
  },
  // Order button styles
  orderButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledOrderButton: {
    backgroundColor: Colors.light.tabIconDefault,
  },
  orderButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default BranchDetailsScreen;
