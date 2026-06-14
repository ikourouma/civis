// Country reference data — read-only, browser-client safe.
// civis_countries is RLS-readable by all authenticated users.
import { createClient } from '@/lib/supabase/client';

export interface Country {
  id: string;
  isoAlpha2: string;
  isoAlpha3: string;
  isoNumeric: string;
  name: string; // localized (en or fr)
  nameEn: string;
  nameFr: string;
  officialName: string | null;
  flagEmoji: string;
  phoneCode: string;
  continent: string | null;
  region: string | null;
  isAUMember: boolean;
}

interface CountryRow {
  id: string;
  iso_code_alpha2: string;
  iso_code_alpha3: string;
  iso_numeric: string;
  country_name_en: string;
  country_name_fr: string;
  official_name_en: string | null;
  flag_emoji: string;
  phone_country_code: string;
  continent: string | null;
  region: string | null;
  is_au_member: boolean;
}

function mapCountry(row: CountryRow, locale: 'en' | 'fr'): Country {
  return {
    id: row.id,
    isoAlpha2: row.iso_code_alpha2,
    isoAlpha3: row.iso_code_alpha3,
    isoNumeric: row.iso_numeric,
    name: locale === 'fr' ? row.country_name_fr : row.country_name_en,
    nameEn: row.country_name_en,
    nameFr: row.country_name_fr,
    officialName: row.official_name_en,
    flagEmoji: row.flag_emoji,
    phoneCode: row.phone_country_code,
    continent: row.continent,
    region: row.region,
    isAUMember: row.is_au_member,
  };
}

const SELECT =
  'id, iso_code_alpha2, iso_code_alpha3, iso_numeric, country_name_en, country_name_fr, official_name_en, flag_emoji, phone_country_code, continent, region, is_au_member';

// Module-level cache — countries rarely change within a session.
let cache: { en?: Country[]; fr?: Country[] } = {};

export async function getAllCountries(locale: 'en' | 'fr' = 'en'): Promise<Country[]> {
  if (cache[locale]) return cache[locale]!;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('civis_countries')
    .select(SELECT)
    .eq('is_active', true)
    .order('country_name_en');

  if (error || !data) return [];

  const mapped = (data as CountryRow[]).map((r) => mapCountry(r, locale));
  cache[locale] = mapped;
  return mapped;
}

export async function getCountryByCode(code: string, locale: 'en' | 'fr' = 'en'): Promise<Country | null> {
  const all = cache[locale] ?? (await getAllCountries(locale));
  return all.find((c) => c.isoAlpha2 === code.toUpperCase()) ?? null;
}

export async function getAUMemberStates(locale: 'en' | 'fr' = 'en'): Promise<Country[]> {
  const all = await getAllCountries(locale);
  return all.filter((c) => c.isAUMember);
}

export async function getCountriesByContinent(
  continent: string,
  locale: 'en' | 'fr' = 'en',
): Promise<Country[]> {
  const all = await getAllCountries(locale);
  return all.filter((c) => c.continent === continent);
}

// Sort AU members first (alphabetical within each group). Used by CountrySelector.
export function sortAUFirst(countries: Country[]): Country[] {
  const au = countries.filter((c) => c.isAUMember).sort((a, b) => a.name.localeCompare(b.name));
  const rest = countries.filter((c) => !c.isAUMember).sort((a, b) => a.name.localeCompare(b.name));
  return [...au, ...rest];
}

export function clearCountryCache(): void {
  cache = {};
}
