import { NextResponse } from "next/server";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import {
  ApiError,
  handle,
  notFound,
  parseId,
  pick,
  readBody,
  type IdContext,
} from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const FIELDS = ["weekStart", "goals", "memo", "retrospective", "goalId"] as const;

export function GET(req: Request, { params }: IdContext) {
  return handle(async () => {
    await requireUser(req);
    const plan = await WeeklyPlan.findById(parseId(params.id));
    return plan ? NextResponse.json(plan) : notFound();
  });
}

export function PUT(req: Request, { params }: IdContext) {
  return handle(async () => {
    await requireUser(req);
    const id = parseId(params.id);
    const body = await readBody(req);
    const plan = await WeeklyPlan.findByIdAndUpdate(
      id,
      { $set: pick(body, FIELDS) },
      { returnDocument: "after", runValidators: true }
    );
    return plan ? NextResponse.json(plan) : notFound();
  });
}

export function DELETE(req: Request, { params }: IdContext) {
  return handle(async () => {
    await requireUser(req);
    const plan = await WeeklyPlan.findByIdAndDelete(parseId(params.id));
    return plan ? NextResponse.json({ success: true }) : notFound();
  });
}

/** Toggle goals[index].done via body { index, done }. */
export function PATCH(req: Request, { params }: IdContext) {
  return handle(async () => {
    await requireUser(req);
    const id = parseId(params.id);
    const { index, done } = await readBody(req);
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
      throw new ApiError(400, "index must be a non-negative integer");
    }
    if (typeof done !== "boolean") {
      throw new ApiError(400, "done must be a boolean");
    }
    const plan = await WeeklyPlan.findById(id);
    if (!plan) return notFound();
    if (index >= plan.goals.length) {
      throw new ApiError(400, "index out of range");
    }
    plan.goals[index].done = done;
    await plan.save();
    return NextResponse.json(plan);
  });
}
