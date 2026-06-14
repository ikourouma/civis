// Upload brand assets to the Supabase `brand-assets` bucket.
//  - Liberia coat of arms (public/coatofarmsofliberia.svg) -> lr/seal.svg
//  - Generated flags for CI, GH, LR (country-flag-icons)    -> {cc}/flag.svg
// Idempotent: uploads use upsert, so re-running overwrites rather than duplicates.
// Run: npx tsx scripts/branding/migrate-assets.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as Flags3x2 from 'country-flag-icons/string/3x2';

import { seedClient } from '../seeds/_client';

const BUCKET = 'brand-assets';
const FLAG_COUNTRIES = ['CI', 'GH', 'LR'] as const;

async function uploadSvg(
  admin: ReturnType<typeof seedClient>,
  path: string,
  svg: string | Buffer,
): Promise<boolean> {
  const body = typeof svg === 'string' ? Buffer.from(svg, 'utf-8') : svg;
  const { error } = await admin.storage.from(BUCKET).upload(path, body, {
    contentType: 'image/svg+xml',
    upsert: true,
  });
  if (error) {
    console.error(`  ! ${path}: ${error.message}`);
    return false;
  }
  console.log(`  + ${path}`);
  return true;
}

async function main() {
  const admin = seedClient();
  console.log('Uploading brand assets...\n');

  const flags = Flags3x2 as unknown as Record<string, string>;

  // Flags for CI, GH, LR
  for (const cc of FLAG_COUNTRIES) {
    const svg = flags[cc];
    if (!svg) {
      console.warn(`  ! No flag SVG available for ${cc}`);
      continue;
    }
    await uploadSvg(admin, `${cc.toLowerCase()}/flag.svg`, svg);
  }

  // Liberia coat of arms (real asset)
  const sealPath = resolve(process.cwd(), 'public/coatofarmsofliberia.svg');
  try {
    const seal = readFileSync(sealPath);
    await uploadSvg(admin, 'lr/seal.svg', seal);
  } catch (err) {
    console.error(`  ! Could not read Liberia seal at ${sealPath}:`, err);
  }

  console.log('\nAsset migration complete.');
  console.log('Storage paths:');
  console.log('  brand-assets/ci/flag.svg');
  console.log('  brand-assets/gh/flag.svg');
  console.log('  brand-assets/lr/flag.svg');
  console.log('  brand-assets/lr/seal.svg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
