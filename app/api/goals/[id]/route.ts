import { NextResponse } from "next/server";
import { Goal } from "@/models/Goal";
import { Todo } from "@/models/Todo";
import { WeeklyPlan } from "@/models/WeeklyPlan";
import {
  handle,
  notFound,
  parseId,
  pick,
  readBody,
  type IdContext,
} from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(req: Request, { params }: IdContext) {
  return handle(async () => {
    await requireUser(req);
    const goal = await Goal.findById(parseId(params.id));
    return goal ? NextResponse.json(goal) : notFound();
  });
}

export function PUT(req: Request, { params }: IdContext) {
  return handle(async () => {
    await requireUser(req);
    const id = parseId(params.id);
    const body = await readBody(req);
    const goal = await Goal.findByIdAndUpdate(
      id,
      { $set: pick(body, ["title", "description", "progress"]) },
      { returnDocument: "after", runValidators: true }
    );
    return goal ? NextResponse.json(goal) : notFound();
  });
}

export function DELETE(req: Request, { params }: IdContext) {
  return handle(async () => {
    const user = await requireUser(req);
    const id = parseId(params.id);
    const goal = await Goal.findByIdAndDelete(id);
    if (!goal) return notFound();
    await Promise.all([
      // Only the caller's todos are touched; other users' todos are never modified.
      Todo.updateMany({ goalId: id, userId: user.id }, { $unset: { goalId: 1 } }),
      WeeklyPlan.updateMany({ goalId: id }, { $unset: { goalId: 1 } }),
    ]);
    return NextResponse.json({ success: true });
  });
}
