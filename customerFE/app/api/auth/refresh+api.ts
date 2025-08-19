import { REFRESH_COOKIE_NAME } from "@/utils/constants";
import { API_KEY } from "@/utils/constants";
/**
 * Refresh API endpoint
 *
 * This endpoint refreshes the user's authentication token using a refresh token.
 * It implements token rotation - each refresh generates a new refresh token.
 * For web clients, it refreshes the cookies.
 * For native clients, it returns new tokens.
 */
export async function POST(request: Request) {
  // Determine the platform (web or native)
  let platform = "native";
  let refreshToken: string | null = null;

  // Check content type to determine how to parse the body
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    // Handle JSON body
    try {
      const jsonBody = await request.json();
      platform = jsonBody.platform || "native";

      // For native clients, get refresh token from request body
      if (platform === "native" && jsonBody.refreshToken) {
        refreshToken = jsonBody.refreshToken;
      }
    } catch (e) {
      //("Failed to parse JSON body, using default platform");
    }
  } else if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    // Handle form data
    try {
      const formData =
        (await request.formData()) as unknown as globalThis.FormData;
      const platformValue = formData.get("platform");
      platform = (platformValue as string) || "native";

      // For native clients, get refresh token from form data
      if (platform === "native" && formData.get("refreshToken")) {
        refreshToken = formData.get("refreshToken") as string;
      }
    } catch (e) {
      //("Failed to parse form data, using default platform");
    }
  } else {
    // For other content types or no content type, check URL parameters
    try {
      const url = new URL(request.url);
      platform = url.searchParams.get("platform") || "native";
    } catch (e) {
      //("Failed to parse URL parameters, using default platform");
    }
  }

  // For web clients, get refresh token from cookies
  if (platform === "web") {
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      // Parse cookies
      const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split("=");
        acc[key.trim()] = value;
        return acc;
      }, {} as Record<string, string>);

      // Get refresh token from cookie
      refreshToken = cookies[REFRESH_COOKIE_NAME];
    }
  }
  if (refreshToken) {
    const AUTH_URL = `${process.env.EXPO_PUBLIC_BACKEND_URL}/auth`;
    const resp = await fetch(`${AUTH_URL}/token/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    const respData = await resp.json();
    const { access: newAccessToken } = respData;

    // For native platforms
    return Response.json({
      accessToken: newAccessToken,
    });
  }

  return Response.json(
    { error: "Authentication required - no refresh token" },
    { status: 401 }
  );
}
