import { NextResponse } from "next/server";
import { Todo, TODO_FIELDS } from "@/models/Todo";
import { ApiError, handle, parseId, pick, readBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const sp = new URL(req.url).searchParams;
    const filter: Record<string, string> = { userId: user.id };
    const status = sp.get("status");
    if (status) {
      if (!["todo", "doing", "done"].includes(status)) {
        throw new ApiError(400, "Invalid status");
      }
      filter.status = status;
    }
    for (const key of ["weeklyPlanId", "goalId"]) {
      const v = sp.get(key);
      if (v) filter[key] = parseId(v);
    }
    return NextResponse.json(
      await Todo.find(filter).sort({ status: 1, order: 1 })
    );
  });
}

export function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser(req);
    const body = await readBody(req);
    const todo = await Todo.create({ ...pick(body, TODO_FIELDS), userId: user.id });
    return NextResponse.json(todo, { status: 201 });
  });
}
