import axios from "axios";
import { tokenStorage } from "@/utils/cache";
import { logoutUser } from "@/utils/logoutUser";
import { COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/utils/constants";

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || "";
const AUTH_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/auth`;

let isRefreshing = false;
let subscribers: ((newAccessToken: string) => void)[] = [];

const onTokenRefreshed = (newAccessToken: string) => {
  subscribers.forEach((callback) => callback(newAccessToken));
  subscribers = [];
};

const addSubscriber = (callback: (newAccessToken: string) => void) => {
  subscribers.push(callback);
};

export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY,
  },
});

// Attach access token to every request
apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = await tokenStorage?.getItem(COOKIE_NAME);
    if (accessToken) {
      if (
        !config?.url?.includes("auth") ||
        config?.url?.includes("auth/user")
      ) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      config.headers["X-API-KEY"] = API_KEY;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized errors (refresh token logic)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      (!originalRequest.url.includes("auth") ||
        originalRequest.url.includes("auth/user"))
    ) {
      if (isRefreshing) {
        // Queue the request until the token is refreshed
        return new Promise((resolve) => {
          addSubscriber((newAccessToken) => {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getItem(REFRESH_COOKIE_NAME);
        if (!refreshToken) {
          throw new Error("Refresh token missing");
        }

        const { data } = await axios.post(
          `${AUTH_URL}/token/refresh/`,
          { refresh: refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": API_KEY,
            },
          }
        );

        const { access: newAccessToken } = data;
        // Save the new access token and user_id
        await tokenStorage.setItem(COOKIE_NAME, newAccessToken);

        isRefreshing = false;
        onTokenRefreshed(newAccessToken);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        subscribers = [];
        //("Error", "Removed Refresh Token");
        logoutUser();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
