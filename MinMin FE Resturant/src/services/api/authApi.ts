import { Login as LoginType } from "@/types/authType";
import { apiClient } from "@/config/axiosConfig";
import { asyncHandler } from "@/util/asyncHandler";

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:8000/api";

export const Login = asyncHandler(async (data: LoginType) => {
  const resp = await apiClient.post("/auth/login/", data, {
    baseURL: BACKEND_URL,
  });
  return resp.data;
});

export const ResetPassword = asyncHandler(async (data: { email?: string }) => {
  const resp = await apiClient.post("/auth/password-reset/request/", data, {
    baseURL: BACKEND_URL,
  });
  return resp.data;
});

export const ConfirmOTP = asyncHandler(
  async (data: { email?: string; otp: string }) => {
    const resp = await apiClient.post("/auth/check-otp/", data, {
      baseURL: BACKEND_URL,
    });
    return resp.data;
  }
);

export const ChangePassword = asyncHandler(
  async (data: {
    email?: string;
    otp?: string | null;
    new_password?: string;
  }) => {
    const resp = await apiClient.post("/auth/password-reset/verify/", data, {
      baseURL: BACKEND_URL,
    });
    return resp.data;
  }
);
