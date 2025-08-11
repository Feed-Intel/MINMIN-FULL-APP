import { BASE_URL, APP_SCHEME } from "@/utils/constants";

export async function GET(request: Request) {
  // Parse the incoming URL parameters
  const incomingParams = new URLSearchParams(request.url.split("?")[1]);
  const combinedPlatformAndState = incomingParams.get("state");
  if (!combinedPlatformAndState) {
    return new Response(JSON.stringify({ error: "Invalid state" }), {
      status: 400,
    });
  }

  // Split the 'state' parameter into platform and state
  const [platform, state] = combinedPlatformAndState.split("|");

  if (!platform || !state) {
    return new Response(JSON.stringify({ error: "Invalid state format" }), {
      status: 400,
    });
  }

  // Get the 'code' parameter
  const code = incomingParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "Missing code parameter" }), {
      status: 400,
    });
  }

  // Prepare the outgoing parameters
  const outgoingParams = new URLSearchParams({
    code: code,
    state: state,
  });

  // Determine the redirect URI based on the platform
  const redirectURI = platform === "web" ? BASE_URL : APP_SCHEME;

  // Perform the redirect
  return Response.redirect(`${redirectURI}?${outgoingParams.toString()}`, 302);
}
