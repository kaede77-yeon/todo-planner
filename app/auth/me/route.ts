import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => NextResponse.json(await requireUser(req)));
}
