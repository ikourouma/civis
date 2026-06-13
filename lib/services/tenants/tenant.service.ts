import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type DeploymentTier = 'cloud' | 'government' | 'sovereign';
export type TenantStatus = 'active' | 'pilot' | 'suspended' | 'archived';

export interface CivisTenant {
  id: string;
  name: string;
  countryCode: string;
  officialCountryName: string | null;
  region: string | null;
  deploymentTier: DeploymentTier;
  status: TenantStatus;
  defaultLanguage: string;
  supportedLanguages: string[];
  dataResidencyRegion: string;
  logoUrl: string | null;
  createdAt: string;
}

export interface CreateTenantInput {
  name: string;
  countryCode: string;
  officialCountryName?: string;
  region?: string;
  deploymentTier: DeploymentTier;
  defaultLanguage: string;
  dataResidencyRegion: string;
  primaryContactEmail?: string;
  contractStartDate?: string;
}

export interface PlatformStats {
  totalTenants: number;
  totalUsers: number;
  activeTenants: number;
  pilotTenants: number;
}

interface TenantRow {
  id: string;
  name: string;
  country_code: string;
  official_country_name: string | null;
  region: string | null;
  deployment_tier: DeploymentTier;
  status: TenantStatus;
  default_language: string;
  supported_languages: string[];
  data_residency_region: string;
  logo_url: string | null;
  created_at: string;
}

function mapTenant(data: TenantRow): CivisTenant {
  return {
    id: data.id,
    name: data.name,
    countryCode: data.country_code,
    officialCountryName: data.official_country_name,
    region: data.region,
    deploymentTier: data.deployment_tier,
    status: data.status,
    defaultLanguage: data.default_language,
    supportedLanguages: data.supported_languages,
    dataResidencyRegion: data.data_residency_region,
    logoUrl: data.logo_url,
    createdAt: data.created_at,
  };
}

// Current user's tenant (RLS scopes to their own row).
export async function getCurrentTenant(): Promise<CivisTenant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('civis_tenants')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapTenant(data as TenantRow);
}

// All tenants — super_admin sees all rows via RLS; others see their own.
export async function getAllTenants(): Promise<CivisTenant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('civis_tenants')
    .select('*')
    .order('name');

  if (error || !data) return [];
  return (data as TenantRow[]).map(mapTenant);
}

// Platform-wide counts — super_admin only. Uses admin client to bypass RLS
// for the count queries; the caller must check role before invoking.
export async function getPlatformStats(): Promise<PlatformStats> {
  const admin = createAdminClient();

  const [tenantsRes, usersRes, activeRes, pilotRes] = await Promise.all([
    admin.from('civis_tenants').select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('civis_tenants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('civis_tenants').select('id', { count: 'exact', head: true }).eq('status', 'pilot'),
  ]);

  return {
    totalTenants: tenantsRes.count ?? 0,
    totalUsers: usersRes.count ?? 0,
    activeTenants: activeRes.count ?? 0,
    pilotTenants: pilotRes.count ?? 0,
  };
}

// Tenant count per tenant (for admin table) — super_admin only.
export async function getTenantsWithUserCounts(): Promise<(CivisTenant & { userCount: number })[]> {
  const admin = createAdminClient();

  const { data: tenants } = await admin.from('civis_tenants').select('*').order('name');
  if (!tenants) return [];

  const results = await Promise.all(
    (tenants as TenantRow[]).map(async (t) => {
      const { count } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', t.id);
      return { ...mapTenant(t), userCount: count ?? 0 };
    }),
  );

  return results;
}

export interface CreateTenantResult {
  tenant: CivisTenant | null;
  error: string | null;
}

export async function createTenant(input: CreateTenantInput): Promise<CreateTenantResult> {
  const admin = createAdminClient();

  const supported = Array.from(new Set([input.defaultLanguage, 'en']));

  const { data, error } = await admin
    .from('civis_tenants')
    .insert({
      name: input.name,
      country_code: input.countryCode.toUpperCase(),
      official_country_name: input.officialCountryName ?? null,
      region: input.region ?? null,
      deployment_tier: input.deploymentTier,
      default_language: input.defaultLanguage,
      supported_languages: supported,
      data_residency_region: input.dataResidencyRegion,
      primary_contact_email: input.primaryContactEmail ?? null,
      contract_start_date: input.contractStartDate ?? null,
      status: 'pilot',
    })
    .select()
    .single();

  if (error || !data) {
    return { tenant: null, error: error?.message ?? 'Failed to create tenant' };
  }

  // Default settings row
  await admin.from('civis_tenant_settings').insert({ tenant_id: data.id });

  // Audit log
  await admin.from('audit_logs').insert({
    user_role: 'super_admin',
    action: 'TENANT_CREATED',
    resource: 'civis_tenants',
    resource_id: data.id,
    metadata: { name: input.name, country_code: input.countryCode, mission: 'Mission-003' },
  });

  return { tenant: mapTenant(data as TenantRow), error: null };
}
