import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { newState, setStateCookie } from "@/lib/auth";
import { authorizeUrl, githubCredentials } from "@/lib/github";

export const dynamic = "force-dynamic";

/** Starts the OAuth flow: remember a random state, then send the user to GitHub. */
export function GET(req: Request) {
  return handle(async () => {
    const { clientId } = githubCredentials();
    const origin = new URL(req.url).origin;
    const state = newState();
    const res = NextResponse.redirect(
      authorizeUrl(clientId, `${origin}/auth/github/callback`, state)
    );
    setStateCookie(res, state);
    return res;
  });
}
