/**
 * Local development database — no Atlas account needed.
 * Starts a MongoDB server on 127.0.0.1:27018 with data persisted in ./.data/mongo, seeds the
 * sample catalogue on first run, and keeps running until Ctrl+C.
 *
 *   npm run dev:db        (in one terminal)
 *   npm run dev           (in another; .env.local: MONGODB_URI=mongodb://127.0.0.1:27018/)
 */
import { mkdirSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";

const PORT = Number(process.env.DEV_DB_PORT ?? 27018);
const DB_PATH = ".data/mongo";

async function main() {
  mkdirSync(DB_PATH, { recursive: true });
  const server = await MongoMemoryServer.create({
    instance: { port: PORT, ip: "127.0.0.1", dbPath: DB_PATH, storageEngine: "wiredTiger" },
  });
  const uri = server.getUri();
  process.env.MONGODB_URI = uri;

  const { closeDb, collectionsFor, ensureIndexes, getDb } = await import("@/server/db");
  const { seedSampleCatalog } = await import("@/server/seed/sample-catalog");
  const db = await getDb();
  await ensureIndexes(db);
  const inserted = await seedSampleCatalog(collectionsFor(db), "dev-db");
  await closeDb();

  console.log(`\nDev MongoDB running at ${uri}  (db: ${process.env.MONGODB_DB ?? "mywatch"})`);
  console.log(inserted ? `Seeded ${inserted} sample watches.` : "Existing data kept.");
  console.log("Press Ctrl+C to stop.\n");

  const stop = async () => {
    await server.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error("dev-db failed:", err);
  process.exit(1);
});
