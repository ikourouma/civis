// Seed civis_occupations from the curated data file.
// Run: npx tsx scripts/seeds/seed-occupations.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { seedClient, seedCanonicalTable, writeSeedAudit } from './_client';

interface OccupationSeed {
  name_en: string;
  name_fr?: string;
  category?: string;
}

async function main() {
  const admin = seedClient();
  console.log('Seeding civis_occupations...\n');

  const file = resolve(process.cwd(), 'scripts/seeds/data/occupations.json');
  const data = JSON.parse(readFileSync(file, 'utf-8')) as OccupationSeed[];

  const rows = data.map((o) => ({
    name_en: o.name_en,
    name_fr: o.name_fr ?? null,
    category: o.category ?? null,
    is_canonical: true,
  }));

  const { inserted, skipped } = await seedCanonicalTable(admin, 'civis_occupations', rows);

  console.log(`\nTotal occupations processed: ${rows.length}`);
  console.log(`Inserted: ${inserted}, Skipped (existing): ${skipped}`);

  await writeSeedAudit(admin, 'civis_occupations', inserted, skipped);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
