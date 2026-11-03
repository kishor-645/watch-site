/**
 * Seeds the sample catalogue into the database pointed to by MONGODB_URI.
 * Safe by default: only inserts when the `watches` collection is empty. Settings are not written
 * (defaults apply until an admin saves Settings). The admin account is created on first login.
 *
 *   npm run db:seed
 */
import { closeDb, collectionsFor, ensureIndexes, getDb } from "@/server/db";
import { seedSampleCatalog } from "@/server/seed/sample-catalog";

async function main() {
  const db = await getDb();
  await ensureIndexes(db);
  const inserted = await seedSampleCatalog(collectionsFor(db), "seed-script");
  console.log(inserted ? `Inserted ${inserted} sample watches into "${db.databaseName}".` : "Catalogue already has watches — nothing inserted.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
