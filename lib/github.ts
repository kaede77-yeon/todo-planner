import { ApiError } from "@/lib/api";

export interface GitHubProfile {
  id: number;
  login: string;
  avatar_url: string;
}

/** Reads OAuth credentials from the environment only; nothing is hardcoded. */
export function githubCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ApiError(
      500,
      "GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (see docs/AUTH_SETUP.md)."
    );
  }
  return { clientId, clientSecret };
}

export function authorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("scope", "read:user");
  return url.toString();
}

/** Exchanges the authorization code for an access token. */
export async function exchangeCode(code: string, redirectUri: string): Promise<string> {
  const { clientId, clientSecret } = githubCredentials();
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = (await res.json().catch(() => null)) as {
    access_token?: unknown;
  } | null;
  if (!res.ok || typeof data?.access_token !== "string") {
    throw new ApiError(502, "GitHub token exchange failed");
  }
  return data.access_token;
}

export async function fetchProfile(accessToken: string): Promise<GitHubProfile> {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/vnd.github+json",
      "user-agent": "todo-planner",
    },
  });
  const data = (await res.json().catch(() => null)) as Partial<GitHubProfile> | null;
  if (
    !res.ok ||
    typeof data?.id !== "number" ||
    typeof data.login !== "string"
  ) {
    throw new ApiError(502, "Failed to fetch GitHub profile");
  }
  return {
    id: data.id,
    login: data.login,
    avatar_url: typeof data.avatar_url === "string" ? data.avatar_url : "",
  };
}
