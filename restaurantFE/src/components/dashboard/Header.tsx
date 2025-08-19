import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { IconButton, TextInput, Avatar, Text, Badge } from "react-native-paper";
import { router } from "expo-router";
import { useResponsive } from "@/hooks/useResponsive";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [blink, setBlink] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const { isTablet } = useResponsive();

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const notifications = ["New message received", "Server status updated"];

  return (
    <View style={[styles.header, isTablet && styles.headerTablet]}>
      {/* Sidebar Toggle Button */}
      <IconButton
        icon="menu"
        size={24}
        onPress={toggleSidebar}
        style={styles.sidebarButton}
        iconColor="#3b82f6"
      />

      {/* Search Bar */}
      <View style={[styles.searchBar, isTablet && styles.searchBarTablet]}>
        <TextInput
          mode="outlined"
          placeholder="Search here..."
          style={styles.searchInput}
          left={<TextInput.Icon icon="magnify" />}
        />
      </View>

      {/* Action Icons */}
      <View style={[styles.actionIcons, isTablet && styles.actionIconsTablet]}>
        {/* Full Screen Icon */}
        <IconButton
          icon="fullscreen"
          size={24}
          style={styles.iconButton}
          iconColor="#3b82f6"
        />

        {/* Chat Icon */}
        <IconButton
          icon="chat"
          size={24}
          style={styles.iconButton}
          iconColor="#3b82f6"
        />

        {/* Notification Bell */}
        <TouchableOpacity
          style={styles.notificationBell}
          onPress={() => setTooltipVisible(!tooltipVisible)}
        >
          <IconButton icon="bell" size={24} iconColor="#f43f5e" />
          {blink && <Badge style={styles.badge} />}
        </TouchableOpacity>

        {tooltipVisible && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>Notifications</Text>
            {notifications.map((notification, index) => (
              <Text key={index} style={styles.tooltipText}>
                {notification}
              </Text>
            ))}
          </View>
        )}

        {/* Profile */}
        <TouchableOpacity onPress={() => router.push("/(protected)/profile")}>
          <View style={styles.profileContainer}>
            <Text style={styles.profileText}>Hello, Amanu</Text>
            <Avatar.Image
              size={40}
              source={{ uri: "https://via.placeholder.com/40" }}
              style={styles.avatar}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    elevation: 4,
  },
  headerTablet: {
    paddingHorizontal: 32,
  },
  sidebarButton: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    marginHorizontal: 8,
  },
  searchBarTablet: {
    maxWidth: 400,
  },
  searchInput: {
    height: 40,
  },
  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIconsTablet: {
    gap: 12,
  },
  iconButton: {
    marginHorizontal: 4,
    backgroundColor: "#e3f2fd",
    borderRadius: 8,
  },
  notificationBell: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#f43f5e",
  },
  tooltip: {
    position: "absolute",
    top: 40,
    right: 0,
    //
    padding: 8,
    borderRadius: 8,
    elevation: 2,
    zIndex: 10,
  },
  tooltipTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  tooltipText: {
    color: "#666",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 8,
  },
  profileText: {
    marginRight: 8,
    color: "#3b82f6",
    fontWeight: "600",
  },
  avatar: {
    backgroundColor: "#3b82f6",
  },
});
