import React, { useEffect } from "react";
import {
  ScrollView,
  View,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { useAppSelector } from "@/lib/reduxStore/hooks";
import {
  List,
  Badge,
  Text,
  IconButton,
  useTheme,
  Divider,
  Caption,
  Title,
} from "react-native-paper";
import { useDispatch } from "react-redux";
import { markAllNotificationsRead } from "@/lib/reduxStore/notificationSlice";

const NotificationScreen = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const notifications = useAppSelector((state) => state.notifications.items);
  const unreadCount = useAppSelector(
    (state) => state.notifications.items.filter((n) => !n.read).length
  );

  // Screen size breakpoints
  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;
  const isLargeScreen = width >= 1024;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: isSmallScreen ? 16 : 24,
            paddingVertical: isSmallScreen ? 12 : 16,
          },
        ]}
      >
        <Title style={[styles.title, { fontSize: isSmallScreen ? 20 : 24 }]}>
          Notifications
        </Title>
        <View style={styles.headerActions}>
          <Badge
            visible={unreadCount > 0}
            size={isSmallScreen ? 20 : 24}
            style={styles.badge}
          >
            {unreadCount}
          </Badge>
          <IconButton
            icon="check-all"
            size={isSmallScreen ? 20 : 24}
            onPress={() => dispatch(markAllNotificationsRead())}
          />
        </View>
      </View>
      <Divider bold={isLargeScreen} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notifications.length === 0 ? (
          <View
            style={[styles.emptyState, { padding: isSmallScreen ? 20 : 32 }]}
          >
            <Text style={{ fontSize: isSmallScreen ? 14 : 16 }}>
              No notifications yet
            </Text>
          </View>
        ) : (
          <List.Section style={styles.listSection}>
            {notifications
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              )
              .map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <List.Item
                    title={notification.type}
                    description={notification.message}
                    titleStyle={{ fontSize: isSmallScreen ? 14 : 16 }}
                    descriptionStyle={{ fontSize: isSmallScreen ? 12 : 14 }}
                    left={() => (
                      <List.Icon
                        icon={
                          notification.type === "Waiter Call" ? "bell" : "food"
                        }
                        color={
                          notification.read
                            ? theme.colors.onSurface
                            : theme.colors.primary
                        }
                      />
                    )}
                    right={() => (
                      <Caption
                        style={[
                          styles.timestamp,
                          { fontSize: isSmallScreen ? 12 : 14 },
                        ]}
                      >
                        {new Date(notification.timestamp).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: !isSmallScreen,
                          }
                        )}
                      </Caption>
                    )}
                    style={[
                      styles.listItem,
                      {
                        backgroundColor: notification.read
                          ? theme.colors.background
                          : theme.colors.surface,
                        paddingLeft: isSmallScreen ? 16 : 24,
                        paddingRight: isSmallScreen ? 8 : 16,
                      },
                    ]}
                    onPress={() => {
                      // Handle notification press (mark as read)
                    }}
                  />
                  {index < notifications.length - 1 && (
                    <Divider
                      style={{
                        marginLeft: isSmallScreen ? 16 : 24,
                        marginRight: isSmallScreen ? 16 : 24,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
          </List.Section>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    marginRight: 4,
  },
  scrollContent: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
  },
  listSection: {
    marginHorizontal: 8,
  },
  listItem: {
    paddingVertical: 12,
  },
  timestamp: {
    alignSelf: "center",
    marginRight: 8,
  },
});

export default NotificationScreen;
