import { NextResponse } from "next/server";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import { ApiError, handle, pick, readBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    await requireUser(req);
    const weekStart = new URL(req.url).searchParams.get("weekStart");
    const filter: { weekStart?: Date } = {};
    if (weekStart) {
      const d = new Date(weekStart);
      if (Number.isNaN(d.getTime())) throw new ApiError(400, "Invalid weekStart");
      filter.weekStart = d;
    }
    return NextResponse.json(
      await WeeklyPlan.find(filter).sort({ weekStart: -1 })
    );
  });
}

export function POST(req: Request) {
  return handle(async () => {
    await requireUser(req);
    const body = await readBody(req);
    await WeeklyPlan.init();
    const plan = await WeeklyPlan.create(
      pick(body, ["weekStart", "goals", "memo", "retrospective", "goalId"])
    );
    return NextResponse.json(plan, { status: 201 });
  });
}
