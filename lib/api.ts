import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export interface IdContext {
  params: { id: string };
}

export function parseId(id: string): string {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ApiError(400, "Invalid id");
  }
  return id;
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ApiError(400, "Body must be a JSON object");
  }
  return body as Record<string, unknown>;
}

/** Copy only whitelisted keys that are present in the body. */
export function pick(
  body: Record<string, unknown>,
  keys: readonly string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    if (k in body) out[k] = body[k];
  }
  return out;
}

export function notFound(): never {
  throw new ApiError(404, "Not found");
}

function isDuplicateKey(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: unknown }).code === 11000
  );
}

/** Connects to the DB, runs the handler and maps errors to JSON responses. */
export async function handle(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await connectDB();
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (isDuplicateKey(err)) {
      return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
    }
    if (
      err instanceof mongoose.Error.ValidationError ||
      err instanceof mongoose.Error.CastError
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
