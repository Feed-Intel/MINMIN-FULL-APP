import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ChangePassword,
  ConfirmOTP,
  FacebookOAuthLogin,
  GetUser,
  GoogleOAuthLogin,
  Login,
  ResetPassword,
  SignUp,
  UpdateProfile,
  VerifyOTP,
} from '../api/authApi';

export const useLogin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ['login'],
    mutationFn: Login,
    onSuccess: onSuccess,
    onError: onError,
  });

export const useSignUp = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ['signUp'],
    mutationFn: SignUp,
    onSuccess: onSuccess,
    onError: onError,
  });

export const useGoogleLogin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ['google-login'],
    mutationFn: GoogleOAuthLogin,
    onSuccess: onSuccess,
    onError: onError,
  });

export const useFacebookLogin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ['facebook-login'],
    mutationFn: FacebookOAuthLogin,
    onSuccess: onSuccess,
    onError: onError,
  });

export const useConfirmOTP = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ['confirmOTP'],
    mutationFn: ConfirmOTP,
    onSuccess: onSuccess,
    onError: onError,
  });

export const useVerifyOTP = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ['verifyOTP'],
    mutationFn: VerifyOTP,
    onSuccess: onSuccess,
    onError: onError,
  });
export const useUpdateProfile = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ['updateProfile'],
    mutationFn: UpdateProfile,
    onSuccess: onSuccess,
    onError: onError,
  });
export const useResetPassword = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ['resetPassword'],
    mutationFn: ResetPassword,
    onSuccess: onSuccess,
    onError: onError,
  });

export const useUpdatePassword = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ['changePassword'],
    mutationFn: ChangePassword,
    onSuccess,
    onError,
  });

export const useGetUser = (id?: string) =>
  useQuery({
    queryKey: ['getUser', id],
    queryFn: () => GetUser(id),
    refetchInterval: 30000,
    enabled: !!id,
  });
