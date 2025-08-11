import {
  useGetNotifications,
  useMarkNotificationAsRead,
} from "@/services/mutation/notificationMutation";
import React, { useState, useEffect, useRef } from "react";
import { router } from "expo-router";
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  Animated,
  Platform,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  Card,
  Appbar,
  IconButton,
  TouchableRipple,
  ActivityIndicator,
  Modal,
  Button,
} from "react-native-paper";
import { ThemedView } from "@/components/ThemedView";
import BowlIcon from "@/assets/icons/selectedBowl.svg";
import { i18n } from "@/app/_layout";

interface NotificationType {
  id: string;
  created_at: string;
  is_read: boolean;
  message: string;
  notification_type: string;
}

const NotificationsScreen = () => {
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const contentAnimation = useRef(new Animated.Value(0)).current;
  const filterAnimation = useRef(new Animated.Value(0)).current;
  const [filteredNotifications, setFilteredNotifications] = useState<
    NotificationType[]
  >([]);
  const [allNotifications, setAllNotifications] = useState<NotificationType[]>(
    []
  );
  const [nextPage, setNextPage] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "order" | "promo">("all");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationType | null>(null);
  const { data, isLoading, refetch } = useGetNotifications(nextPage);
  const { mutateAsync: markAsRead } = useMarkNotificationAsRead();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(filterAnimation, {
        toValue: 1,
        duration: 1000,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnimation, {
        toValue: 1,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnimation, filterAnimation, contentAnimation]);

  useEffect(() => {
    if (data?.results && data.results.length > 0) {
      setAllNotifications((prevNotifications) => [
        ...prevNotifications,
        ...data.results.filter(
          (notification: any) =>
            !prevNotifications.some((o) => o.id === notification.id)
        ),
      ]);
    }
  }, [data]);

  useEffect(() => {
    applyFilter();
  }, [filter, allNotifications]);

  const applyFilter = () => {
    let filtered = allNotifications || [];
    if (filter !== "all") {
      filtered = filtered.filter((notification: any) =>
        filter === "order"
          ? notification.notification_type?.includes("Order")
          : notification.notification_type === "Promotion"
      );
    }
    setFilteredNotifications(filtered);
  };

  const getIcon = (
    notificationType: string
  ): string | ((props: { color: string }) => React.ReactNode) => {
    if (notificationType?.includes("Order")) {
      return (props) => <BowlIcon color={props.color} />;
    }
    if (notificationType === "Promotion") return "tag";
    return "bell";
  };

  const getNotificationColor = (notificationType: string) => {
    if (notificationType?.includes("Order"))
      return { bg: "#E8F5E9", icon: "#4CAF50" };
    if (notificationType === "Promotion")
      return { bg: "#F3E5F5", icon: "#9C27B0" };
    return { bg: "#E3F2FD", icon: "#2196F3" };
  };

  const handleNotificationPress = async (notification: NotificationType) => {
    setSelectedNotification(notification);
    try {
      await markAsRead(notification.id);
      setAllNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const closeModal = () => {
    setSelectedNotification(null);
  };

  const handleBackdropPress = () => {
    closeModal();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setNextPage(undefined);
    await refetch();
    setRefreshing(false);
  };

  const loadMoreOrders = () => {
    if (data?.next && !isLoading) {
      setNextPage(data.next);
    }
  };

  const renderNotification = ({ item }: { item: NotificationType }) => {
    const colors = getNotificationColor(item.notification_type);
    const isUnread = !item.is_read;

    return (
      <View style={styles.card}>
        <TouchableRipple onPress={() => handleNotificationPress(item)}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconBackground,
                  { backgroundColor: "#96B76E66" },
                ]}
              >
                <IconButton
                  icon={getIcon(item.notification_type)}
                  size={20}
                  iconColor={colors.icon}
                  style={styles.iconButton}
                />
              </View>
              {isUnread && <View style={styles.unreadBadge} />}
            </View>

            <View style={styles.textContainer}>
              <View style={styles.headerRow}>
                <Text
                  variant="titleMedium"
                  style={[styles.cardTitle, isUnread && styles.unreadText]}
                  numberOfLines={1}
                >
                  {item.notification_type}
                </Text>
              </View>
              <Text
                variant="bodyMedium"
                style={styles.message}
                numberOfLines={2}
              >
                {item.message}
              </Text>
            </View>
          </Card.Content>
        </TouchableRipple>
      </View>
    );
  };

  const renderModal = () => {
    const windowHeight = Dimensions.get("window").height;
    const notificationType = selectedNotification?.notification_type || "";
    const colors = getNotificationColor(notificationType);

    return (
      <Modal
        visible={!!selectedNotification}
        onDismiss={closeModal}
        contentContainerStyle={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.modalContent, { maxHeight: windowHeight * 0.8 }]}>
          <View style={styles.modalHeader}>
            <IconButton
              icon={getIcon(notificationType)}
              iconColor={colors.icon}
              size={24}
              style={[
                styles.modalIcon,
                {
                  backgroundColor: "#96B76E66",
                },
              ]}
            />
            <Text variant="titleLarge" style={styles.modalTitle}>
              {selectedNotification?.notification_type}
            </Text>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text variant="bodyLarge" style={styles.modalMessage}>
              {selectedNotification?.message}
            </Text>
          </ScrollView>

          <Button
            mode="contained"
            style={styles.modalButton}
            onPress={closeModal}
            theme={{ colors: { primary: "#96B76E" } }}
          >
            {i18n.t("close_modal_button")}
          </Button>
        </View>
      </Modal>
    );
  };

  if (isLoading && allNotifications.length === 0) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#96B76E" />
      </ThemedView>
    );
  }

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
            <Appbar.BackAction onPress={() => router.back()} />
            <Appbar.Content
              title={i18n.t("notifications_screen_title")}
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
          <Animated.View
            style={[
              styles.filterContainer,
              {
                opacity: filterAnimation,
                transform: [
                  {
                    translateY: filterAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  filter === "all" && styles.activeTabButton,
                ]}
                onPress={() => setFilter("all")}
              >
                <Text
                  style={[
                    styles.tabText,
                    filter === "all" && styles.activeTabText,
                  ]}
                >
                  {i18n.t("all_filter_tab")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  filter === "order" && styles.activeTabButton,
                ]}
                onPress={() => setFilter("order")}
              >
                <Text
                  style={[
                    styles.tabText,
                    filter === "order" && styles.activeTabText,
                  ]}
                >
                  {i18n.t("orders_filter_tab")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  filter === "promo" && styles.activeTabButton,
                ]}
                onPress={() => setFilter("promo")}
              >
                <Text
                  style={[
                    styles.tabText,
                    filter === "promo" && styles.activeTabText,
                  ]}
                >
                  {i18n.t("promotions_filter_tab")}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            renderItem={renderNotification}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <IconButton
                  icon="bell-sleep-outline"
                  size={48}
                  iconColor="#666"
                  style={styles.emptyIcon}
                />
                <Text variant="titleMedium" style={styles.emptyText}>
                  {i18n.t("no_notifications_empty_text")}
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubText}>
                  {i18n.t("notify_new_arrives_empty_subtext")}
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#96B76E"]}
                progressBackgroundColor="#ffffff"
              />
            }
            onEndReached={loadMoreOrders}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoading ? (
                <ActivityIndicator size="small" color="#96B76E" animating />
              ) : null
            }
          />
        </Animated.View>

        {renderModal()}
      </SafeAreaView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFDFC",
  },
  safeArea: {
    flex: 1,
  },
  appbarContainer: {
    ...Platform.select({
      web: {
        maxWidth: 800,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  appbar: {
    backgroundColor: "#FDFDFC",
  },
  appbarTitle: {
    fontWeight: "600",
    color: "#333",
  },
  contentContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        maxWidth: 800,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: Platform.OS === "web" ? 20 : 16,
    paddingVertical: 8,
    gap: 8,
    flexWrap: "wrap",
    justifyContent: Platform.OS === "web" ? "center" : "flex-start",
  },
  card: {
    marginHorizontal: Platform.OS === "web" ? 20 : 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: "center",
      },
    }),
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  iconContainer: {
    position: "relative",
    marginRight: 16,
  },
  iconBackground: {
    borderRadius: 8,
    padding: 4,
  },
  iconButton: {
    margin: 0,
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF4081",
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    flex: 1,
    marginRight: 8,
    color: "#333",
    fontWeight: "600",
  },
  unreadText: {
    fontWeight: "700",
    color: "#96B76E",
  },
  timestamp: {
    color: "#757575",
  },
  message: {
    color: "#616161",
    lineHeight: 20,
    fontSize: 14,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  emptyIcon: {
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
  },
  emptyText: {
    textAlign: "center",
    color: "#616161",
    fontWeight: "600",
  },
  emptySubText: {
    textAlign: "center",
    color: "#9E9E9E",
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 16,
    flexGrow: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    marginHorizontal: 20,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  modalIcon: {
    margin: 0,
    borderRadius: 5,
  },
  modalTitle: {
    fontWeight: "600",
    flex: 1,
    color: "#333",
  },
  modalBody: {
    maxHeight: "70%",
    marginVertical: 4,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
    color: "#616161",
  },
  modalButton: {
    marginTop: 16,
    borderRadius: 30,
    backgroundColor: "#96B76E",
    ...Platform.select({
      web: {
        maxWidth: 320,
        width: "100%",
        alignSelf: "center",
      },
    }),
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    overflow: "hidden",
    marginTop: 10,
    padding: 3,
    backgroundColor: "#FDFDFC",
    width: "100%",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: "#546D3617",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  activeTabText: {
    color: "#96B76E",
    fontWeight: "700",
  },
});

export default NotificationsScreen;
