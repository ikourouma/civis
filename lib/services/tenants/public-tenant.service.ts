// Public-facing tenant list for the registration entry point (pre-auth).
// Uses the admin client because civis_tenants RLS has no anonymous read path;
// only non-sensitive display fields are returned. Server-only.
import { createAdminClient } from '@/lib/supabase/admin';

export interface PublicTenant {
  id: string;
  countryCode: string;
  displayName: { en: string; fr: string };
  flagEmoji: string;
  supportedLanguages: string[];
  deploymentTier: string;
}

// ISO alpha-2 -> flag emoji (regional indicator pair).
function flagEmoji(alpha2: string): string {
  if (!/^[A-Za-z]{2}$/.test(alpha2)) return '🏳️';
  const cps = alpha2
    .toUpperCase()
    .split('')
    .map((c) => 0x1f1e6 + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...cps);
}

interface Row {
  id: string;
  country_code: string;
  name: string;
  supported_languages: string[];
  deployment_tier: string;
  civis_country_branding: { display_name_en: string; display_name_fr: string } | null;
}

export async function getPublicTenants(): Promise<PublicTenant[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('civis_tenants')
    .select(
      'id, country_code, name, supported_languages, deployment_tier, civis_country_branding(display_name_en, display_name_fr)',
    )
    .not('status', 'in', '("suspended","archived")') // active + pilot are selectable
    .is('deleted_at', null) // exclude soft-deleted tenants
    .neq('country_code', 'AF') // exclude the Afronovation platform tenant
    .order('name');

  if (error || !data) return [];

  return (data as unknown as Row[]).map((t) => ({
    id: t.id,
    countryCode: t.country_code,
    displayName: {
      en: t.civis_country_branding?.display_name_en ?? t.name,
      fr: t.civis_country_branding?.display_name_fr ?? t.name,
    },
    flagEmoji: flagEmoji(t.country_code),
    supportedLanguages: t.supported_languages ?? ['en'],
    deploymentTier: t.deployment_tier,
  }));
}

export async function getPublicTenantById(id: string): Promise<PublicTenant | null> {
  const all = await getPublicTenants();
  return all.find((t) => t.id === id) ?? null;
}
