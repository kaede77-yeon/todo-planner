import { NextResponse } from "next/server";
import { Goal } from "@/models/Goal";
import { handle, pick, readBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    await requireUser(req);
    return NextResponse.json(await Goal.find().sort({ createdAt: 1 }));
  });
}

export function POST(req: Request) {
  return handle(async () => {
    await requireUser(req);
    const body = await readBody(req);
    const goal = await Goal.create(
      pick(body, ["title", "description", "progress"])
    );
    return NextResponse.json(goal, { status: 201 });
  });
}
