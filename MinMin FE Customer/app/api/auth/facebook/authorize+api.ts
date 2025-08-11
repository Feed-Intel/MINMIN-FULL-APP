import {
  FACEBOOK_CLIENT_ID,
  BASE_URL,
  APP_SCHEME,
  FACEBOOK_AUTH_URL,
} from "@/utils/constants";

export async function GET(request: Request) {
  if (!FACEBOOK_CLIENT_ID) {
    return Response.json(
      { error: "Missing FACEBOOK_CLIENT_ID environment variable" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const internalClient = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const incomingState = url.searchParams.get("state");

  let platform: string;

  if (redirectUri === APP_SCHEME) {
    platform = "mobile";
  } else if (redirectUri === BASE_URL) {
    platform = "web";
  } else {
    return Response.json({ error: "Invalid redirect_uri" }, { status: 400 });
  }

  // Construct state parameter to maintain state between request and callback
  const state = `${platform}|${incomingState}`;

  if (internalClient !== "facebook") {
    return Response.json({ error: "Invalid client" }, { status: 400 });
  }

  const scope = url.searchParams.get("scope") || "email,public_profile";

  const params = new URLSearchParams({
    client_id: FACEBOOK_CLIENT_ID,
    redirect_uri: BASE_URL + "/api/auth/facebook/callback",
    response_type: "code",
    scope: scope,
    state: state,
  });

  return Response.redirect(`${FACEBOOK_AUTH_URL}?${params.toString()}`);
}
