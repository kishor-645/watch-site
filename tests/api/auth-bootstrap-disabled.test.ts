import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { call, errorOf } from "../helpers/api";
import { startTestDb } from "../helpers/db";

vi.mock("next/headers", () => import("../helpers/next-headers").then((m) => m.nextHeadersModule));

describe("bootstrap without INITIAL_ADMIN_PASSWORD", () => {
  let db: { stop: () => Promise<void> };
  beforeAll(async () => {
    delete process.env.INITIAL_ADMIN_PASSWORD;
    delete process.env.INITIAL_ADMIN_USERNAME;
    db = await startTestDb();
  });
  afterAll(async () => {
    await db?.stop();
  });

  it("is impossible and returns the generic 401", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    for (const password of ["", "admin", "undefined"]) {
      const res = await call(POST, "POST", "/api/auth/login", { body: { username: "admin", password: password || "x" } });
      expect(res.status).toBe(401);
      expect(errorOf(res).message).toBe("Incorrect username or password");
    }
    const { getCollections } = await import("@/server/db");
    expect(await (await getCollections()).admins.countDocuments()).toBe(0);
  });
});
