import { NextResponse, type NextRequest } from "next/server";

// Edge runtime can't reach MongoDB, so this is only a cheap first gate on the
// presence of the session cookie. Every /api handler (todos, goals, weekly)
// verifies the session server-side via lib/auth.ts requireUser, so a forged
// cookie gets a 401 there.
const SESSION_COOKIE = "sid";

export function middleware(req: NextRequest) {
  if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  // Public: the login page, the /auth/* OAuth + session routes, and Next assets.
  matcher: ["/((?!login$|auth/|_next/|favicon\\.ico$).*)"],
};
