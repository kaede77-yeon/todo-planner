import { NextResponse } from "next/server";
import { ApiError, handle } from "@/lib/api";
import {
  STATE_COOKIE,
  clearStateCookie,
  createSession,
  readCookie,
} from "@/lib/auth";
import { exchangeCode, fetchProfile } from "@/lib/github";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const expected = readCookie(req, STATE_COOKIE);

    // CSRF guard: the state we issued must come back unchanged.
    if (!code || !state || !expected || state !== expected) {
      throw new ApiError(400, "Invalid OAuth state or missing code");
    }

    const token = await exchangeCode(code, `${url.origin}/auth/github/callback`);
    const profile = await fetchProfile(token);

    const user = await User.findOneAndUpdate(
      { githubId: profile.id },
      { $set: { username: profile.login, avatarUrl: profile.avatar_url } },
      { upsert: true, returnDocument: "after", runValidators: true }
    );

    const res = NextResponse.redirect(new URL("/", url.origin));
    clearStateCookie(res);
    await createSession(res, user.id);
    return res;
  });
}
