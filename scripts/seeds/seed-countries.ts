// Seed civis_countries with all ISO 3166-1 countries.
// Source: i18n-iso-countries (names EN/FR, alpha3, numeric) + libphonenumber-js (calling codes).
// Run: npx tsx scripts/seeds/seed-countries.ts
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import frLocale from 'i18n-iso-countries/langs/fr.json';
import { getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

import { seedClient, writeSeedAudit } from './_client';

countries.registerLocale(enLocale);
countries.registerLocale(frLocale);

// African Union member states (55) — ISO alpha-2.
const AU_MEMBERS = new Set([
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD',
  'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET',
  'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG',
  'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW',
  'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG',
  'TN', 'UG', 'ZM', 'ZW', 'EH',
]);

// Convert ISO alpha-2 to a flag emoji using Unicode regional indicators.
function flagEmoji(alpha2: string): string {
  const codePoints = alpha2
    .toUpperCase()
    .split('')
    .map((c) => 0x1f1e6 + (c.charCodeAt(0) - 'A'.charCodeAt(0)));
  return String.fromCodePoint(...codePoints);
}

function phoneCode(alpha2: string): string {
  try {
    return `+${getCountryCallingCode(alpha2 as CountryCode)}`;
  } catch {
    return '';
  }
}

async function main() {
  const admin = seedClient();
  console.log('Seeding civis_countries...\n');

  const enNames = countries.getNames('en');
  const frNames = countries.getNames('fr');
  const officialEn = countries.getNames('en', { select: 'official' });

  const rows = Object.keys(enNames)
    .filter((alpha2) => {
      const alpha3 = countries.alpha2ToAlpha3(alpha2);
      const numeric = countries.alpha2ToNumeric(alpha2);
      return !!alpha3 && !!numeric;
    })
    .map((alpha2) => {
      const isAU = AU_MEMBERS.has(alpha2);
      return {
        iso_code_alpha2: alpha2,
        iso_code_alpha3: countries.alpha2ToAlpha3(alpha2)!,
        iso_numeric: countries.alpha2ToNumeric(alpha2)!,
        country_name_en: enNames[alpha2]!,
        country_name_fr: frNames[alpha2] ?? enNames[alpha2]!,
        official_name_en: officialEn[alpha2] ?? null,
        flag_emoji: flagEmoji(alpha2),
        phone_country_code: phoneCode(alpha2),
        continent: isAU ? 'Africa' : null,
        is_au_member: isAU,
        is_active: true,
      };
    });

  let inserted = 0;
  let skipped = 0;

  // Upsert in chunks; ignore conflicts on iso_code_alpha2 for idempotency.
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error, count } = await admin
      .from('civis_countries')
      .upsert(chunk, { onConflict: 'iso_code_alpha2', ignoreDuplicates: true, count: 'exact' });

    if (error) {
      console.error(`  ! Chunk ${i / chunkSize + 1} failed: ${error.message}`);
      skipped += chunk.length;
    } else {
      const c = count ?? 0;
      inserted += c;
      skipped += chunk.length - c;
      console.log(`  + Chunk ${i / chunkSize + 1}: ${c} inserted`);
    }
  }

  const auCount = rows.filter((r) => r.is_au_member).length;
  console.log(`\nTotal countries processed: ${rows.length}`);
  console.log(`AU members flagged: ${auCount}`);
  console.log(`Inserted: ${inserted}, Skipped (existing): ${skipped}`);

  await writeSeedAudit(admin, 'civis_countries', inserted, skipped);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
