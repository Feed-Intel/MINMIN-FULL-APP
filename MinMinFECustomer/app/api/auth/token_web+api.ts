import { API_KEY } from "@/utils/constants";

export async function POST(request: Request) {
  const body = await request.formData();
  const email = body.get("email") as string;
  const password = body.get("password") as string;
  const resp = await fetch(
    `${process.env.EXPO_PUBLIC_BACKEND_URL}/auth/login/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
      },
      body: JSON.stringify({ email, password }),
    }
  );
  const respData = await resp.json();

  // Create access token (short-lived)
  const accessToken = respData.access_token;

  // Create refresh token (long-lived)
  const refreshToken = respData.refresh_token;

  // For native platforms, return both tokens in the response body
  return Response.json({
    accessToken,
    refreshToken,
  });
}
