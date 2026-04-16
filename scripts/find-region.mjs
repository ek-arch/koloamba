// Try each Europe pooler until we get a successful auth. The first one that
// returns rows from `select 1` is the region that hosts this project.
import pg from 'pg';

const password = process.env.DB_PASSWORD;
const ref      = process.env.DB_REF;
if (!password || !ref) {
  console.error('Set DB_PASSWORD and DB_REF');
  process.exit(1);
}

const regions = ['eu-central-1', 'eu-central-2', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1'];

for (const r of regions) {
  const url = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${r}.pooler.supabase.com:5432/postgres`;
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const { rows } = await client.query('select current_database() db, inet_server_addr() ip');
    console.log(`HIT  ${r}  → db=${rows[0].db} ip=${rows[0].ip}`);
    console.log(`CONNECTION_STRING=${url}`);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.log(`miss ${r.padEnd(14)} ${err.message.slice(0, 80)}`);
    try { await client.end(); } catch {}
  }
}
process.exit(2);
