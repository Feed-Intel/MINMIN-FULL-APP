/**
 * Application Constants
 *
 * This file centralizes all constants used across the application.
 * Import from this file instead of defining constants in individual files.
 */

// Authentication Constants
export const COOKIE_NAME = "auth_token";
export const REFRESH_COOKIE_NAME = "refresh_token";
export const COOKIE_MAX_AGE = 20; // 20 seconds
export const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN!;
export const JWT_EXPIRATION_TIME = "20s"; // 20 seconds
export const REFRESH_TOKEN_EXPIRY = "30d"; // 30 days
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY!;

// Refresh Token Constants
export const REFRESH_BEFORE_EXPIRY_SEC = 60; // Refresh token 1 minute before expiry

// Google OAuth Constants
export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
export const GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/callback`;
export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

// Apple OAuth Constants
export const APPLE_CLIENT_ID = "com.beto.expoauthexample.web";
export const APPLE_CLIENT_SECRET = process.env.APPLE_CLIENT_SECRET!;
export const APPLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/apple/callback`;
export const APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize";

// Facebook OAuth Constants
export const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID!;
export const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET!;
export const FACEBOOK_REDIRECT_URI = `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/facebook/callback`;
export const FACEBOOK_AUTH_URL = "https://www.facebook.com/v11.0/dialog/oauth";

// Environment Constants
export const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
export const APP_SCHEME = process.env.EXPO_PUBLIC_SCHEME;
export const JWT_SECRET = process.env.JWT_SECRET!;

// Cookie Settings
export const COOKIE_OPTIONS = {
  httpOnly: true,
  domain: DOMAIN,
  secure: true,
  sameSite: "None" as const,
  path: "/",
};

export const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  domain: DOMAIN,
  sameSite: "None" as const,
  path: "/", // Restrict to refresh endpoint only
  maxAge: REFRESH_TOKEN_MAX_AGE,
};
