// One-off: run supabase/schema.sql against the configured Postgres.
// Usage:  DATABASE_URL='postgresql://...' node scripts/run-schema.mjs
// Exits non-zero on error so CI/ops wrappers can detect failure.

import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const schemaPath = path.resolve('supabase/schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

// Supabase requires SSL. `rejectUnauthorized: false` matches what
// `psql ...supabase.co` does by default (self-signed cert chain).
const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('connected; running schema.sql…');
  await client.query(sql);
  console.log('schema.sql applied.');
} catch (err) {
  console.error('schema error:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
