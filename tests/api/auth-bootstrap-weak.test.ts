import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { call, errorOf } from "../helpers/api";
import { startTestDb } from "../helpers/db";

vi.mock("next/headers", () => import("../helpers/next-headers").then((m) => m.nextHeadersModule));

const USER = "owner";
const SHORT_PASS = "Short-pass1"; // 11 characters — below the 12-character minimum

describe("bootstrap with a short INITIAL_ADMIN_PASSWORD", () => {
  let db: { stop: () => Promise<void> };
  beforeAll(async () => {
    process.env.INITIAL_ADMIN_USERNAME = USER;
    process.env.INITIAL_ADMIN_PASSWORD = SHORT_PASS;
    db = await startTestDb();
  });
  afterAll(async () => {
    delete process.env.INITIAL_ADMIN_PASSWORD;
    delete process.env.INITIAL_ADMIN_USERNAME;
    await db?.stop();
  });

  it("is refused with the generic 401 and a warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const { POST } = await import("@/app/api/auth/login/route");
      const res = await call(POST, "POST", "/api/auth/login", { body: { username: USER, password: SHORT_PASS } });
      expect(res.status).toBe(401);
      expect(errorOf(res).message).toBe("Incorrect username or password");
      expect(warn.mock.calls.flat().join(" ")).toContain("shorter than 12 characters");
      const { getCollections } = await import("@/server/db");
      expect(await (await getCollections()).admins.countDocuments()).toBe(0);
    } finally {
      warn.mockRestore();
    }
  });
});
