import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * Starts an isolated in-memory MongoDB and points MONGODB_URI at it.
 * Import server modules AFTER calling this (use dynamic import in beforeAll).
 */
export async function startTestDb(): Promise<{ stop: () => Promise<void> }> {
  const server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri();
  process.env.MONGODB_DB = `test_${Math.random().toString(36).slice(2, 8)}`;
  process.env.SESSION_SECRET ??= "test-secret-test-secret-test-secret-0123456789";
  return {
    stop: async () => {
      const { closeDb } = await import("@/server/db");
      await closeDb();
      await server.stop();
    },
  };
}
