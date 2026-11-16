import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { NextRequest } from "next/server";
import * as weeklyRoute from "@/app/api/weekly/route";
import * as weeklyIdRoute from "@/app/api/weekly/[id]/route";
import * as todosRoute from "@/app/api/todos/route";
import * as todoIdRoute from "@/app/api/todos/[id]/route";
import { connectDB } from "@/lib/mongodb";
import { useStore } from "@/store";
import { seedUser, type TestUser } from "./helpers/auth";

let mongod: MongoMemoryServer;
let me: TestUser;

function req(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "content-type": "application/json", cookie: me.cookie },
  });
}
const ctx = (id: string) => ({ params: { id } });
const json = async (res: Response) => (await res.json()) as Record<string, unknown>;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("todo-review-fixes");
  await connectDB();
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
  me = await seedUser("tester", 1);
});

describe("unlinking with null (API)", () => {
  it("PUT /api/weekly/[id] with goalId:null removes the goal link", async () => {
    const goalId = new mongoose.Types.ObjectId().toString();
    const created = await json(
      await weeklyRoute.POST(
        req("POST", "/api/weekly", {
          weekStart: "2024-01-01T00:00:00.000Z",
          goals: [],
          goalId,
        })
      )
    );
    expect(created.goalId).toBe(goalId);

    const res = await weeklyIdRoute.PUT(
      req("PUT", "/", { goalId: null }),
      ctx(created._id as string)
    );
    expect(res.status).toBe(200);
    expect((await json(res)).goalId ?? null).toBeNull();

    const again = await json(
      await weeklyIdRoute.GET(req("GET", "/"), ctx(created._id as string))
    );
    expect(again.goalId ?? null).toBeNull();
  });

  it("PATCH /api/todos/[id] with dueDate/goalId/weeklyPlanId:null clears them", async () => {
    const oid = () => new mongoose.Types.ObjectId().toString();
    const created = await json(
      await todosRoute.POST(
        req("POST", "/api/todos", {
          title: "t",
          order: "a0",
          dueDate: "2026-11-01",
          goalId: oid(),
          weeklyPlanId: oid(),
        })
      )
    );
    const res = await todoIdRoute.PATCH(
      req("PATCH", "/", { dueDate: null, goalId: null, weeklyPlanId: null }),
      ctx(created._id as string)
    );
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.dueDate ?? null).toBeNull();
    expect(body.goalId ?? null).toBeNull();
    expect(body.weeklyPlanId ?? null).toBeNull();
  });
});

describe("todo status can never be null", () => {
  it("PATCH {status:null} is rejected with 400 and the todo keeps its status", async () => {
    const created = await json(
      await todosRoute.POST(req("POST", "/api/todos", { title: "t", order: "a0", status: "doing" }))
    );
    const res = await todoIdRoute.PATCH(
      req("PATCH", "/", { status: null }),
      ctx(created._id as string)
    );
    expect(res.status).toBe(400);
    const after = await json(
      await todoIdRoute.GET(req("GET", "/"), ctx(created._id as string))
    );
    expect(after.status).toBe("doing");
  });
});

describe("updatePlan sends goalId:null (store)", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the null in the request body instead of dropping the key", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ _id: "p1", weekStart: "2024-01-01T00:00:00.000Z", goals: [], memo: "", retrospective: "" }),
    });
    await useStore.getState().updatePlan("p1", { goalId: null });
    const init = fetchMock.mock.calls[0][1] as { body: string };
    expect(init.body).toContain('"goalId":null');
  });
});
