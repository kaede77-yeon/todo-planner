import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { NextRequest } from "next/server";
import * as goalsRoute from "@/app/api/goals/route";
import * as goalRoute from "@/app/api/goals/[id]/route";
import * as weeklyRoute from "@/app/api/weekly/route";
import * as weeklyIdRoute from "@/app/api/weekly/[id]/route";
import * as todosRoute from "@/app/api/todos/route";
import * as todoIdRoute from "@/app/api/todos/[id]/route";
import { connectDB } from "@/lib/mongodb";
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

interface Doc {
  _id: string;
  [key: string]: unknown;
}

async function json<T = Doc>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("todo-test");
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

async function createTodo(body: Record<string, unknown>) {
  const res = await todosRoute.POST(req("POST", "/api/todos", body));
  expect(res.status).toBe(201);
  return json(res);
}

describe("invalid ids", () => {
  const bad = "not-an-id";
  it("returns 400 for every [id] route", async () => {
    const cases: Response[] = [
      await goalRoute.GET(req("GET", "/"), ctx(bad)),
      await goalRoute.PUT(req("PUT", "/", {}), ctx(bad)),
      await goalRoute.DELETE(req("DELETE", "/"), ctx(bad)),
      await weeklyIdRoute.GET(req("GET", "/"), ctx(bad)),
      await weeklyIdRoute.PATCH(req("PATCH", "/", { index: 0, done: true }), ctx(bad)),
      await todoIdRoute.GET(req("GET", "/"), ctx(bad)),
      await todoIdRoute.PATCH(req("PATCH", "/", { status: "done" }), ctx(bad)),
    ];
    for (const res of cases) {
      expect(res.status).toBe(400);
      expect(await json<{ error: string }>(res)).toHaveProperty("error");
    }
  });

  it("returns 400 for invalid id filter and 404 for unknown id", async () => {
    const res = await todosRoute.GET(req("GET", "/api/todos?goalId=zzz"));
    expect(res.status).toBe(400);
    const missing = new mongoose.Types.ObjectId().toString();
    expect((await todoIdRoute.GET(req("GET", "/"), ctx(missing))).status).toBe(404);
    expect((await goalRoute.DELETE(req("DELETE", "/"), ctx(missing))).status).toBe(404);
  });
});

describe("goals CRUD", () => {
  it("creates, reads, updates, lists and deletes", async () => {
    const created = await json(
      await goalsRoute.POST(req("POST", "/api/goals", { title: "Learn" }))
    );
    expect(created.title).toBe("Learn");
    const got = await json(await goalRoute.GET(req("GET", "/"), ctx(created._id)));
    expect(got._id).toBe(created._id);
    const upd = await json(
      await goalRoute.PUT(req("PUT", "/", { title: "Learn more" }), ctx(created._id))
    );
    expect(upd.title).toBe("Learn more");
    const list = await json<Doc[]>(await goalsRoute.GET(req("GET", "/api/goals")));
    expect(list).toHaveLength(1);
    expect((await goalRoute.DELETE(req("DELETE", "/"), ctx(created._id))).status).toBe(200);
    expect((await json<Doc[]>(await goalsRoute.GET(req("GET", "/api/goals"))))).toHaveLength(0);
  });

  it("returns 400 when title is missing", async () => {
    const res = await goalsRoute.POST(req("POST", "/api/goals", {}));
    expect(res.status).toBe(400);
  });
});

describe("weekly plans", () => {
  const weekStart = "2026-11-09T00:00:00.000Z";

  it("returns 409 on duplicate weekStart", async () => {
    const first = await weeklyRoute.POST(req("POST", "/api/weekly", { weekStart }));
    expect(first.status).toBe(201);
    const second = await weeklyRoute.POST(req("POST", "/api/weekly", { weekStart }));
    expect(second.status).toBe(409);
  });

  it("filters by weekStart", async () => {
    await weeklyRoute.POST(req("POST", "/api/weekly", { weekStart }));
    await weeklyRoute.POST(
      req("POST", "/api/weekly", { weekStart: "2026-11-16T00:00:00.000Z" })
    );
    const all = await json<Doc[]>(await weeklyRoute.GET(req("GET", "/api/weekly")));
    expect(all).toHaveLength(2);
    const one = await json<Doc[]>(
      await weeklyRoute.GET(req("GET", `/api/weekly?weekStart=${weekStart}`))
    );
    expect(one).toHaveLength(1);
  });

  it("returns 400 for more than 5 goals on POST and PUT", async () => {
    const goals = Array.from({ length: 6 }, (_, i) => ({ text: `g${i}` }));
    const res = await weeklyRoute.POST(req("POST", "/api/weekly", { weekStart, goals }));
    expect(res.status).toBe(400);

    const ok = await json(
      await weeklyRoute.POST(req("POST", "/api/weekly", { weekStart, goals: goals.slice(0, 5) }))
    );
    const put = await weeklyIdRoute.PUT(req("PUT", "/", { goals }), ctx(ok._id));
    expect(put.status).toBe(400);
  });

  it("PATCH toggles goals[n].done and persists", async () => {
    const plan = await json<{ _id: string; goals: { text: string; done: boolean }[] }>(
      await weeklyRoute.POST(
        req("POST", "/api/weekly", { weekStart, goals: [{ text: "a" }, { text: "b" }] })
      )
    );
    const res = await weeklyIdRoute.PATCH(
      req("PATCH", "/", { index: 1, done: true }),
      ctx(plan._id)
    );
    expect(res.status).toBe(200);
    const patched = await json<typeof plan>(res);
    expect(patched.goals[0].done).toBe(false);
    expect(patched.goals[1].done).toBe(true);

    const fetched = await json<typeof plan>(
      await weeklyIdRoute.GET(req("GET", "/"), ctx(plan._id))
    );
    expect(fetched.goals[1].done).toBe(true);

    const oob = await weeklyIdRoute.PATCH(
      req("PATCH", "/", { index: 9, done: true }),
      ctx(plan._id)
    );
    expect(oob.status).toBe(400);
  });
});

describe("todos", () => {
  it("PATCH status/order persists", async () => {
    const t = await createTodo({ title: "t", order: "a0" });
    expect(t.status).toBe("todo");
    expect(t.priority).toBe("medium");
    const res = await todoIdRoute.PATCH(
      req("PATCH", "/", { status: "doing", order: "a1" }),
      ctx(t._id)
    );
    expect(res.status).toBe(200);
    const fetched = await json(await todoIdRoute.GET(req("GET", "/"), ctx(t._id)));
    expect(fetched.status).toBe("doing");
    expect(fetched.order).toBe("a1");
    const bad = await todoIdRoute.PATCH(req("PATCH", "/", { status: "nope" }), ctx(t._id));
    expect(bad.status).toBe(400);
  });

  it("GET is ordered by status then order lexicographically", async () => {
    await createTodo({ title: "d-b", status: "done", order: "a1" });
    await createTodo({ title: "t-Zz", status: "todo", order: "Zz" });
    await createTodo({ title: "t-a10", status: "todo", order: "a10" });
    await createTodo({ title: "t-a2", status: "todo", order: "a2" });
    await createTodo({ title: "g-a0", status: "doing", order: "a0" });
    await createTodo({ title: "d-a", status: "done", order: "a0V" });
    const list = await json<{ title: string }[]>(await todosRoute.GET(req("GET", "/api/todos")));
    expect(list.map((t) => t.title)).toEqual([
      "g-a0", // doing
      "d-a", // done a0V
      "d-b", // done a1
      "t-Zz", // todo, uppercase sorts before lowercase
      "t-a10",
      "t-a2",
    ]);
  });

  it("filters by status, weeklyPlanId and goalId", async () => {
    const goal = await json(await goalsRoute.POST(req("POST", "/api/goals", { title: "g" })));
    const plan = await json(
      await weeklyRoute.POST(
        req("POST", "/api/weekly", { weekStart: "2026-11-09T00:00:00.000Z" })
      )
    );
    await createTodo({ title: "a", order: "a0", goalId: goal._id, weeklyPlanId: plan._id });
    await createTodo({ title: "b", order: "a1", status: "done" });
    const byStatus = await json<Doc[]>(await todosRoute.GET(req("GET", "/api/todos?status=done")));
    expect(byStatus).toHaveLength(1);
    const byGoal = await json<Doc[]>(
      await todosRoute.GET(req("GET", `/api/todos?goalId=${goal._id}`))
    );
    expect(byGoal).toHaveLength(1);
    const byPlan = await json<Doc[]>(
      await todosRoute.GET(req("GET", `/api/todos?weeklyPlanId=${plan._id}`))
    );
    expect(byPlan).toHaveLength(1);
    expect((await todosRoute.GET(req("GET", "/api/todos?status=bad"))).status).toBe(400);
  });

  it("returns 400 when order is missing", async () => {
    const res = await todosRoute.POST(req("POST", "/api/todos", { title: "x" }));
    expect(res.status).toBe(400);
  });
});

describe("goal deletion", () => {
  it("unsets goalId on todos and weekly plans without deleting them", async () => {
    const goal = await json(await goalsRoute.POST(req("POST", "/api/goals", { title: "g" })));
    const plan = await json(
      await weeklyRoute.POST(
        req("POST", "/api/weekly", {
          weekStart: "2026-11-09T00:00:00.000Z",
          goalId: goal._id,
        })
      )
    );
    const todo = await createTodo({ title: "t", order: "a0", goalId: goal._id });
    expect(plan.goalId).toBe(goal._id);

    const del = await goalRoute.DELETE(req("DELETE", "/"), ctx(goal._id));
    expect(del.status).toBe(200);

    const t = await todoIdRoute.GET(req("GET", "/"), ctx(todo._id));
    expect(t.status).toBe(200);
    expect((await json(t)).goalId).toBeUndefined();
    const p = await weeklyIdRoute.GET(req("GET", "/"), ctx(plan._id));
    expect(p.status).toBe(200);
    expect((await json(p)).goalId).toBeUndefined();
  });
});

describe("error mapping", () => {
  it("returns 500 JSON when MONGODB_URI is missing and no connection is cached", async () => {
    const saved = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    try {
      const res = await goalsRoute.GET(req("GET", "/api/goals"));
      expect(res.status).toBe(500);
      expect(await json<{ error: string }>(res)).toHaveProperty("error");
    } finally {
      process.env.MONGODB_URI = saved;
    }
  });
});
