import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { Slot, Stack } from "expo-router";
import { Appbar, Surface, Avatar, IconButton } from "react-native-paper";
import Sidebar from "@/components/dashboard/Sidebar";
import { router } from "expo-router";
import { jwtDecode, JwtPayload } from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWebSockets } from "@/hooks/useWebSockets";
import { useDispatch, useSelector } from "react-redux";
import { setRestaurant } from "@/lib/reduxStore/authSlice";
import Logo from "@/assets/icons/Logo.svg";

const COLLAPSED_WIDTH = 60;
const EXPANDED_WIDTH = 200;
const MOBILE_THRESHOLD = 768; // Example breakpoint for mobile/tablet

export default function ProtectedLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth.restaurant);
  const { width } = useWindowDimensions();
  const isMobile = width < MOBILE_THRESHOLD;

  useWebSockets();

  async function checkAuth() {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    if (!refreshToken) {
      router.replace("/(auth)");
    } else {
      const decodedToken = jwtDecode<JwtPayload>(refreshToken);
      if (Date.now() >= Number(decodedToken.exp) * 1000) {
        await AsyncStorage.removeItem("refreshToken");
        await AsyncStorage.removeItem("accessToken");
        router.replace("/(auth)");
        return;
      }

      const decodedPayload = jwtDecode<
        {
          tenant: string;
          user_type: string;
          email: string;
          branch?: string;
        } & JwtPayload
      >(refreshToken);

      dispatch(
        setRestaurant({
          id: decodedPayload.tenant,
          user_type: decodedPayload.user_type,
          email: decodedPayload.email,
          branch: decodedPayload.branch,
        })
      );
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Surface style={styles.container}>
      {/* Sidebar */}
      <View
        style={{
          paddingHorizontal: 30,
          borderBottomColor: "#5A6E4933",
          borderBottomWidth: 1.5,
        }}
      >
        <Logo height={60} color={"#91B275"} />
      </View>
      <View style={styles.horizontal}>
        <Sidebar
        // isCollapsed={isSidebarCollapsed}
        // onCollapseToggle={toggleSidebar}
        />

        {/* Main Content */}
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Slot />
          </Stack>
        </ScrollView>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#EFF4EB",
    height: "100%",
    width: "100%",
  },
  horizontal: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#EFF4EB",
  },
  content: {
    flex: 1,
    backgroundColor: "white",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginLeft: 10,
  },
  avatar: {
    marginRight: 5,
  },
  profileName: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
