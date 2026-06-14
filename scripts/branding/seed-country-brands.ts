// Seed civis_country_branding with three reference brands + the platform brand.
//   CI, GH  -> from Bridge55 extracted themes (scripts/branding/data/bridge55-themes.json)
//   LR      -> Liberian flag colors + real coat of arms asset
//   AF      -> Afronovation platform brand (Civis navy/gold)
// Then links any tenant with a matching country_code to its brand.
// Run (after extract + migrate-assets): npx tsx scripts/branding/seed-country-brands.ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { generateSurfaceScale } from '../../lib/branding/colors';
import { seedClient, writeSeedAudit } from '../seeds/_client';
import type { Bridge55Theme } from './extract-bridge55-themes';

interface BrandSeed {
  country_code: string;
  display_name_en: string;
  display_name_fr: string;
  official_name_en?: string;
  official_name_fr?: string;
  motto_en?: string;
  motto_fr?: string;
  brand_primary: string;
  brand_secondary: string;
  brand_accent?: string;
  flag_asset_path?: string;
  seal_asset_path?: string;
  default_language: string;
  supported_languages: string[];
  currency_code?: string;
  time_zone?: string;
  brand_source: 'bridge55' | 'liberia_asset' | 'manual';
  brand_version: string;
}

function loadBridge55(): Record<string, Bridge55Theme> {
  const file = resolve(process.cwd(), 'scripts/branding/data/bridge55-themes.json');
  const arr = JSON.parse(readFileSync(file, 'utf-8')) as Bridge55Theme[];
  return Object.fromEntries(arr.map((t) => [t.countryCode, t]));
}

function buildSeeds(): BrandSeed[] {
  const b55 = loadBridge55();
  const ci = b55['CI'];
  const gh = b55['GH'];
  if (!ci || !gh) {
    throw new Error('Bridge55 themes for CI/GH missing — run extract-bridge55-themes.ts first.');
  }

  return [
    {
      country_code: 'CI',
      display_name_en: "Côte d'Ivoire",
      display_name_fr: "Côte d'Ivoire",
      official_name_en: "Republic of Côte d'Ivoire",
      official_name_fr: "République de Côte d'Ivoire",
      brand_primary: ci.primary,
      brand_secondary: ci.secondary ?? '#00954A',
      brand_accent: ci.accent ?? '#FFFFFF',
      flag_asset_path: 'brand-assets/ci/flag.svg',
      default_language: 'fr',
      supported_languages: ['fr', 'en'],
      currency_code: 'XOF',
      time_zone: 'Africa/Abidjan',
      brand_source: 'bridge55',
      brand_version: '1.0',
    },
    {
      country_code: 'GH',
      display_name_en: 'Ghana',
      display_name_fr: 'Ghana',
      official_name_en: 'Republic of Ghana',
      official_name_fr: 'République du Ghana',
      brand_primary: gh.primary,
      brand_secondary: gh.secondary ?? '#FCD116',
      brand_accent: gh.accent ?? '#006B3F',
      flag_asset_path: 'brand-assets/gh/flag.svg',
      default_language: 'en',
      supported_languages: ['en'],
      currency_code: 'GHS',
      time_zone: 'Africa/Accra',
      brand_source: 'bridge55',
      brand_version: '1.0',
    },
    {
      country_code: 'LR',
      display_name_en: 'Liberia',
      display_name_fr: 'Libéria',
      official_name_en: 'Republic of Liberia',
      official_name_fr: 'République du Libéria',
      motto_en: 'The Love of Liberty Brought Us Here',
      motto_fr: "L'amour de la liberté nous a amenés ici",
      brand_primary: '#BF0A30', // Liberian flag red
      brand_secondary: '#002868', // Liberian flag blue
      brand_accent: '#FFFFFF', // Liberian flag white
      flag_asset_path: 'brand-assets/lr/flag.svg',
      seal_asset_path: 'brand-assets/lr/seal.svg',
      default_language: 'en',
      supported_languages: ['en'],
      currency_code: 'LRD',
      time_zone: 'Africa/Monrovia',
      brand_source: 'liberia_asset',
      brand_version: '1.0',
    },
    {
      country_code: 'AF', // Platform pseudo-code, matches the Afronovation tenant
      display_name_en: 'Afronovation',
      display_name_fr: 'Afronovation',
      official_name_en: 'Afronovation, Inc.',
      official_name_fr: 'Afronovation, Inc.',
      brand_primary: '#2A3F62', // Civis navy
      brand_secondary: '#C9A84C', // Civis gold
      brand_accent: '#0D1B2E',
      default_language: 'en',
      supported_languages: ['en', 'fr'],
      brand_source: 'manual',
      brand_version: '1.0',
    },
  ];
}

async function main() {
  const admin = seedClient();
  console.log('Seeding civis_country_branding...\n');

  const seeds = buildSeeds();

  const rows = seeds.map((s) => {
    const surface = generateSurfaceScale(s.brand_primary);
    return {
      country_code: s.country_code,
      display_name_en: s.display_name_en,
      display_name_fr: s.display_name_fr,
      official_name_en: s.official_name_en ?? null,
      official_name_fr: s.official_name_fr ?? null,
      motto_en: s.motto_en ?? null,
      motto_fr: s.motto_fr ?? null,
      brand_primary: s.brand_primary,
      brand_secondary: s.brand_secondary,
      brand_accent: s.brand_accent ?? null,
      brand_neutral_dark: '#0D1B2E',
      brand_neutral_light: '#EAF2FA',
      ...surface,
      flag_asset_path: s.flag_asset_path ?? null,
      seal_asset_path: s.seal_asset_path ?? null,
      default_language: s.default_language,
      supported_languages: s.supported_languages,
      currency_code: s.currency_code ?? null,
      time_zone: s.time_zone ?? null,
      brand_source: s.brand_source,
      brand_version: s.brand_version,
    };
  });

  const { error } = await admin
    .from('civis_country_branding')
    .upsert(rows, { onConflict: 'country_code', ignoreDuplicates: false });

  if (error) {
    console.error(`  ! Seed failed: ${error.message}`);
    process.exit(1);
  }
  console.log(`  + Upserted ${rows.length} brands: ${rows.map((r) => r.country_code).join(', ')}`);

  // Link tenants to their matching brand (idempotent).
  let linked = 0;
  for (const code of rows.map((r) => r.country_code)) {
    const { data: brand } = await admin
      .from('civis_country_branding')
      .select('id')
      .eq('country_code', code)
      .single();
    if (!brand) continue;

    const { error: linkErr, count } = await admin
      .from('civis_tenants')
      .update({ branding_id: brand.id }, { count: 'exact' })
      .eq('country_code', code);

    if (linkErr) {
      console.warn(`  ! Link ${code}: ${linkErr.message}`);
    } else if (count) {
      linked += count;
      console.log(`  ~ Linked ${count} tenant(s) with country_code=${code}`);
    }
  }

  console.log(`\nBrands seeded: ${rows.length}, tenants linked: ${linked}`);
  await writeSeedAudit(admin, 'civis_country_branding', rows.length, 0);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
