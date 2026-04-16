// Probe which Supabase Europe region hosts this project by trying the pooler
// hostname for each one. First one that resolves + accepts TCP wins.
import dns from 'node:dns/promises';

const regions = [
  'eu-central-1',
  'eu-central-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'eu-south-1',
];

for (const r of regions) {
  const host = `aws-0-${r}.pooler.supabase.com`;
  try {
    const addr = await dns.lookup(host);
    console.log(`OK  ${r.padEnd(14)} → ${host} (${addr.address})`);
  } catch {
    console.log(`--  ${r.padEnd(14)} → no record`);
  }
}
