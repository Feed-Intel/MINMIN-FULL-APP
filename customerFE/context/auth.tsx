import * as WebBrowser from 'expo-web-browser';
import * as React from 'react';
// import * as AppleAuthentication from "expo-apple-authentication";
import { tokenStorage } from '@/utils/cache';
import {
  APP_SCHEME,
  BASE_URL,
  COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@/utils/constants';
import { AuthUser } from '@/utils/middleware';
import {
  AuthError,
  AuthRequestConfig,
  DiscoveryDocument,
  makeRedirectUri,
  useAuthRequest,
} from 'expo-auth-session';
import { router } from 'expo-router';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { Login as ApiLogin } from '@/services/api/authApi';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = React.createContext({
  user: null as AuthUser | null,
  signInWithEmail: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => {},
  signOut: () => {},
  signInWithGoogle: () => {},
  signInWithFacebook: () => {},
  fetchWithAuth: (url: string, options: RequestInit) =>
    Promise.resolve(new Response()),
  setUser: (user: AuthUser) => {},
  handleNativeTokens: (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => {},
  isLoading: false,
  error: null as AuthError | null,
});

const config: AuthRequestConfig = {
  clientId: 'google',
  scopes: ['openid', 'profile', 'email'],
  redirectUri: makeRedirectUri({ scheme: 'minmincustomer' }),
};

const facebookConfig: AuthRequestConfig = {
  clientId: 'facebook',
  scopes: ['email', 'public_profile'],
  redirectUri: makeRedirectUri({ scheme: 'minmincustomer' }),
  responseType: 'token',
};

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${BASE_URL}/api/auth/authorize`,
  tokenEndpoint: `${BASE_URL}/api/auth/token`,
};

const facebookDiscovery: DiscoveryDocument = {
  authorizationEndpoint: `${BASE_URL}/api/auth/facebook/authorize`,
  tokenEndpoint: `${BASE_URL}/api/auth/facebook/token`,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState<string | null>(null);
  const [request, response, promptAsync] = useAuthRequest(config, discovery);
  const [facebookRequest, facebookResponse, promptFacebookAsync] =
    useAuthRequest(facebookConfig, facebookDiscovery);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<AuthError | null>(null);
  const isWeb = Platform.OS === 'web';
  const refreshInProgressRef = React.useRef(false);

  React.useEffect(() => {
    handleResponse();
  }, [response]);

  React.useEffect(() => {
    handleFacebookResponse();
  }, [facebookResponse]);

  // Check if user is authenticated
  React.useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const storedAccessToken = await tokenStorage?.getItem(COOKIE_NAME);
        const storedRefreshToken = await tokenStorage?.getItem(
          REFRESH_COOKIE_NAME
        );

        if (storedAccessToken) {
          try {
            // Check if the access token is still valid
            const decoded = jwtDecode<{ exp: number; user_id: string }>(
              storedAccessToken
            );
            const exp = decoded.exp;
            const now = Math.floor(Date.now() / 1000);

            if (exp && exp > now) {
              // Access token is still valid
              setAccessToken(storedAccessToken);

              if (storedRefreshToken) {
                setRefreshToken(storedRefreshToken);
              }
              setUser({ id: decoded.user_id });
              router.replace('/(protected)/feed');
            } else if (storedRefreshToken) {
              // Access token expired, but we have a refresh token
              setRefreshToken(storedRefreshToken);
              await refreshAccessToken(storedRefreshToken);
            }
          } catch (e) {
            console.error('Errsor decoding stored token:', e);

            // Try to refresh using the refresh token
            if (storedRefreshToken) {
              //("Error with access token, trying refresh token");
              setRefreshToken(storedRefreshToken);
              await refreshAccessToken(storedRefreshToken);
            }
          }
        } else if (storedRefreshToken) {
          // No access token, but we have a refresh token
          //("No access token, using refresh token");
          setRefreshToken(storedRefreshToken);
          await refreshAccessToken(storedRefreshToken);
        } else {
          //("User is not authenticated");
          router.replace('/(auth)');
        }
      } catch (error) {
        console.error('Error restoring session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [isWeb]);

  // Function to refresh the access token
  const refreshAccessToken = async (tokenToUse?: string) => {
    // Prevent multiple simultaneous refresh attempts
    if (refreshInProgressRef.current) {
      //("Token refresh already in progress, skipping");
      return null;
    }

    refreshInProgressRef.current = true;

    try {
      //("Refreshing access token...");

      // Use the provided token or fall back to the state
      const currentRefreshToken = tokenToUse || refreshToken;

      // For native: Use the refresh token
      if (!currentRefreshToken) {
        console.error('No refresh token available');
        signOut();
        return null;
      }

      //("Using refresh token to get new tokens");
      const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'native',
          refreshToken: currentRefreshToken,
        }),
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        console.error('Token refresh failed:', errorData);

        // If refresh fails due to expired token, sign out
        if (refreshResponse.status === 401) {
          signOut();
        }
        return null;
      }

      // For native: Update both tokens
      const tokens = await refreshResponse.json();
      const newAccessToken = tokens.accessToken;

      if (newAccessToken) setAccessToken(newAccessToken);

      // Save both tokens to cache
      if (newAccessToken)
        await tokenStorage?.setItem(COOKIE_NAME, newAccessToken);

      // Update user data from the new access token
      if (newAccessToken) {
        const decoded = jwtDecode<{ exp: number; user_id: string }>(
          newAccessToken
        );
        //("Decoded user data:", decoded);
        // Check if we have all required user fields
        const hasRequiredFields = decoded && (decoded as any).user_id;

        if (!hasRequiredFields) {
          console.warn('Refreshed token is missing some user fields:', decoded);
        }

        setUser({ id: decoded.user_id });
      }

      return newAccessToken; // Return the new access token
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If there's an error refreshing, we should sign out
      signOut();
      return null;
    } finally {
      refreshInProgressRef.current = false;
    }
  };

  const handleNativeTokens = async (tokens: {
    accessToken: string;
    refreshToken: string;
  }) => {
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      tokens;

    // Store tokens in state
    if (newAccessToken) setAccessToken(newAccessToken);
    if (newRefreshToken) setRefreshToken(newRefreshToken);

    // Save tokens to secure storage for persistence
    if (newAccessToken)
      await tokenStorage?.setItem(COOKIE_NAME, newAccessToken);
    if (newRefreshToken)
      await tokenStorage?.setItem(REFRESH_COOKIE_NAME, newRefreshToken);

    // Decode the JWT access token to get user information
    if (newAccessToken) {
      const decoded = jwtDecode<JwtPayload>(newAccessToken);
      setUser(decoded as AuthUser);
    }
  };

  const handleFacebookResponse = async () => {
    if (facebookResponse?.type === 'success') {
      try {
        setIsLoading(true);
        // Extract the authorization code from the response
        // This code is what we'll exchange for access and refresh tokens
        const { code } = facebookResponse.params;

        // Create form data to send to our token endpoint
        // We include both the code and platform information
        // The platform info helps our server handle web vs native differently
        const formData = new FormData();
        formData.append('code', code);

        // Add platform information for the backend to handle appropriately
        if (isWeb) {
          formData.append('platform', 'web');
        }

        // Get the code verifier from the request object
        // This is the same verifier that was used to generate the code challenge
        // if (facebookResponse?.codeVerifier) {
        //   formData.append("code_verifier", facebookResponse.codeVerifier);
        // } else {
        //   console.warn("No code verifier found in request object");
        // }

        // Send the authorization code to our token endpoint
        // The server will exchange this code with Google for access and refresh tokens
        // For web: credentials are included to handle cookies
        // For native: we'll receive the tokens directly in the response
        const tokenResponse = await fetch(
          `${BASE_URL}/api/auth/facebook/token`,
          {
            method: 'POST',
            body: formData,
            credentials: isWeb ? 'include' : 'same-origin', // Include cookies for web
          }
        );
        const tokens = await tokenResponse.json();
        await handleNativeTokens(tokens);
        router.replace('/(protected)/feed');
      } catch (e) {
        Toast.show({
          type: 'error',
          text1: 'Error Handling Request',
          text2: 'An error occurred while handling the request',
        });
      } finally {
        setIsLoading(false);
      }
    } else if (response?.type === 'cancel') {
      alert('Sign in cancelled');
    } else if (response?.type === 'error') {
      setError(response?.error as AuthError);
    }
  };

  async function handleResponse() {
    // This function is called when Google redirects back to our app
    // The response contains the authorization code that we'll exchange for tokens
    if (response?.type === 'success') {
      try {
        setIsLoading(true);
        // Extract the authorization code from the response
        // This code is what we'll exchange for access and refresh tokens
        const { code } = response.params;

        // Create form data to send to our token endpoint
        // We include both the code and platform information
        // The platform info helps our server handle web vs native differently
        const formData = new FormData();
        formData.append('code', code);

        // Add platform information for the backend to handle appropriately
        if (isWeb) {
          formData.append('platform', 'web');
        }

        // Get the code verifier from the request object
        // This is the same verifier that was used to generate the code challenge
        if (request?.codeVerifier) {
          formData.append('code_verifier', request.codeVerifier);
        } else {
          console.warn('No code verifier found in request object');
        }

        // Send the authorization code to our token endpoint
        // The server will exchange this code with Google for access and refresh tokens
        // For web: credentials are included to handle cookies
        // For native: we'll receive the tokens directly in the response
        const tokenResponse = await fetch(`${BASE_URL}/api/auth/token`, {
          method: 'POST',
          body: formData,
          credentials: isWeb ? 'include' : 'same-origin', // Include cookies for web
        });

        // For native: The server returns both tokens in the response
        // We need to store these tokens securely and decode the user data
        const tokens = await tokenResponse.json();
        await handleNativeTokens(tokens);

        router.replace('/(protected)/feed');
      } catch (e) {
        Toast.show({
          type: 'error',
          text1: 'Error Handling Request',
          text2: 'An error occurred while handling the request',
        });
      } finally {
        setIsLoading(false);
      }
    } else if (response?.type === 'cancel') {
      alert('Sign in cancelled');
    } else if (response?.type === 'error') {
      setError(response?.error as AuthError);
    }
  }

  const fetchWithAuth = async (url: string, options: RequestInit) => {
    if (isWeb) {
      // For web: Include credentials to send cookies
      const response = await fetch(url, {
        ...options,
        credentials: 'include',
      });

      // If the response indicates an authentication error, try to refresh the token
      if (response.status === 401) {
        //("API request failed with 401, attempting to refresh token");

        // Try to refresh the token
        await refreshAccessToken();

        // If we still have a user after refresh, retry the request
        if (user) {
          return fetch(url, {
            ...options,
            credentials: 'include',
          });
        }
      }

      return response;
    } else {
      // For native: Use token in Authorization header
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // If the response indicates an authentication error, try to refresh the token
      if (response.status === 401) {
        //("API request failed with 401, attempting to refresh token");

        // Try to refresh the token and get the new token directly
        const newToken = await refreshAccessToken();

        // If we got a new token, retry the request with it
        if (newToken) {
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
            },
          });
        }
      }

      return response;
    }
  };

  const signInWithEmail = async (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => {
    setIsLoading(true);
    try {
      // Call backend login endpoint via axios client with proper baseURL and headers
      const data = await ApiLogin({
        email: email.trim().toLowerCase(),
        password,
        remember_me: rememberMe ? 'true' : 'false',
      } as any);

      // Backend returns access_token and refresh_token
      const accessToken = data?.access_token;
      const refreshToken = data?.refresh_token;
      if (!accessToken || !refreshToken) {
        throw new Error('Invalid response from server');
      }

      await handleNativeTokens({ accessToken, refreshToken });
      router.replace('/(protected)/feed');
    } catch (e: any) {
      const message =
        typeof e === 'string'
          ? e
          : e?.response?.data?.error || e?.response?.data?.detail || e?.message;
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: message || 'Login failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    //("signIn");
    try {
      if (!request) {
        //("No request");
        return;
      }

      await promptAsync();
    } catch (e) {
      //(e);
    }
  };

  const signInWithFacebook = async () => {
    //("signIn");
    try {
      if (!facebookRequest) {
        //("No request");
        return;
      }

      await promptFacebookAsync();
    } catch (e) {
      //(e);
    }
  };

  const signOut = async () => {
    if (isWeb) {
      // For web: Call logout endpoint to clear the cookie
      try {
        await fetch(`${BASE_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Error during web logout:', error);
      }
    }
    await tokenStorage?.removeItem(COOKIE_NAME);
    await tokenStorage?.removeItem(REFRESH_COOKIE_NAME);
    // Clear state
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signInWithGoogle,
        signInWithFacebook,
        signInWithEmail,
        signOut,
        setUser,
        handleNativeTokens,
        isLoading,
        error,
        fetchWithAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
