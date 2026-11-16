import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { User } from "@/models/User";

export interface TestUser {
  id: string;
  /** Value for a request's Cookie header. */
  cookie: string;
}

/** Creates a user plus a real server-side session, exactly as the OAuth callback does. */
export async function seedUser(username: string, githubId: number): Promise<TestUser> {
  const user = await User.create({
    githubId,
    username,
    avatarUrl: `https://avatars.example/${username}.png`,
  });
  const res = NextResponse.json({});
  await createSession(res, user.id);
  const token = res.cookies.get(SESSION_COOKIE)?.value;
  if (!token) throw new Error("session cookie was not set");
  return { id: user.id, cookie: `${SESSION_COOKIE}=${token}` };
}
