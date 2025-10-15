import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  API_KEY,
} from '@/utils/constants';

export async function POST(request: Request) {
  const body = await request.formData();
  const code = body.get('code') as string;
  if (!code) {
    return Response.json(
      { error: 'Missing authorization code' },
      { status: 400 }
    );
  }
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
      code: code,
    }),
  });

  const data = await response.json();
  console.log(data.id_token);
  if (!data.id_token) {
    return Response.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  }
  const resp = await fetch(
    `${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/social/google/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
      },
      body: JSON.stringify({
        id_token: data.id_token,
      }),
    }
  );

  const respData = await resp.json();

  // Create access token (short-lived)
  const accessToken = respData.access_token;

  // Create refresh token (long-lived)
  const refreshToken = respData.refresh_token;

  if (data.error) {
    return Response.json(
      {
        error: data.error,
        error_description: data.error_description,
        message:
          "OAuth validation error - please ensure the app complies with Google's OAuth 2.0 policy",
      },
      {
        status: 400,
      }
    );
  }

  // For native platforms, return both tokens in the response body
  return Response.json({
    accessToken,
    refreshToken,
  });
}
