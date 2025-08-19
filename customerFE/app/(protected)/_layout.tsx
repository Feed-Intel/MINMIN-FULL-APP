import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import FeedIcon from "@/assets/icons/feed.svg";
import FeedSelectedIcon from "@/assets/icons/selectedFeed.svg";
import SearchIcon from "@/assets/icons/search.svg";
import SearchSelectedIcon from "@/assets/icons/selectedSearch.svg";
import ScanIcon from "@/assets/icons/scan.svg";
import BowlIcon from "@/assets/icons/bowl.svg";
import BowlSelectedIcon from "@/assets/icons/selectedBowl.svg";
import OrdersIcon from "@/assets/icons/orders.svg";
import OrdersSelectedIcon from "@/assets/icons/selectedOrders.svg";
import { Platform } from "react-native";
import { useWebSockets } from "@/hooks/useWebSockets";
import { HapticTab } from "@/components/HapticTab";
import { Colors } from "@/constants/Colors";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useAppSelector } from "@/lib/reduxStore/hooks";
import { usePushNotifications } from "@/hooks/usePushNotification";
import { useUpdateProfile } from "@/services/mutation/authMutation";
import { useAuth } from "@/context/auth";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/reduxStore/store";
import { i18n } from "@/app/_layout";

export default function ProtectedLayout() {
  useWebSockets();
  const { notification, expoPushToken } = usePushNotifications();
  const { user: userInfo } = useAuth();
  const { mutateAsync: updateUser } = useUpdateProfile();
  const location = useAppSelector((state) => state.location);
  const currentLocale = useSelector(
    (state: RootState) => state.language.locale
  );

  useEffect(() => {
    console.log(currentLocale);
    if (currentLocale) {
      i18n.locale = currentLocale;
    }
  }, [currentLocale]);

  useEffect(() => {
    if (Boolean(expoPushToken?.data)) {
      const formData = new FormData();
      formData.append("id", userInfo?.id ? userInfo?.id! : userInfo?.user_id!);
      formData.append("push_token", expoPushToken?.data!);
      if (Boolean(location?.longitude) && location?.longitude != "null") {
        formData.append("lng", location?.longitude!);
        formData.append("lat", location?.latitude!);
      }
      updateUser(formData);
    } else if (
      Boolean(location?.longitude) &&
      location?.latitude != "null" &&
      userInfo?.id
    ) {
      const formData = new FormData();
      formData.append("id", userInfo?.id ? userInfo?.id! : userInfo?.user_id!);
      formData.append("lng", location?.longitude!);
      formData.append("lat", location?.latitude!);
      updateUser(formData);
    }
  }, [expoPushToken, location]);

  const cartItemCount = useAppSelector((state) => state.cart.items.length);
  const placedOrdersCount = useAppSelector((state) => state.pendingOrder);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: false,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
            borderTopWidth: 0,
          },
          default: {},
        }),
      }}
    >
      {/* Feed Tab */}
      <Tabs.Screen
        name="feed/index"
        options={{
          title: "Feed",
          tabBarIcon: ({ focused, color }) =>
            focused ? (
              <FeedSelectedIcon width={24} height={24} />
            ) : (
              <FeedIcon width={24} height={24} fill={color} />
            ),
        }}
      />

      {/* Search Tab */}
      <Tabs.Screen
        name="search/index"
        options={{
          title: "Search",
          tabBarIcon: ({ focused, color }) =>
            focused ? (
              <SearchSelectedIcon width={24} height={24} fill={color} />
            ) : (
              <SearchIcon width={24} height={24} fill={color} />
            ),
        }}
      />

      {/* Camera Tab - No selected state */}
      <Tabs.Screen
        name="camera/index"
        options={{
          title: "Scan",
          tabBarIcon: ({ focused, color }) => (
            // focused?
            <ScanIcon width={24} height={25} fill={color} />
            // :
          ),
        }}
      />

      <Tabs.Screen
        name="camera/scanner/index"
        options={{
          href: null,
        }}
      />

      {/* Cart (Bowl) Tab */}
      <Tabs.Screen
        name="cart/index"
        options={{
          title: "Cart",
          tabBarIcon: ({ focused, color }) =>
            focused ? (
              <BowlSelectedIcon width={24} height={24} fill={color} />
            ) : (
              <BowlIcon width={24} height={24} fill={color} />
            ),
          tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
        }}
      />

      {/* Orders Tab */}
      <Tabs.Screen
        name="orderHistory/index"
        options={{
          title: "Order History",
          tabBarIcon: ({ focused, color }) =>
            focused ? (
              <OrdersSelectedIcon width={24} height={24} fill={color} />
            ) : (
              <OrdersIcon width={24} height={24} fill={color} />
            ),
          tabBarBadge: placedOrdersCount > 0 ? placedOrdersCount : undefined,
        }}
      />

      {/* Hidden screens remain unchanged */}
      <Tabs.Screen name="linking" options={{ href: null }} />
      <Tabs.Screen name="checkOut/index" options={{ href: null }} />
      <Tabs.Screen name="menu/[menuID]" options={{ href: null }} />
      <Tabs.Screen name="orderConfirmation/index" options={{ href: null }} />
      <Tabs.Screen name="orderTracking/index" options={{ href: null }} />
      <Tabs.Screen name="rating/index" options={{ href: null }} />
      <Tabs.Screen name="restaurant/(branch)/index" options={{ href: null }} />
      <Tabs.Screen name="restaurant-profile/index" options={{ href: null }} />
      <Tabs.Screen
        name="restaurant/(branch)/(menu)/index"
        options={{ href: null }}
      />
      {/* <Tabs.Screen name="camera/scanner/index" options={{ href: null }} /> */}
      <Tabs.Screen
        name="notification/index"
        options={{ title: "Notifications", href: null }}
      />
      <Tabs.Screen
        name="saved-posts/index"
        options={{ title: "Saved Posts", href: null }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ title: "Profile", href: null }}
      />
      <Tabs.Screen name="profile/WebPageView" options={{ href: null }} />
      {/* <Tabs.Screen name="home/index" options={{ title: "Home", href: null }} /> */}
      <Tabs.Screen
        name="orderHistory/feedback"
        options={{ title: "Feedback", href: null }}
      />
      {/* <Tabs.Screen
        name="payment/index"
        options={{ title: "Payment", href: null }}
      /> */}
      <Tabs.Screen
        name="payment/paymentSuccess"
        options={{ title: "Payment Success", href: null }}
      />
      <Tabs.Screen
        name="payment/[paymentID]"
        options={{ title: "Payment Webview", href: null }}
      />
      <Tabs.Screen name="restaurant-profile/feed" options={{ href: null }} />
    </Tabs>
  );
}
