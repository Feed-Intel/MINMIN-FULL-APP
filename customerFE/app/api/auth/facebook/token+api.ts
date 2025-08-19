import {
  API_KEY,
  FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET,
  FACEBOOK_REDIRECT_URI,
} from "@/utils/constants";

export async function POST(request: Request) {
  const body = await request.formData();
  const code = body.get("code") as string;

  if (!code) {
    return Response.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  // Step 1: Exchange code for Facebook access token
  const fbResponse = await fetch(
    "https://graph.facebook.com/v22.0/oauth/access_token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: FACEBOOK_CLIENT_ID,
        client_secret: FACEBOOK_CLIENT_SECRET,
        redirect_uri: FACEBOOK_REDIRECT_URI,
        code: code,
      }),
    }
  );

  const fbData = await fbResponse.json();

  // Check for Facebook API errors first
  if (fbData.error) {
    return Response.json(
      {
        error: fbData.error,
        error_description: fbData.error_description,
        message: "Facebook OAuth error",
      },
      { status: 400 }
    );
  }

  if (!fbData.access_token) {
    return Response.json(
      { error: "Failed to obtain Facebook access token" },
      { status: 400 }
    );
  }

  // Step 2: Exchange Facebook token for your own backend tokens
  const resp = await fetch(
    `${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/social/facebook/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
      },
      body: JSON.stringify({
        // Send the Facebook access_token, not an id_token
        access_token: fbData.access_token,
      }),
    }
  );

  // Handle your backend response
  if (!resp.ok) {
    return Response.json(
      { error: "Failed to authenticate with backend" },
      { status: 400 }
    );
  }

  const respData = await resp.json();

  if (!respData.access_token || !respData.refresh_token) {
    return Response.json(
      { error: "Invalid tokens from backend" },
      { status: 400 }
    );
  }

  const accessToken = respData.access_token;
  const refreshToken = respData.refresh_token;

  // For native platforms, return both tokens in the response body
  return Response.json({
    accessToken,
    refreshToken,
  });
}
