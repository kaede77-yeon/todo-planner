import { NextResponse } from "next/server";
import { Todo, TODO_FIELDS } from "@/models/Todo";
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

// Every query is scoped to the session user. Someone else's todo is
// indistinguishable from a missing one (404), so ids can't be probed.
async function update(req: Request, rawId: string) {
  const user = await requireUser(req);
  const id = parseId(rawId);
  const body = await readBody(req);
  const todo = await Todo.findOneAndUpdate(
    { _id: id, userId: user.id },
    { $set: pick(body, TODO_FIELDS) },
    { returnDocument: "after", runValidators: true }
  );
  return todo ? NextResponse.json(todo) : notFound();
}

export function GET(req: Request, { params }: IdContext) {
  return handle(async () => {
    const user = await requireUser(req);
    const todo = await Todo.findOne({ _id: parseId(params.id), userId: user.id });
    return todo ? NextResponse.json(todo) : notFound();
  });
}

export function PUT(req: Request, { params }: IdContext) {
  return handle(() => update(req, params.id));
}

export function PATCH(req: Request, { params }: IdContext) {
  return handle(() => update(req, params.id));
}

export function DELETE(req: Request, { params }: IdContext) {
  return handle(async () => {
    const user = await requireUser(req);
    const todo = await Todo.findOneAndDelete({
      _id: parseId(params.id),
      userId: user.id,
    });
    return todo ? NextResponse.json({ success: true }) : notFound();
  });
}
