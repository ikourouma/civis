// Seed civis_fields_of_study from the curated UNESCO ISCED-F data file.
// Run: npx tsx scripts/seeds/seed-fields-of-study.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { seedClient, seedCanonicalTable, writeSeedAudit } from './_client';

interface FieldSeed {
  name_en: string;
  name_fr?: string;
  category?: string;
}

async function main() {
  const admin = seedClient();
  console.log('Seeding civis_fields_of_study...\n');

  const file = resolve(process.cwd(), 'scripts/seeds/data/fields-of-study.json');
  const data = JSON.parse(readFileSync(file, 'utf-8')) as FieldSeed[];

  const rows = data.map((f) => ({
    name_en: f.name_en,
    name_fr: f.name_fr ?? null,
    category: f.category ?? null,
    is_canonical: true,
  }));

  const { inserted, skipped } = await seedCanonicalTable(admin, 'civis_fields_of_study', rows);

  console.log(`\nTotal fields of study processed: ${rows.length}`);
  console.log(`Inserted: ${inserted}, Skipped (existing): ${skipped}`);

  await writeSeedAudit(admin, 'civis_fields_of_study', inserted, skipped);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
