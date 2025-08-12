import { useMutation } from "@tanstack/react-query";
import {
  ChangePassword,
  ConfirmOTP,
  Login,
  ResetPassword,
} from "../api/authApi";

export const useLogin = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ["login"],
    mutationFn: Login,
    onSuccess: onSuccess,
    onError: onError,
  });

export const useConfirmOTP = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ["confirmOTP"],
    mutationFn: ConfirmOTP,
    onSuccess: onSuccess,
    onError: onError,
  });

export const useResetPassword = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ["resetPassword"],
    mutationFn: ResetPassword,
    onSuccess: onSuccess,
    onError: onError,
  });

export const useUpdatePassword = (
  onSuccess?: (data: any) => void,
  onError?: (error: any) => void
) =>
  useMutation({
    mutationKey: ["changePassword"],
    mutationFn: ChangePassword,
    onSuccess: async (data) => {
      console.log("Password changed successfully", data);
    },
  });
