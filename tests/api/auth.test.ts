import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { call, errorOf } from "../helpers/api";
import { startTestDb } from "../helpers/db";
import { cookieJar } from "../helpers/next-headers";

vi.mock("next/headers", () => import("../helpers/next-headers").then((m) => m.nextHeadersModule));

const INITIAL_USER = "owner";
const INITIAL_PASS = "Initial-Pass-2026";
const NEW_PASS = "Brand-new-secret-42";
const COOKIE = "mw_admin_session";

type Routes = {
  login: typeof import("@/app/api/auth/login/route");
  logout: typeof import("@/app/api/auth/logout/route");
  me: typeof import("@/app/api/auth/me/route");
  password: typeof import("@/app/api/admin/account/password/route");
  stats: typeof import("@/app/api/admin/stats/route");
};

describe("auth API", () => {
  let db: { stop: () => Promise<void> };
  let r: Routes;
  const login = (username: string, password: string, ip?: string) =>
    call<{ username: string; mustChangePassword: boolean }>(r.login.POST, "POST", "/api/auth/login", { body: { username, password }, ip });
  const collections = async () => (await import("@/server/db")).getCollections();

  beforeAll(async () => {
    process.env.INITIAL_ADMIN_USERNAME = INITIAL_USER;
    process.env.INITIAL_ADMIN_PASSWORD = INITIAL_PASS;
    db = await startTestDb();
    r = {
      login: await import("@/app/api/auth/login/route"),
      logout: await import("@/app/api/auth/logout/route"),
      me: await import("@/app/api/auth/me/route"),
      password: await import("@/app/api/admin/account/password/route"),
      stats: await import("@/app/api/admin/stats/route"),
    };
  });
  afterAll(async () => {
    await db?.stop();
  });

  it("rejects unauthenticated admin requests and cross-site mutations", async () => {
    expect((await call(r.me.GET, "GET", "/api/auth/me")).status).toBe(401);
    const stats = await call(r.stats.GET, "GET", "/api/admin/stats");
    expect(stats.status).toBe(401);
    expect(errorOf(stats).code).toBe("UNAUTHORIZED");
    expect(stats.headers.get("cache-control")).toBe("no-store");

    const csrf = await call(r.login.POST, "POST", "/api/auth/login", {
      body: { username: INITIAL_USER, password: INITIAL_PASS },
      crossSite: true,
    });
    expect(csrf.status).toBe(403);
    expect(errorOf(csrf).code).toBe("FORBIDDEN");
    expect(await (await collections()).admins.countDocuments()).toBe(0);
  });

  it("does not bootstrap with wrong initial credentials", async () => {
    const wrongPass = await login(INITIAL_USER, "not-the-password", "198.51.100.1");
    expect(wrongPass.status).toBe(401);
    expect(errorOf(wrongPass).message).toBe("Incorrect username or password");
    expect((await login("someone", INITIAL_PASS, "198.51.100.1")).status).toBe(401);
    expect(await (await collections()).admins.countDocuments()).toBe(0);
  });

  it("bootstraps the first admin with the env credentials", async () => {
    const res = await login(INITIAL_USER, INITIAL_PASS);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ username: INITIAL_USER, mustChangePassword: true });
    const set = cookieJar.sets.at(-1)!;
    expect(set.name).toBe(COOKIE);
    expect(set.options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });

    const { admins, audit } = await collections();
    const admin = await admins.findOne({ username: INITIAL_USER });
    expect(admin).toMatchObject({ mustChangePassword: true, sessionVersion: 1, failedLoginCount: 0 });
    expect(admin!.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(admin!.lastLoginAt).toBeInstanceOf(Date);
    expect(await audit.countDocuments({ action: "auth.bootstrap" })).toBe(1);
    const failed = await audit.find({ action: "auth.login_failed" }).toArray();
    expect(failed.length).toBeGreaterThan(0);
    expect(failed.every((f) => f.actor.username === null)).toBe(true);
  });

  it("cannot bootstrap a second time", async () => {
    const res = await login("other-admin", INITIAL_PASS, "198.51.100.2");
    expect(res.status).toBe(401);
    expect(await (await collections()).admins.countDocuments()).toBe(1);
  });

  it("gates admin routes until the initial password is changed", async () => {
    const stats = await call(r.stats.GET, "GET", "/api/admin/stats");
    expect(stats.status).toBe(403);
    expect(errorOf(stats).code).toBe("PASSWORD_CHANGE_REQUIRED");
    const me = await call<{ username: string; mustChangePassword: boolean }>(r.me.GET, "GET", "/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.data).toMatchObject({ username: INITIAL_USER, mustChangePassword: true });
  });

  it("validates password changes", async () => {
    const change = (body: Record<string, string>) => call(r.password.POST, "POST", "/api/admin/account/password", { body });
    const wrongCurrent = await change({ currentPassword: "nope-nope-123", newPassword: NEW_PASS, confirmPassword: NEW_PASS });
    expect(wrongCurrent.status).toBe(422);
    expect(errorOf(wrongCurrent).fields).toHaveProperty("currentPassword");

    const weak = await change({ currentPassword: INITIAL_PASS, newPassword: "short", confirmPassword: "short" });
    expect(weak.status).toBe(422);
    expect(errorOf(weak).fields).toHaveProperty("newPassword");

    const mismatch = await change({ currentPassword: INITIAL_PASS, newPassword: NEW_PASS, confirmPassword: NEW_PASS + "x" });
    expect(mismatch.status).toBe(422);
    expect(errorOf(mismatch).fields).toHaveProperty("confirmPassword");

    const cross = await call(r.password.POST, "POST", "/api/admin/account/password", {
      body: { currentPassword: INITIAL_PASS, newPassword: NEW_PASS, confirmPassword: NEW_PASS },
      crossSite: true,
    });
    expect(cross.status).toBe(403);
  });

  it("changes the password, issues a fresh cookie and revokes old tokens", async () => {
    const oldToken = cookieJar.get(COOKIE)!;
    const res = await call(r.password.POST, "POST", "/api/admin/account/password", {
      body: { currentPassword: INITIAL_PASS, newPassword: NEW_PASS, confirmPassword: NEW_PASS },
    });
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ changed: true });
    const newToken = cookieJar.get(COOKIE)!;
    expect(newToken).toBeTruthy();
    expect(newToken).not.toBe(oldToken);

    const { admins, audit } = await collections();
    const admin = await admins.findOne({ username: INITIAL_USER });
    expect(admin).toMatchObject({ mustChangePassword: false, sessionVersion: 2 });
    expect(admin!.passwordChangedAt).toBeInstanceOf(Date);
    const entry = await audit.findOne({ action: "auth.password_change" });
    expect(entry).not.toBeNull();
    expect(JSON.stringify(entry)).not.toContain(NEW_PASS);

    expect((await call(r.stats.GET, "GET", "/api/admin/stats")).status).toBe(200);
    cookieJar.put(COOKIE, oldToken);
    expect((await call(r.me.GET, "GET", "/api/auth/me")).status).toBe(401);
    cookieJar.put(COOKIE, newToken);
    expect((await call(r.me.GET, "GET", "/api/auth/me")).status).toBe(200);
  });

  it("logout revokes the session and is idempotent", async () => {
    const token = cookieJar.get(COOKIE)!;
    const res = await call(r.logout.POST, "POST", "/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ loggedOut: true });
    expect(cookieJar.get(COOKIE)).toBeUndefined();

    cookieJar.put(COOKIE, token);
    expect((await call(r.me.GET, "GET", "/api/auth/me")).status).toBe(401);
    cookieJar.clear();
    expect((await call(r.logout.POST, "POST", "/api/auth/logout")).status).toBe(200);
    expect((await call(r.logout.POST, "POST", "/api/auth/logout", { crossSite: true })).status).toBe(403);
  });

  it("logs in with the new password and audits it", async () => {
    expect((await login(INITIAL_USER, INITIAL_PASS, "198.51.100.3")).status).toBe(401);
    const res = await login(INITIAL_USER, NEW_PASS, "198.51.100.3");
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ username: INITIAL_USER, mustChangePassword: false });
    expect((await call(r.stats.GET, "GET", "/api/admin/stats")).status).toBe(200);
    const { admins, audit } = await collections();
    expect(await admins.findOne({ username: INITIAL_USER })).toMatchObject({ lastLoginIp: "198.51.100.3", failedLoginCount: 0 });
    expect(await audit.countDocuments({ action: "auth.login" })).toBe(1);
  });

  it("uses the same 401 for wrong passwords and unknown users", async () => {
    const wrong = await login(INITIAL_USER, "wrong-password-1", "198.51.100.4");
    const unknown = await login("ghost", "wrong-password-1", "198.51.100.4");
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(errorOf(wrong)).toEqual(errorOf(unknown));
  });

  it("rate limits failed logins per IP (5 / 15 min) with Retry-After", async () => {
    const ip = "192.0.2.50";
    for (let i = 0; i < 5; i++) expect((await login("ghost", `bad-${i}`, ip)).status).toBe(401);
    const blocked = await login(INITIAL_USER, NEW_PASS, ip);
    expect(blocked.status).toBe(429);
    expect(errorOf(blocked).code).toBe("RATE_LIMITED");
    const retry = Number(blocked.headers.get("retry-after"));
    expect(retry).toBeGreaterThan(0);
    expect(retry).toBeLessThanOrEqual(15 * 60);
    // Other IPs are unaffected; successful logins do not consume the budget.
    for (let i = 0; i < 6; i++) expect((await login(INITIAL_USER, NEW_PASS, "192.0.2.51")).status).toBe(200);
  });

  it("locks an account after 10 consecutive failures", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await login(INITIAL_USER, `bad-${i}`, `10.0.${i}.1`)).status).toBe(401);
    }
    const locked = await login(INITIAL_USER, NEW_PASS, "10.0.99.1");
    expect(locked.status).toBe(429);
    expect(Number(locked.headers.get("retry-after"))).toBeGreaterThan(14 * 60);
    const { admins } = await collections();
    expect((await admins.findOne({ username: INITIAL_USER }))!.lockedUntil!.getTime()).toBeGreaterThan(Date.now());

    // Lock expiry restores access.
    await admins.updateOne({ username: INITIAL_USER }, { $set: { lockedUntil: new Date(Date.now() - 1000) } });
    expect((await login(INITIAL_USER, NEW_PASS, "10.0.99.2")).status).toBe(200);
  }, 60_000);

  it("rejects malformed bodies", async () => {
    const res = await call(r.login.POST, "POST", "/api/auth/login", { body: { username: "" }, ip: "10.1.1.1" });
    expect(res.status).toBe(422);
    expect(errorOf(res).fields).toHaveProperty("username");
  });

  it("rate limiter is atomic under concurrency and restarts expired windows", async () => {
    const { hitRateLimit, peekRateLimit, resetRateLimit } = await import("@/server/rate-limit");
    const { getCollections } = await import("@/server/db");
    const opts = { limit: 5, windowSeconds: 60 };
    const results = await Promise.all(Array.from({ length: 12 }, () => hitRateLimit("t:concurrent", opts)));
    expect(results.filter((x) => x.allowed)).toHaveLength(5);
    expect((await peekRateLimit("t:concurrent", opts)).allowed).toBe(false);

    const { rateLimits } = await getCollections();
    await rateLimits.updateOne({ _id: "t:concurrent" }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await peekRateLimit("t:concurrent", opts)).allowed).toBe(true);
    const fresh = await hitRateLimit("t:concurrent", opts);
    expect(fresh).toMatchObject({ allowed: true, remaining: 4 });
    expect(fresh.retryAfterSeconds).toBeGreaterThan(55);

    await resetRateLimit("t:concurrent");
    expect(await rateLimits.countDocuments({ _id: "t:concurrent" })).toBe(0);
  });
});
