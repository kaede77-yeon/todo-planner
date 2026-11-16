import { createHash, randomBytes } from "node:crypto";
import type { NextResponse } from "next/server";
import { Session } from "@/models/Session";
import { User } from "@/models/User";
import { ApiError } from "@/lib/api";

export const SESSION_COOKIE = "sid";
export const STATE_COOKIE = "oauth_state";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const STATE_TTL_SECONDS = 60 * 10;

export interface AuthUser {
  id: string;
  username: string;
  avatarUrl: string;
}

const isProd = () => process.env.NODE_ENV === "production";

function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd(),
    path: "/",
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}

export function newState(): string {
  return randomBytes(16).toString("hex");
}

export function setStateCookie(res: NextResponse, state: string): void {
  res.cookies.set(STATE_COOKIE, state, { ...cookieBase(), maxAge: STATE_TTL_SECONDS });
}

export function clearStateCookie(res: NextResponse): void {
  res.cookies.set(STATE_COOKIE, "", { ...cookieBase(), maxAge: 0 });
}

/** Creates a server-side session and attaches its cookie to the response. */
export async function createSession(res: NextResponse, userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  await Session.create({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
  });
  res.cookies.set(SESSION_COOKIE, token, { ...cookieBase(), maxAge: SESSION_TTL_SECONDS });
}

/** Deletes the server-side session (if any) and expires the cookie. */
export async function destroySession(req: Request, res: NextResponse): Promise<void> {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) await Session.deleteOne({ tokenHash: hashToken(token) });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieBase(), maxAge: 0 });
}

/** Returns the logged-in user for this request, or null. Requires a DB connection. */
export async function getSessionUser(req: Request): Promise<AuthUser | null> {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const session = await Session.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  const user = await User.findById(session.userId);
  if (!user) return null;
  return { id: user.id, username: user.username, avatarUrl: user.avatarUrl };
}

/** Like getSessionUser but throws ApiError(401) when not logged in. */
export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await getSessionUser(req);
  if (!user) throw new ApiError(401, "Unauthorized");
  return user;
}
