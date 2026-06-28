const SLACK_OAUTH_BASE = "https://slack.com/oauth/v2/authorize";
const SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";

export const SLACK_SCOPES = [
  "commands",
  "chat:write",
  "chat:write.public",
  "channels:read",
  "users:read",
].join(",");

export interface SlackOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function getSlackOAuthUrl(state: string, config?: Partial<SlackOAuthConfig>): string {
  const clientId = config?.clientId ?? process.env.SLACK_CLIENT_ID;
  const redirectUri = config?.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/oauth/callback`;

  if (!clientId) {
    throw new Error("Missing SLACK_CLIENT_ID");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    scope: SLACK_SCOPES,
    redirect_uri: redirectUri,
    state,
  });

  return `${SLACK_OAUTH_BASE}?${params.toString()}`;
}

export interface SlackOAuthResponse {
  ok: boolean;
  access_token?: string;
  team?: { id: string; name: string };
  bot_user_id?: string;
  error?: string;
}

export async function exchangeSlackCode(
  code: string,
  config?: Partial<SlackOAuthConfig>,
): Promise<SlackOAuthResponse> {
  const clientId = config?.clientId ?? process.env.SLACK_CLIENT_ID;
  const clientSecret = config?.clientSecret ?? process.env.SLACK_CLIENT_SECRET;
  const redirectUri = config?.redirectUri ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/slack/oauth/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET");
  }

  const response = await fetch(SLACK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  return response.json() as Promise<SlackOAuthResponse>;
}
