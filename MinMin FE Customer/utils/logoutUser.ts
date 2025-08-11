import { router } from "expo-router"; // if you're using Expo Router
import { tokenStorage } from "@/utils/cache";

export async function logoutUser() {
  await tokenStorage.removeItem("accessToken");
  await tokenStorage.removeItem("refreshToken");
  router.replace("/(auth)");
}
