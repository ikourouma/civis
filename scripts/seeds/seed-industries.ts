// Seed civis_industries from the curated NAICS data file.
// Run: npx tsx scripts/seeds/seed-industries.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { seedClient, seedCanonicalTable, writeSeedAudit } from './_client';

interface IndustrySeed {
  name_en: string;
  name_fr?: string;
  naics_code?: string | null;
}

async function main() {
  const admin = seedClient();
  console.log('Seeding civis_industries...\n');

  const file = resolve(process.cwd(), 'scripts/seeds/data/industries.json');
  const data = JSON.parse(readFileSync(file, 'utf-8')) as IndustrySeed[];

  const rows = data.map((i) => ({
    name_en: i.name_en,
    name_fr: i.name_fr ?? null,
    naics_code: i.naics_code ?? null,
    is_canonical: true,
  }));

  const { inserted, skipped } = await seedCanonicalTable(admin, 'civis_industries', rows);

  console.log(`\nTotal industries processed: ${rows.length}`);
  console.log(`Inserted: ${inserted}, Skipped (existing): ${skipped}`);

  await writeSeedAudit(admin, 'civis_industries', inserted, skipped);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
