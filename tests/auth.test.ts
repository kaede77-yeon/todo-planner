import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { NextRequest } from "next/server";
import * as githubRoute from "@/app/auth/github/route";
import * as callbackRoute from "@/app/auth/github/callback/route";
import * as logoutRoute from "@/app/auth/logout/route";
import * as meRoute from "@/app/auth/me/route";
import * as todosRoute from "@/app/api/todos/route";
import * as todoIdRoute from "@/app/api/todos/[id]/route";
import * as goalsRoute from "@/app/api/goals/route";
import * as goalIdRoute from "@/app/api/goals/[id]/route";
import * as weeklyRoute from "@/app/api/weekly/route";
import * as weeklyIdRoute from "@/app/api/weekly/[id]/route";
import { middleware } from "@/middleware";
import { connectDB } from "@/lib/mongodb";
import { SESSION_COOKIE, STATE_COOKIE } from "@/lib/auth";
import { Session } from "@/models/Session";
import { User } from "@/models/User";
import { seedUser, type TestUser } from "./helpers/auth";

let mongod: MongoMemoryServer;
let mongoUri: string;

function req(method: string, url: string, opts: { body?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.cookie) headers.cookie = opts.cookie;
  return new NextRequest(`http://localhost${url}`, {
    method,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    headers,
  });
}
const ctx = (id: string) => ({ params: { id } });
const json = async <T = Record<string, unknown>>(res: Response) => (await res.json()) as T;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  mongoUri = mongod.getUri("todo-auth");
  process.env.MONGODB_URI = mongoUri;
  await connectDB();
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = await mongoose.connection.db!.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
  process.env.GITHUB_CLIENT_ID = "test-client-id";
  process.env.GITHUB_CLIENT_SECRET = "test-client-secret";
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.GITHUB_CLIENT_ID;
  delete process.env.GITHUB_CLIENT_SECRET;
});

function stubGitHub(profile: { id: number; login: string; avatar_url: string }) {
  const fetchMock = vi.fn(async (input: unknown) => {
    const url = String(input);
    if (url.startsWith("https://github.com/login/oauth/access_token")) {
      return new Response(JSON.stringify({ access_token: "gho_fake" }), { status: 200 });
    }
    if (url.startsWith("https://api.github.com/user")) {
      return new Response(JSON.stringify(profile), { status: 200 });
    }
    throw new Error(`unexpected fetch ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** Runs the full authorize -> callback round trip and returns the callback response. */
async function login(profile: { id: number; login: string; avatar_url: string }) {
  const start = await githubRoute.GET(req("GET", "/auth/github"));
  const state = start.cookies.get(STATE_COOKIE)!.value;
  stubGitHub(profile);
  return callbackRoute.GET(
    req("GET", `/auth/github/callback?code=abc&state=${state}`, {
      cookie: `${STATE_COOKIE}=${state}`,
    })
  );
}

describe("GET /auth/github", () => {
  it("redirects to GitHub with client_id, callback and state, and sets a state cookie", async () => {
    const res = await githubRoute.GET(req("GET", "/auth/github"));
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.origin + loc.pathname).toBe("https://github.com/login/oauth/authorize");
    expect(loc.searchParams.get("client_id")).toBe("test-client-id");
    expect(loc.searchParams.get("redirect_uri")).toBe("http://localhost/auth/github/callback");
    const state = res.cookies.get(STATE_COOKIE)!;
    expect(loc.searchParams.get("state")).toBe(state.value);
    expect(state.httpOnly).toBe(true);
    expect(res.headers.get("location")).not.toContain("test-client-secret");
  });

  it("strips whitespace, newlines and wrapping quotes from the credentials", async () => {
    process.env.GITHUB_CLIENT_ID = '  "test-client-id"\r\n';
    process.env.GITHUB_CLIENT_SECRET = "'test-client-secret'\n";
    const res = await githubRoute.GET(req("GET", "/auth/github"));
    expect(new URL(res.headers.get("location")!).searchParams.get("client_id")).toBe("test-client-id");

    const state = res.cookies.get(STATE_COOKIE)!.value;
    const fetchMock = stubGitHub({ id: 1, login: "a", avatar_url: "" });
    await callbackRoute.GET(
      req("GET", `/auth/github/callback?code=abc&state=${state}`, {
        cookie: `${STATE_COOKIE}=${state}`,
      })
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = JSON.parse(init.body as string);
    expect(sent.client_id).toBe("test-client-id");
    expect(sent.client_secret).toBe("test-client-secret");
  });

  it("treats a whitespace- or quotes-only value as missing", async () => {
    process.env.GITHUB_CLIENT_ID = '  ""  ';
    const res = await githubRoute.GET(req("GET", "/auth/github"));
    expect(res.status).toBe(500);
  });

  it("returns a 500 with setup guidance when credentials are missing", async () => {
    delete process.env.GITHUB_CLIENT_SECRET;
    const res = await githubRoute.GET(req("GET", "/auth/github"));
    expect(res.status).toBe(500);
    expect((await json<{ error: string }>(res)).error).toContain("GITHUB_CLIENT_SECRET");
  });
});

describe("GET /auth/github/callback", () => {
  it("stores username and avatar_url, creates a session cookie and redirects to /", async () => {
    const res = await login({ id: 42, login: "octocat", avatar_url: "https://a/1.png" });
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/");

    const user = await User.findOne({ githubId: 42 });
    expect(user?.username).toBe("octocat");
    expect(user?.avatarUrl).toBe("https://a/1.png");

    const sid = res.cookies.get(SESSION_COOKIE)!;
    expect(sid.httpOnly).toBe(true);
    expect(await Session.countDocuments({ userId: user!.id })).toBe(1);
    // Only a hash is stored, never the cookie token itself.
    expect(await Session.countDocuments({ tokenHash: sid.value })).toBe(0);
  });

  it("sends the client secret to GitHub only in the server-side token exchange", async () => {
    const start = await githubRoute.GET(req("GET", "/auth/github"));
    const state = start.cookies.get(STATE_COOKIE)!.value;
    const fetchMock = stubGitHub({ id: 1, login: "a", avatar_url: "" });
    await callbackRoute.GET(
      req("GET", `/auth/github/callback?code=abc&state=${state}`, {
        cookie: `${STATE_COOKIE}=${state}`,
      })
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string).client_secret).toBe("test-client-secret");
  });

  it("updates the profile on re-login instead of creating a duplicate user", async () => {
    await login({ id: 7, login: "old-name", avatar_url: "https://a/old.png" });
    await login({ id: 7, login: "new-name", avatar_url: "https://a/new.png" });
    const users = await User.find({ githubId: 7 });
    expect(users).toHaveLength(1);
    expect(users[0].username).toBe("new-name");
    expect(users[0].avatarUrl).toBe("https://a/new.png");
  });

  it("rejects a mismatched or missing state with 400 and creates no session", async () => {
    stubGitHub({ id: 5, login: "x", avatar_url: "" });
    const mismatch = await callbackRoute.GET(
      req("GET", "/auth/github/callback?code=abc&state=evil", {
        cookie: `${STATE_COOKIE}=good`,
      })
    );
    expect(mismatch.status).toBe(400);
    const noCookie = await callbackRoute.GET(
      req("GET", "/auth/github/callback?code=abc&state=evil")
    );
    expect(noCookie.status).toBe(400);
    const noCode = await callbackRoute.GET(
      req("GET", "/auth/github/callback?state=s", { cookie: `${STATE_COOKIE}=s` })
    );
    expect(noCode.status).toBe(400);
    expect(await Session.countDocuments()).toBe(0);
    expect(await User.countDocuments()).toBe(0);
  });

  it("returns 502 and creates no session when GitHub rejects the code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "bad_verification_code" }), { status: 200 }))
    );
    const res = await callbackRoute.GET(
      req("GET", "/auth/github/callback?code=abc&state=s", { cookie: `${STATE_COOKIE}=s` })
    );
    expect(res.status).toBe(502);
    expect(await Session.countDocuments()).toBe(0);
  });
});

describe("unauthenticated access", () => {
  it("every todo endpoint returns 401 without a session", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    const results = [
      await todosRoute.GET(req("GET", "/api/todos")),
      await todosRoute.POST(req("POST", "/api/todos", { body: { title: "t", order: "a0" } })),
      await todoIdRoute.GET(req("GET", "/"), ctx(id)),
      await todoIdRoute.PUT(req("PUT", "/", { body: { title: "x" } }), ctx(id)),
      await todoIdRoute.PATCH(req("PATCH", "/", { body: { status: "done" } }), ctx(id)),
      await todoIdRoute.DELETE(req("DELETE", "/"), ctx(id)),
    ];
    for (const res of results) expect(res.status).toBe(401);
  });

  it("goals and weekly endpoints verify the session server-side (no session or forged cookie -> 401)", async () => {
    const id = new mongoose.Types.ObjectId().toString();
    for (const cookie of [undefined, `${SESSION_COOKIE}=forged`]) {
      const results = [
        await goalsRoute.GET(req("GET", "/api/goals", { cookie })),
        await goalsRoute.POST(req("POST", "/api/goals", { cookie, body: { title: "g" } })),
        await goalIdRoute.GET(req("GET", "/", { cookie }), ctx(id)),
        await goalIdRoute.PUT(req("PUT", "/", { cookie, body: { title: "x" } }), ctx(id)),
        await goalIdRoute.DELETE(req("DELETE", "/", { cookie }), ctx(id)),
        await weeklyRoute.GET(req("GET", "/api/weekly", { cookie })),
        await weeklyRoute.POST(req("POST", "/api/weekly", { cookie, body: { weekStart: "2026-11-16" } })),
        await weeklyIdRoute.GET(req("GET", "/", { cookie }), ctx(id)),
        await weeklyIdRoute.PUT(req("PUT", "/", { cookie, body: { memo: "x" } }), ctx(id)),
        await weeklyIdRoute.PATCH(req("PATCH", "/", { cookie, body: { index: 0, done: true } }), ctx(id)),
        await weeklyIdRoute.DELETE(req("DELETE", "/", { cookie }), ctx(id)),
      ];
      for (const res of results) expect(res.status).toBe(401);
    }
  });

  it("rejects a forged session cookie and an expired session", async () => {
    const forged = await todosRoute.GET(req("GET", "/api/todos", { cookie: `${SESSION_COOKIE}=forged` }));
    expect(forged.status).toBe(401);

    const user = await seedUser("expiring", 9);
    await Session.updateMany({ userId: user.id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const expired = await todosRoute.GET(req("GET", "/api/todos", { cookie: user.cookie }));
    expect(expired.status).toBe(401);
  });

  it("GET /auth/me is 401 without a session and returns the user with one", async () => {
    expect((await meRoute.GET(req("GET", "/auth/me"))).status).toBe(401);
    const user = await seedUser("me-user", 3);
    const res = await meRoute.GET(req("GET", "/auth/me", { cookie: user.cookie }));
    expect(res.status).toBe(200);
    expect(await json(res)).toMatchObject({ username: "me-user" });
  });

  it("middleware: API gets 401, pages redirect to /login, a cookie passes through", async () => {
    const api = middleware(req("GET", "/api/todos"));
    expect(api.status).toBe(401);
    const page = middleware(req("GET", "/todos"));
    expect(page.status).toBe(307);
    expect(new URL(page.headers.get("location")!).pathname).toBe("/login");
    const ok = middleware(req("GET", "/todos", { cookie: `${SESSION_COOKIE}=x` }));
    expect(ok.headers.get("x-middleware-next")).toBe("1");
  });
});

describe("per-user todo isolation", () => {
  let alice: TestUser;
  let bob: TestUser;

  beforeEach(async () => {
    alice = await seedUser("alice", 101);
    bob = await seedUser("bob", 102);
  });

  async function create(user: TestUser, title: string, extra: Record<string, unknown> = {}) {
    const res = await todosRoute.POST(
      req("POST", "/api/todos", { cookie: user.cookie, body: { title, order: "a0", ...extra } })
    );
    expect(res.status).toBe(201);
    return json<{ _id: string; userId: string }>(res);
  }

  it("lists only the caller's own todos", async () => {
    await create(alice, "alice-1");
    await create(alice, "alice-2");
    await create(bob, "bob-1");
    const list = await json<{ title: string }[]>(
      await todosRoute.GET(req("GET", "/api/todos", { cookie: alice.cookie }))
    );
    expect(list.map((t) => t.title).sort()).toEqual(["alice-1", "alice-2"]);
  });

  it("ignores a userId sent in the body and owns the todo by session", async () => {
    const t = await create(alice, "mine", { userId: bob.id });
    expect(t.userId).toBe(alice.id);
  });

  it("returns 404 when another user reads, updates or deletes a todo, leaving it intact", async () => {
    const t = await create(alice, "private");
    expect((await todoIdRoute.GET(req("GET", "/", { cookie: bob.cookie }), ctx(t._id))).status).toBe(404);
    expect(
      (
        await todoIdRoute.PATCH(
          req("PATCH", "/", { cookie: bob.cookie, body: { title: "hacked" } }),
          ctx(t._id)
        )
      ).status
    ).toBe(404);
    expect(
      (
        await todoIdRoute.PUT(
          req("PUT", "/", { cookie: bob.cookie, body: { title: "hacked" } }),
          ctx(t._id)
        )
      ).status
    ).toBe(404);
    expect((await todoIdRoute.DELETE(req("DELETE", "/", { cookie: bob.cookie }), ctx(t._id))).status).toBe(404);

    const still = await json<{ title: string }>(
      await todoIdRoute.GET(req("GET", "/", { cookie: alice.cookie }), ctx(t._id))
    );
    expect(still.title).toBe("private");
  });

  it("PUT/PATCH cannot reassign a todo's owner via the body", async () => {
    const t = await create(alice, "keep-owner");
    for (const route of [todoIdRoute.PUT, todoIdRoute.PATCH]) {
      const res = await route(
        req("PATCH", "/", { cookie: alice.cookie, body: { userId: bob.id, title: "renamed" } }),
        ctx(t._id)
      );
      expect(res.status).toBe(200);
      expect((await json<{ userId: string }>(res)).userId).toBe(alice.id);
    }
    expect((await todoIdRoute.GET(req("GET", "/", { cookie: bob.cookie }), ctx(t._id))).status).toBe(404);
  });

  it("deleting a goal unlinks only the caller's todos, never another user's", async () => {
    const goal = await json<{ _id: string }>(
      await goalsRoute.POST(req("POST", "/api/goals", { cookie: bob.cookie, body: { title: "shared" } }))
    );
    const aliceTodo = await create(alice, "alice-linked", { goalId: goal._id });
    const bobTodo = await create(bob, "bob-linked", { goalId: goal._id });

    const del = await goalIdRoute.DELETE(req("DELETE", "/", { cookie: bob.cookie }), ctx(goal._id));
    expect(del.status).toBe(200);

    const a = await json<{ goalId?: string }>(
      await todoIdRoute.GET(req("GET", "/", { cookie: alice.cookie }), ctx(aliceTodo._id))
    );
    expect(a.goalId).toBe(goal._id);
    const b = await json<{ goalId?: string }>(
      await todoIdRoute.GET(req("GET", "/", { cookie: bob.cookie }), ctx(bobTodo._id))
    );
    expect(b.goalId).toBeUndefined();
  });

  it("lets the owner read, update and delete their own todo", async () => {
    const t = await create(alice, "own");
    const upd = await todoIdRoute.PATCH(
      req("PATCH", "/", { cookie: alice.cookie, body: { status: "doing" } }),
      ctx(t._id)
    );
    expect(upd.status).toBe(200);
    expect((await json<{ status: string }>(upd)).status).toBe("doing");
    const del = await todoIdRoute.DELETE(req("DELETE", "/", { cookie: alice.cookie }), ctx(t._id));
    expect(del.status).toBe(200);
  });
});

describe("POST /auth/logout", () => {
  it("deletes the server-side session, expires the cookie, and the old cookie stops working", async () => {
    const user = await seedUser("leaver", 55);
    expect(await Session.countDocuments({ userId: user.id })).toBe(1);

    const res = await logoutRoute.POST(req("POST", "/auth/logout", { cookie: user.cookie }));
    expect(res.status).toBe(200);
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBe("");
    expect(await Session.countDocuments({ userId: user.id })).toBe(0);

    const after = await todosRoute.GET(req("GET", "/api/todos", { cookie: user.cookie }));
    expect(after.status).toBe(401);
  });

  it("only removes the caller's session, not other sessions", async () => {
    const a = await seedUser("a", 61);
    const b = await seedUser("b", 62);
    await logoutRoute.POST(req("POST", "/auth/logout", { cookie: a.cookie }));
    expect(await Session.countDocuments({ userId: b.id })).toBe(1);
  });
});

describe("legacy todo migration script", () => {
  const script = path.resolve(__dirname, "../scripts/migrate-todos-user.mjs");
  const run = (...args: string[]) =>
    execFileSync(process.execPath, [script, ...args], {
      env: { ...process.env, MONGODB_URI: mongoUri },
      encoding: "utf8",
    });

  it("assigns only ownerless todos to the user, supports --dry-run, and is idempotent", async () => {
    const owner = await seedUser("legacy-owner", 77);
    const other = await seedUser("someone-else", 78);
    const todos = mongoose.connection.db!.collection("todos");
    await todos.insertMany([
      { title: "legacy-1", order: "a0", status: "todo" },
      { title: "legacy-2", order: "a1", status: "todo" },
      { title: "owned", order: "a2", status: "todo", userId: new mongoose.Types.ObjectId(other.id) },
    ]);

    expect(run("legacy-owner", "--dry-run")).toContain("2 todo(s) would be assigned");
    expect(await todos.countDocuments({ userId: { $exists: false } })).toBe(2);

    expect(run("legacy-owner")).toContain("Assigned 2 todo(s)");
    expect(await todos.countDocuments({ userId: { $exists: false } })).toBe(0);
    const mine = await json<{ title: string }[]>(
      await todosRoute.GET(req("GET", "/api/todos", { cookie: owner.cookie }))
    );
    expect(mine.map((t) => t.title).sort()).toEqual(["legacy-1", "legacy-2"]);
    // A todo that already had an owner is untouched.
    const kept = await todos.findOne({ title: "owned" });
    expect(String(kept!.userId)).toBe(other.id);

    expect(run("legacy-owner")).toContain("Assigned 0 todo(s)");
  });

  it("fails with a clear message when the user does not exist", () => {
    expect(() => run("nobody")).toThrow();
  });

  it("refuses and changes nothing when the username is ambiguous", async () => {
    await seedUser("dup", 201);
    await seedUser("dup", 202);
    const todos = mongoose.connection.db!.collection("todos");
    await todos.insertOne({ title: "legacy", order: "a0", status: "todo" });
    expect(() => run("dup")).toThrow();
    expect(await todos.countDocuments({ userId: { $exists: false } })).toBe(1);
  });
});
