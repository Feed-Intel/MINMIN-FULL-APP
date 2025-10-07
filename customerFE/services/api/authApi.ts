import { Login as LoginType } from '@/types/authType';
import { apiClient } from '@/config/axiosConfig';
import { asyncHandler } from '@/utils/asyncHandler';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';

export const Login = asyncHandler(async (data: LoginType) => {
  const resp = await apiClient.post('/auth/login/', data, {
    baseURL: BACKEND_URL,
  });
  return resp.data;
});

export const SignUp = asyncHandler(async (data: LoginType) => {
  const resp = await apiClient.post('/auth/register/', data, {
    baseURL: BACKEND_URL,
  });
  return resp.data;
});

export const ResetPassword = asyncHandler(async (data: { email?: string }) => {
  const resp = await apiClient.post('/auth/password-reset/request/', data, {
    baseURL: BACKEND_URL,
  });
  return resp.data;
});

export const ConfirmOTP = asyncHandler(
  async (data: { email?: string; otp: string }) => {
    const resp = await apiClient.post('/auth/check-otp/', data, {
      baseURL: BACKEND_URL,
    });
    return resp.data;
  }
);

export const VerifyOTP = asyncHandler(
  async (data: { email?: string; otp: string }) => {
    const resp = await apiClient.post('/auth/verify-otp/', data, {
      baseURL: BACKEND_URL,
    });
    return resp.data;
  }
);

export const UpdateProfile = asyncHandler(async (data: FormData) => {
  const resp = await apiClient.put(`/auth/user/${data.get('id')}/`, data, {
    baseURL: BACKEND_URL,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return resp.data;
});

export const ChangePassword = asyncHandler(
  async (data: {
    email?: string;
    otp?: string | null;
    new_password?: string;
  }) => {
    const resp = await apiClient.post('/auth/password-reset/verify/', data, {
      baseURL: BACKEND_URL,
    });
    return resp.data;
  }
);

export const GoogleOAuthLogin = asyncHandler(async (id_token: string) => {
  const resp = await apiClient.post(
    '/auth/social/google/',
    { id_token },
    {
      baseURL: BACKEND_URL,
    }
  );
  return resp.data;
});

export const FacebookOAuthLogin = asyncHandler(async (access_token: string) => {
  const resp = await apiClient.post(
    '/auth/social/facebook/',
    { access_token },
    {
      baseURL: BACKEND_URL,
    }
  );
  return resp.data;
});

export const GetUser = asyncHandler(async (id?: string) => {
  if (!Boolean(id)) {
    return null;
  }
  const resp = await apiClient.get(`/auth/user/${id}/`, {
    baseURL: BACKEND_URL,
  });
  return resp.data;
});
