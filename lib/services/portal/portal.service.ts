// Country-branded portal configuration (Mission 006-D, Deliverable 1).
import { getBrandingRules, type TierBrandingRules } from '@/lib/branding/tier-rules';
import { getTenantBrand, type CountryBrand } from '@/lib/services/branding';
import type { DeploymentTier } from '@/lib/services/tenants';
import { createAdminClient } from '@/lib/supabase/admin';

export interface PortalTenant {
  id: string;
  name: string;
  countryCode: string;
  officialName: string | null;
  deploymentTier: DeploymentTier;
  defaultLanguage: string;
  supportedLanguages: string[];
}

export interface PortalConfig {
  tenant: PortalTenant;
  brand: CountryBrand | null;
  tier: DeploymentTier;
  brandingRules: TierBrandingRules;
  registrationEnabled: boolean;
  supportedLanguages: string[];
}

// Resolve everything the branded portal needs from a country code (e.g. "lr").
// Returns null only if the tenant doesn't exist or is suspended/archived/deleted —
// active AND pilot tenants are live.
export async function getPortalConfig(tenantCode: string): Promise<PortalConfig | null> {
  const code = tenantCode.toUpperCase();
  const admin = createAdminClient();

  const { data } = await admin
    .from('civis_tenants')
    .select('id, name, country_code, official_country_name, deployment_tier, default_language, supported_languages, status, deleted_at')
    .eq('country_code', code)
    .maybeSingle();

  if (!data) return null;
  const row = data as {
    id: string; name: string; country_code: string; official_country_name: string | null;
    deployment_tier: DeploymentTier; default_language: string; supported_languages: string[];
    status: string; deleted_at: string | null;
  };

  // Only suspended / archived (or soft-deleted) tenants are "not active".
  if (row.deleted_at || ['suspended', 'archived'].includes(row.status)) return null;

  const brand = await getTenantBrand(row.id);
  const tier = row.deployment_tier;

  return {
    tenant: {
      id: row.id,
      name: row.name,
      countryCode: row.country_code,
      officialName: row.official_country_name,
      deploymentTier: tier,
      defaultLanguage: row.default_language,
      supportedLanguages: row.supported_languages ?? ['en'],
    },
    brand,
    tier,
    brandingRules: getBrandingRules(tier),
    registrationEnabled: true,
    supportedLanguages: row.supported_languages ?? ['en'],
  };
}
