import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url), { schema });
}

// Lazy singleton. On Cloudflare Workers env vars are NOT available at module
// top-level (only inside a request), so we must defer getDb() to first use.
// A Proxy keeps the existing `db.select(...)` call sites working unchanged.
type DrizzleDb = ReturnType<typeof getDb>;
let _db: DrizzleDb | null = null;
function resolveDb(): DrizzleDb {
  if (!_db) _db = getDb();
  return _db;
}
export const db = new Proxy({} as DrizzleDb, {
  get(_t, prop) {
    const real = resolveDb() as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? v.bind(real) : v;
  },
});
