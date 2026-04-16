import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const tables = await client.query(`
  select table_name from information_schema.tables
  where table_schema='public' and table_type='BASE TABLE'
  order by table_name
`);
console.log('tables:', tables.rows.map(r => r.table_name).join(', '));

const views = await client.query(`
  select table_name from information_schema.views where table_schema='public'
`);
console.log('views: ', views.rows.map(r => r.table_name).join(', '));

const tiers = await client.query('select tier, multiplier from tier_config order by multiplier');
console.log('tier_config:', tiers.rows);

const campaigns = await client.query('select name, pool_amount, status from campaigns');
console.log('campaigns:', campaigns.rows);

await client.end();
