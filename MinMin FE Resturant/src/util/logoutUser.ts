import { router } from "expo-router"; // if you're using Expo Router

export async function logoutUser() {
  router.replace("/(auth)");
}
