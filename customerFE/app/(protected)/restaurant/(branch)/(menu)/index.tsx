import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Divider,
  Avatar,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { addToCart } from '@/lib/reduxStore/cartSlice';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/reduxStore/store';
import SwipeButton from 'rn-swipe-button';
import { Colors } from '@/constants/Colors';
import { useGetRelatedMenus } from '@/services/mutation/menuMutation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { i18n } from '@/app/_layout';
import { normalizeImageUrl } from '@/utils/imageUrl';

export default function DishDetailsScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const item = JSON.parse((params?.item as string) || '{}'); // Changed default to empty object
  const cartItems = useSelector((state: RootState) => state.cart.items.length);

  const { restaurantId, branchId, tableId } = useLocalSearchParams();
  const { data: fetchAllRelatedItems } = useGetRelatedMenus();

  const filteredRelatedItems = useMemo(() => {
    if (!item.id || !fetchAllRelatedItems) {
      // Check for item.id existence
      return fetchAllRelatedItems || [];
    }
    return fetchAllRelatedItems.filter(
      (relatedItem: any) => relatedItem.menu_item?.id === item.id.toString() // Corrected comparison
    );
  }, [item.id, fetchAllRelatedItems]); // Added item.id to dependencies
  const swipeButtonRef = useRef<any>(null);
  const [resetTrigger, setResetTrigger] = useState(false);
  const handleSwipe = () => {
    if (cartItems > 0) {
      router.push({
        pathname: `/(protected)/cart` as any,
        params: {
          restaurantId,
          branchId,
          tableId, // Pass the table ID as well
        },
      });
      setResetTrigger((prev: any) => !prev);
    }
  };
  const handleRelatedItemPress = (selectedItem: any) => {
    router.push({
      pathname: '/(protected)/restaurant/(branch)/(menu)',
      params: {
        item: JSON.stringify(selectedItem),
        restaurantId,
        branchId,
        tableId,
      },
    });
  };
  const handleAddToCart = () => {
    console.log(item);
    dispatch(
      addToCart({
        item: { ...item, quantity: 1 }, // Add quantity to the item
        restaurantId: restaurantId as string, // Pass restaurantId
        branchId: branchId as string, // Pass branchId
        tableId: tableId as string, // Pass tableId
        paymentAPIKEY: item?.tenant?.CHAPA_API_KEY || '', // Added nullish coalescing
        paymentPUBLICKEY: item?.tenant?.CHAPA_PUBLIC_KEY || '', // Added nullish coalescing
      })
    );
  };
  useEffect(() => {
    if (swipeButtonRef.current && resetTrigger) {
      swipeButtonRef.current.reset();
      setResetTrigger(false);
    }
  }, [resetTrigger]);
  useEffect(() => {
    if (cartItems === 0) {
      setResetTrigger((prev) => !prev);
    }
  }, [cartItems]);
  const renderRelatedItems = () => {
    if (Array.isArray(filteredRelatedItems) && !filteredRelatedItems.length)
      return null;

    return (
      <Card style={styles.sidesCard}>
        <Text style={styles.sidesTitle}>
          {i18n.t('recommended_sides_title')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(filteredRelatedItems as any)?.map((relatedItem: any) => (
            <TouchableOpacity
              key={relatedItem.id}
              onPress={() => handleRelatedItemPress(relatedItem)}
            >
              <Avatar.Image
                size={60}
                source={{
                  uri: normalizeImageUrl(relatedItem.image),
                }}
                style={styles.sideAvatar}
              />
              <Text style={styles.relatedItemName}>{relatedItem.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>
    );
  };
  return (
    <SafeAreaView>
      <ScrollView style={styles.container}>
        <Card style={styles.imageCard}>
          <Image
            source={{ uri: normalizeImageUrl(item?.image) }}
            style={styles.mainImage}
          />
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            iconColor="white"
          />
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Divider style={styles.divider} />
            <Text style={styles.price}>
              {i18n.t('price_label')}: {i18n.t('currency_symbol')}
              {item.price}
            </Text>
          </Card.Content>
        </Card>
        {renderRelatedItems()}
        <Card.Actions style={styles.actions}>
          <Button
            mode="contained"
            textColor="white"
            icon="cart-plus"
            style={styles.addToCartButton}
            onPress={handleAddToCart}
          >
            {i18n.t('add_to_cart_button')}
          </Button>
        </Card.Actions>

        <View className="p-5 bg-white shadow-lg mt-28">
          <SwipeButton
            disabled={cartItems === 0}
            onSwipeSuccess={handleSwipe}
            thumbIconBackgroundColor={Colors.light.tint}
            thumbIconBorderColor={Colors.light.tint}
            railBackgroundColor={Colors.light.background}
            railBorderColor={Colors.light.icon}
            title={i18n.t('swipe_to_add_to_order_title')}
            titleColor={
              cartItems === 0 ? Colors.light.tabIconDefault : Colors.light.tint
            }
            railFillBackgroundColor={Colors.light.tint}
            railFillBorderColor={Colors.light.tint}
            shouldResetAfterSuccess={true}
            resetAfterSuccessAnimDelay={300}
            key={resetTrigger ? 'swipe-reset-trigger' : 'swipe-normal'}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  imageCard: {
    borderRadius: 0,
    position: 'relative',
  },
  mainImage: {
    height: 250,
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#00000099',
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 16,
    elevation: 4,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  description: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  sidesCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  sidesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  sideAvatar: {
    marginRight: 12,
  },
  actions: {
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addToCartButton: {
    backgroundColor: 'black',
  },
  relatedItemName: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    width: 60,
    color: Colors.light.text,
  },
});
