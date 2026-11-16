import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST only, so a third-party page can't log users out via a plain link or image. */
export function POST(req: Request) {
  return handle(async () => {
    const res = NextResponse.json({ success: true });
    await destroySession(req, res);
    return res;
  });
}
