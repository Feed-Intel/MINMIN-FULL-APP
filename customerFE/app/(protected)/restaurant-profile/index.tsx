import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Appbar, Button, Divider } from 'react-native-paper';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import RestaurantCard from '@/components/ui/RestaurantCard';
import { useSearchMenuAvailabilities } from '@/services/mutation/menuMutation';
import ReviewCard from '@/components/ui/ReviewCard';
import { i18n } from '@/app/_layout';
import { normalizeImageUrl } from '@/utils/imageUrl';

const RestaurantProfile = () => {
  const [activeTab, setActiveTab] = useState<'branches' | 'posts' | 'reviews'>(
    'branches'
  );
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { width } = Dimensions.get('window');
  const photoSize = (width - 32 - 16) / 3;
  const { id: restaurantId } = useLocalSearchParams();

  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useSearchMenuAvailabilities(`tenant=${restaurantId}&is_available=true`);

  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    if (data.length > 0 && restaurantId) {
      processRestaurantData();
    }
  }, [data, restaurantId]);

  const processRestaurantData = () => {
    try {
      // Filter items for this specific restaurant
      const restaurantItems = data.filter(
        (item: any) => item.branch.tenant.id === restaurantId
      );

      if (restaurantItems.length === 0) return;

      // Get restaurant info from the first item
      const firstItem = restaurantItems[0];
      const restaurantInfo = {
        id: restaurantId,
        name: firstItem.branch.tenant?.restaurant_name,
        average_rating: firstItem.branch.tenant?.average_rating || 0,
        service_charge: firstItem.branch.tenant?.service_charge,
        tax: firstItem.branch.tenant?.tax,
        image: firstItem.branch.tenant?.image,
        description: firstItem.branch.tenant?.profile,
        CHAPA_API_KEY: firstItem.branch.tenant?.CHAPA_API_KEY,
        CHAPA_PUBLIC_KEY: firstItem.branch.tenant?.CHAPA_PUBLIC_KEY,
      };

      // Group branches and collect menu item images
      const branchesMap = new Map();
      restaurantItems.forEach((item: any) => {
        const branch = item.branch;
        if (!branchesMap.has(branch.id)) {
          branchesMap.set(branch.id, {
            ...branch,
            menuItems: [],
          });
        }
        const branchData = branchesMap.get(branch.id);
        if (branchData.menuItems.length < 3 && item.menu_item.image) {
          branchData.menuItems.push(item.menu_item.image);
        }
      });

      // Convert map to array
      const branchesArray = Array.from(branchesMap.values()).map((branch) => ({
        id: branch.id,
        name: branch.tenant.restaurant_name,
        address: branch.address,
        distanceKm: branch.distance_km || 0,
        sampleDishes: branch.menuItems
          .map((uri: string) => normalizeImageUrl(uri) || uri)
          .filter(Boolean),
        posts: branch.tenant.posts,
        feedbacks: branch.tenant.feedbacks,
      }));

      setRestaurantData(restaurantInfo);
      setBranches(branchesArray);
    } catch (err) {
      console.error(i18n.t('error_processing_restaurant_data_message'), err);
    }
  };

  // Convert branch data to RestaurantCard format
  const getBranchCardData = (branch: any) => ({
    restaurant_name: branch.name + ', ' + branch.address,
    average_rating: restaurantData?.average_rating || 0,
    sampleDishes: branch.sampleDishes,
    distanceKm: branch.distanceKm,
    branchAddress: branch.address,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#546D36" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {i18n.t('failed_to_load_restaurant_data_error')}
        </Text>
        <Button onPress={() => refetch()}>{i18n.t('retry_button')}</Button>
      </View>
    );
  }

  if (!restaurantData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {i18n.t('restaurant_not_found_error')}
        </Text>
      </View>
    );
  }

  const handleSeeAllPosts = () => {
    setShowAllPosts(!showAllPosts);
  };

  const handleSeeAllReviews = () => {
    setShowAllReviews(!showAllReviews);
  };

  // Render content for the header of the main FlatList
  const ListHeader = () => (
    <>
      {/* Restaurant Image - Placeholder */}
      <Image
        source={{
          uri:
            normalizeImageUrl(restaurantData.image) ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
        }}
        style={styles.restaurantImage}
      />

      {/* Restaurant Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.restaurantName}>{restaurantData.name}</Text>
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={20} color="#617D3E" />
          <Text style={styles.ratingText}>
            {restaurantData.average_rating.toFixed(1)} (
            {branches[0]?.feedbacks?.length || 0} {i18n.t('reviews_tab')})
          </Text>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>{restaurantData.description}</Text>
        </View>
      </View>
      <Divider style={styles.divider} />

      {/* Tabs Navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'branches' && styles.activeTab]}
          onPress={() => setActiveTab('branches')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'branches' && styles.activeTabText,
            ]}
          >
            {i18n.t('branches_tab')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'posts' && styles.activeTabText,
            ]}
          >
            {i18n.t('posts_tab')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'reviews' && styles.activeTabText,
            ]}
          >
            {i18n.t('reviews_tab')}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderTabContent = () => {
    if (activeTab === 'branches') {
      console.log(restaurantData);
      return (
        <View style={styles.tabContent}>
          {branches.length > 0 ? (
            branches.map((branch) => (
              <View key={branch.id} style={styles.branchCardWrapper}>
                <RestaurantCard
                  item={getBranchCardData(branch)}
                  showCategory={false}
                  callBack={() =>
                    router.push({
                      pathname: `(protected)/restaurant/(branch)` as any,
                      params: {
                        restaurantId: restaurantId as string,
                        branchId: JSON.stringify(branch),
                        rating: restaurantData?.average_rating || 0,
                        tableId: 'null',
                        from: '/(protected)/restaurant-profile',
                        service_charge: restaurantData?.service_charge || 0,
                        tax: restaurantData?.tax,
                        CHAPA_API_KEY: restaurantData?.CHAPA_API_KEY || '',
                        CHAPA_PUBLIC_KEY:
                          restaurantData?.CHAPA_PUBLIC_KEY || '',
                      },
                    })
                  }
                />
              </View>
            ))
          ) : (
            <Text style={styles.message}>
              {i18n.t('no_branches_found_message')}
            </Text>
          )}
        </View>
      );
    } else if (activeTab === 'posts') {
      const postsToShow = showAllPosts
        ? branches[0]?.posts || []
        : (branches[0]?.posts || []).slice(0, 3);
      return (
        <View style={styles.tabContent}>
          <View style={styles.photosHeader}>
            <Text style={styles.sectionTitle}>{i18n.t('posts_tab')}</Text>
            {branches[0]?.posts?.length > 3 && (
              <TouchableOpacity onPress={handleSeeAllPosts}>
                <Text style={styles.seeAllText}>
                  {showAllPosts
                    ? i18n.t('see_less_button')
                    : i18n.t('see_all_button')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {postsToShow.length > 0 ? (
            <FlatList
              key={'posts-list-' + showAllPosts} // Added key to force re-render
              data={postsToShow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    router.push({
                      pathname: `(protected)/restaurant-profile/feed` as any,
                      params: {
                        ...item,
                        comments: JSON.stringify(item.comments),
                      },
                    });
                  }}
                >
                  <Image
                    source={{
                      uri: normalizeImageUrl(item.image),
                    }}
                    style={[
                      styles.photoItem,
                      { width: photoSize, height: photoSize },
                    ]}
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
              numColumns={3}
              columnWrapperStyle={styles.photosGrid}
              scrollEnabled={false} // Disable inner FlatList scrolling
            />
          ) : (
            <Text style={styles.message}>
              {i18n.t('no_posts_available_message')}
            </Text>
          )}
        </View>
      );
    } else if (activeTab === 'reviews') {
      const reviewsToShow = showAllReviews
        ? branches[0]?.feedbacks || []
        : (branches[0]?.feedbacks || []).slice(0, 3);
      return (
        <View style={styles.tabContent}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>
              {i18n.t('customer_reviews_section_title')}
            </Text>
            {branches[0]?.feedbacks?.length > 3 && (
              <TouchableOpacity onPress={handleSeeAllReviews}>
                <Text style={styles.seeAllText}>
                  {showAllReviews
                    ? i18n.t('see_less_button')
                    : i18n.t('see_all_button')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {reviewsToShow.length > 0 ? (
            <FlatList
              key={'reviews-list-' + showAllReviews} // Added key to force re-render
              data={reviewsToShow}
              renderItem={({ item }) => (
                <ReviewCard
                  userName={item.customer.full_name}
                  timeAgo={item.created_at}
                  reviewText={item.comment}
                  rating={item.overall_rating}
                  userAvatarUrl={item.customer.image}
                />
              )}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false} // Disable inner FlatList scrolling
              contentContainerStyle={styles.tabContent}
            />
          ) : (
            <Text style={styles.message}>
              {i18n.t('no_reviews_available_message')}
            </Text>
          )}
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.replace('/search')} />
        <Appbar.Content
          title={i18n.t('restaurant_profile_title')}
          titleStyle={styles.headerTitle}
        />
      </Appbar.Header>

      <FlatList
        data={[]} // Empty data array as content is managed by ListHeaderComponent and renderTabContent
        ListHeaderComponent={ListHeader}
        renderItem={null} // No individual items to render in the main FlatList
        ListFooterComponent={renderTabContent()} // Render the active tab content as the footer
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()} // Fallback key extractor
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    backgroundColor: '#FDFDFC',
    paddingTop: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    alignSelf: 'center',
    marginLeft: -20,
  },
  restaurantImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  infoContainer: {
    padding: 16,
    paddingBottom: 12,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  tabText: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '500',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#546D3617',
  },
  activeTabText: {
    color: '#668442',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 4,
  },
  tabContent: {
    padding: 16,
    paddingTop: 12,
  },
  branchCardWrapper: {
    marginBottom: 16,
  },
  viewBranch: {
    color: '#617D3E',
  },
  photosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  seeAllText: {
    color: '#617D3E',
    fontWeight: '500',
  },
  photosGrid: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  photoItem: {
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ff0000',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginVertical: 20,
  },
});

export default RestaurantProfile;
