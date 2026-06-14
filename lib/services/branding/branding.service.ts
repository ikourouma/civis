// Country branding reads + URL resolution. Server-safe (uses the RLS server client).
// Branding is readable by all authenticated users; mutations live in branding.actions.ts.
import { createClient } from '@/lib/supabase/server';

export interface CountryBrand {
  id: string;
  countryCode: string;
  displayName: { en: string; fr: string };
  officialName: { en?: string; fr?: string };
  motto?: { en?: string; fr?: string };
  palette: {
    primary: string;
    secondary: string;
    accent?: string;
    neutralDark: string;
    neutralLight: string;
    surface: {
      50?: string;
      100?: string;
      500?: string;
      700?: string;
      900?: string;
    };
  };
  typography: { display: string; body: string };
  assets: { flagUrl?: string; sealUrl?: string; lockupUrl?: string };
  locale: {
    defaultLanguage: string;
    supportedLanguages: string[];
    currencyCode?: string;
    timeZone?: string;
  };
  brandSource: 'bridge55' | 'liberia_asset' | 'manual';
  brandVersion: string;
}

interface BrandingRow {
  id: string;
  country_code: string;
  display_name_en: string;
  display_name_fr: string;
  official_name_en: string | null;
  official_name_fr: string | null;
  motto_en: string | null;
  motto_fr: string | null;
  brand_primary: string;
  brand_secondary: string;
  brand_accent: string | null;
  brand_neutral_dark: string;
  brand_neutral_light: string;
  surface_primary_50: string | null;
  surface_primary_100: string | null;
  surface_primary_500: string | null;
  surface_primary_700: string | null;
  surface_primary_900: string | null;
  font_display: string;
  font_body: string;
  flag_asset_path: string | null;
  seal_asset_path: string | null;
  lockup_asset_path: string | null;
  default_language: string;
  supported_languages: string[];
  currency_code: string | null;
  time_zone: string | null;
  brand_source: CountryBrand['brandSource'];
  brand_version: string;
}

// Stored asset paths already include the bucket prefix (e.g. 'brand-assets/lr/seal.svg').
// Public bucket objects are served at /storage/v1/object/public/{path}.
export function assetUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return undefined;
  return `${base}/storage/v1/object/public/${path}`;
}

function mapBrand(row: BrandingRow): CountryBrand {
  return {
    id: row.id,
    countryCode: row.country_code,
    displayName: { en: row.display_name_en, fr: row.display_name_fr },
    officialName: { en: row.official_name_en ?? undefined, fr: row.official_name_fr ?? undefined },
    motto:
      row.motto_en || row.motto_fr
        ? { en: row.motto_en ?? undefined, fr: row.motto_fr ?? undefined }
        : undefined,
    palette: {
      primary: row.brand_primary,
      secondary: row.brand_secondary,
      accent: row.brand_accent ?? undefined,
      neutralDark: row.brand_neutral_dark,
      neutralLight: row.brand_neutral_light,
      surface: {
        50: row.surface_primary_50 ?? undefined,
        100: row.surface_primary_100 ?? undefined,
        500: row.surface_primary_500 ?? undefined,
        700: row.surface_primary_700 ?? undefined,
        900: row.surface_primary_900 ?? undefined,
      },
    },
    typography: { display: row.font_display, body: row.font_body },
    assets: {
      flagUrl: assetUrl(row.flag_asset_path),
      sealUrl: assetUrl(row.seal_asset_path),
      lockupUrl: assetUrl(row.lockup_asset_path),
    },
    locale: {
      defaultLanguage: row.default_language,
      supportedLanguages: row.supported_languages,
      currencyCode: row.currency_code ?? undefined,
      timeZone: row.time_zone ?? undefined,
    },
    brandSource: row.brand_source,
    brandVersion: row.brand_version,
  };
}

const SELECT = '*';

export async function getBrandByCountry(countryCode: string): Promise<CountryBrand | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('civis_country_branding')
    .select(SELECT)
    .eq('country_code', countryCode.toUpperCase())
    .maybeSingle();
  if (error || !data) return null;
  return mapBrand(data as BrandingRow);
}

export async function getBrandById(brandId: string): Promise<CountryBrand | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('civis_country_branding')
    .select(SELECT)
    .eq('id', brandId)
    .maybeSingle();
  if (error || !data) return null;
  return mapBrand(data as BrandingRow);
}

export async function getAllBrands(): Promise<CountryBrand[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('civis_country_branding')
    .select(SELECT)
    .eq('is_active', true)
    .order('country_code');
  if (error || !data) return [];
  return (data as BrandingRow[]).map(mapBrand);
}

// Resolve a tenant's brand via its branding_id; falls back to the AF platform brand.
export async function getTenantBrand(tenantId: string): Promise<CountryBrand | null> {
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from('civis_tenants')
    .select('branding_id, country_code')
    .eq('id', tenantId)
    .maybeSingle();

  if (tenant?.branding_id) {
    const byId = await getBrandById(tenant.branding_id as string);
    if (byId) return byId;
  }
  if (tenant?.country_code) {
    const byCountry = await getBrandByCountry(tenant.country_code as string);
    if (byCountry) return byCountry;
  }
  return getBrandByCountry('AF');
}

export async function getDefaultBrand(): Promise<CountryBrand | null> {
  return getBrandByCountry('AF');
}
