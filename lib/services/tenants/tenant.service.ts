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

export interface TenantAdminView extends CivisTenant {
  userCount: number;
  embassyCount: number;
  adminName: string | null;
  adminEmail: string | null;
}

// Full management view for the super-admin tenants page.
export async function getTenantsAdminView(): Promise<TenantAdminView[]> {
  const admin = createAdminClient();
  const { data: tenants } = await admin.from('civis_tenants').select('*').order('name');
  if (!tenants) return [];

  return Promise.all(
    (tenants as TenantRow[]).map(async (t) => {
      const [usersRes, embassyRes, adminRes] = await Promise.all([
        admin.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id),
        admin.from('civis_embassies').select('id', { count: 'exact', head: true }).eq('tenant_id', t.id),
        admin
          .from('profiles')
          .select('full_name, email')
          .eq('tenant_id', t.id)
          .eq('role', 'tenant_admin')
          .limit(1)
          .maybeSingle(),
      ]);
      return {
        ...mapTenant(t),
        userCount: usersRes.count ?? 0,
        embassyCount: embassyRes.count ?? 0,
        adminName: (adminRes.data?.full_name as string | null) ?? null,
        adminEmail: (adminRes.data?.email as string | null) ?? null,
      };
    }),
  );
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

// ============================================================
// Mission 005-C — Create tenant + assign first Tenant Admin
// ============================================================

export interface CreateTenantWithAdminInput extends CreateTenantInput {
  adminMode: 'provision_new' | 'assign_existing';
  adminEmail?: string;
  adminFullName?: string;
  sendWelcomeEmail?: boolean;
  existingUserId?: string;
  brandingId?: string;
}

export interface CreateTenantWithAdminResult {
  tenant: CivisTenant | null;
  adminUser: { id: string; email: string } | null;
  error: string | null;
}

function tempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 18; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createTenantWithAdmin(
  input: CreateTenantWithAdminInput,
  actorId: string,
): Promise<CreateTenantWithAdminResult> {
  const admin = createAdminClient();
  const supported = Array.from(new Set([input.defaultLanguage, 'en']));

  // 1. Create the tenant (+ optional branding link)
  const { data: tenantRow, error: tenantError } = await admin
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
      primary_contact_email: input.primaryContactEmail ?? input.adminEmail ?? null,
      contract_start_date: input.contractStartDate ?? null,
      branding_id: input.brandingId ?? null,
      status: 'pilot',
    })
    .select()
    .single();

  if (tenantError || !tenantRow) {
    return { tenant: null, adminUser: null, error: tenantError?.message ?? 'Failed to create tenant' };
  }

  const tenantId = tenantRow.id as string;

  // 2. Default settings row
  await admin.from('civis_tenant_settings').insert({ tenant_id: tenantId });

  // 3. Resolve / provision the Tenant Admin
  let adminUser: { id: string; email: string } | null = null;
  let method: 'new_account' | 'existing_user' = 'existing_user';

  if (input.adminMode === 'provision_new') {
    if (!input.adminEmail || !input.adminFullName) {
      return { tenant: mapTenant(tenantRow as TenantRow), adminUser: null, error: 'Admin email and name are required.' };
    }
    method = 'new_account';
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: input.adminEmail,
      password: tempPassword(),
      email_confirm: true,
      user_metadata: { full_name: input.adminFullName, role: 'tenant_admin' },
    });
    if (authError || !authData?.user) {
      const msg = authError?.message?.toLowerCase().includes('already')
        ? 'A user with this email already exists. Use "Assign existing user" instead.'
        : authError?.message ?? 'Failed to create admin account.';
      return { tenant: mapTenant(tenantRow as TenantRow), adminUser: null, error: msg };
    }
    const userId = authData.user.id;
    await admin.from('profiles').upsert(
      { id: userId, email: input.adminEmail, full_name: input.adminFullName, role: 'tenant_admin', tenant_id: tenantId },
      { onConflict: 'id' },
    );
    adminUser = { id: userId, email: input.adminEmail };

    if (input.sendWelcomeEmail) {
      try {
        await admin.auth.resetPasswordForEmail(input.adminEmail);
      } catch {
        // Best-effort — depends on SMTP configuration; never blocks creation.
      }
    }
  } else {
    if (!input.existingUserId) {
      return { tenant: mapTenant(tenantRow as TenantRow), adminUser: null, error: 'Select an existing user to assign.' };
    }
    const { data: existing } = await admin
      .from('profiles')
      .select('id, email')
      .eq('id', input.existingUserId)
      .maybeSingle();
    if (!existing) {
      return { tenant: mapTenant(tenantRow as TenantRow), adminUser: null, error: 'Selected user not found.' };
    }
    await admin
      .from('profiles')
      .update({ role: 'tenant_admin', tenant_id: tenantId })
      .eq('id', input.existingUserId);
    adminUser = { id: existing.id as string, email: existing.email as string };
  }

  // 4. Audit
  await admin.from('audit_logs').insert([
    {
      user_id: actorId,
      user_role: 'super_admin',
      action: 'TENANT_CREATED_WITH_ADMIN',
      resource: 'civis_tenants',
      resource_id: tenantId,
      metadata: { tenant_name: input.name, country_code: input.countryCode, admin_email: adminUser?.email, admin_mode: input.adminMode },
    },
    {
      user_id: actorId,
      user_role: 'super_admin',
      action: 'TENANT_ADMIN_PROVISIONED',
      resource: 'profiles',
      resource_id: adminUser?.id,
      metadata: { tenant_id: tenantId, admin_email: adminUser?.email, method },
    },
  ]);

  return { tenant: mapTenant(tenantRow as TenantRow), adminUser, error: null };
}

// Promotable existing users for the "assign existing" admin flow —
// users who are not already a tenant_admin or super_admin.
export async function getAssignableUsers(): Promise<{ id: string; email: string; fullName: string | null }[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id, email, full_name, role')
    .not('role', 'in', '(super_admin,tenant_admin)')
    .order('email')
    .limit(100);
  return ((data as { id: string; email: string; full_name: string | null }[]) ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.full_name,
  }));
}

// Lifecycle management — super_admin only (caller checks role).
export async function setTenantStatus(
  tenantId: string,
  status: TenantStatus,
  actorId: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: 'super_admin',
    action: `TENANT_${status.toUpperCase()}`,
    resource: 'civis_tenants',
    resource_id: tenantId,
    metadata: { status },
  });
  const { error } = await admin.from('civis_tenants').update({ status }).eq('id', tenantId);
  return { error: error?.message ?? null };
}
