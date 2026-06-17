// Entitlement resolution + super-admin management.
// Effective entitlement = tenant override if present, else catalog default.
// super_admin is always fully entitled (bypass).
import {
  CAPABILITY_CATALOG,
  type CapabilityCode,
  type CapabilityDomain,
  type PlatformRoleExcludingSuperAdmin,
} from '@/lib/entitlements/capabilities';
import { getCurrentUser } from '@/lib/services/auth';
import type { PlatformRole } from '@/lib/services/auth/auth.types';
import { createAdminClient } from '@/lib/supabase/admin';

export interface EffectiveEntitlement {
  code: CapabilityCode;
  isEnabled: boolean;
  source: 'default' | 'override';
  domain: CapabilityDomain;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  isPremium: boolean;
  isConfigurable: boolean;
  defaultValue: boolean;
}

const ALL_CODES = CAPABILITY_CATALOG.map((c) => c.code);

async function loadOverrides(
  tenantId: string,
  role: PlatformRole,
): Promise<Map<string, boolean>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_tenant_entitlements')
    .select('capability_code, is_enabled')
    .eq('tenant_id', tenantId)
    .eq('role', role);
  const map = new Map<string, boolean>();
  for (const r of (data as { capability_code: string; is_enabled: boolean }[]) ?? []) {
    map.set(r.capability_code, r.is_enabled);
  }
  return map;
}

export async function getEffectiveEntitlements(
  tenantId: string,
  role: PlatformRole,
): Promise<EffectiveEntitlement[]> {
  // super_admin: everything enabled, all defaults.
  if (role === 'super_admin') {
    return CAPABILITY_CATALOG.map((c) => ({
      code: c.code, isEnabled: true, source: 'default' as const, domain: c.domain,
      nameEn: c.nameEn, nameFr: c.nameFr, descriptionEn: c.descriptionEn, descriptionFr: c.descriptionFr,
      isPremium: c.isPremium, isConfigurable: c.isConfigurable, defaultValue: true,
    }));
  }

  const overrides = await loadOverrides(tenantId, role);
  const r = role as PlatformRoleExcludingSuperAdmin;

  return CAPABILITY_CATALOG.map((c) => {
    const def = c.defaults[r] ?? false;
    const hasOverride = overrides.has(c.code);
    const enabled = hasOverride ? overrides.get(c.code)! : def;
    return {
      code: c.code, isEnabled: enabled, source: hasOverride ? 'override' : 'default',
      domain: c.domain, nameEn: c.nameEn, nameFr: c.nameFr,
      descriptionEn: c.descriptionEn, descriptionFr: c.descriptionFr,
      isPremium: c.isPremium, isConfigurable: c.isConfigurable, defaultValue: def,
    };
  });
}

export async function hasCapability(
  tenantId: string,
  role: PlatformRole,
  capability: CapabilityCode,
): Promise<boolean> {
  if (role === 'super_admin') return true;
  const overrides = await loadOverrides(tenantId, role);
  if (overrides.has(capability)) return overrides.get(capability)!;
  const cap = CAPABILITY_CATALOG.find((c) => c.code === capability);
  return cap ? cap.defaults[role as PlatformRoleExcludingSuperAdmin] ?? false : false;
}

// All enabled capability codes for a user (drives the client EntitlementProvider).
export async function getUserCapabilities(userId: string): Promise<CapabilityCode[]> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return [];
  const role = profile.role as PlatformRole;
  if (role === 'super_admin') return ALL_CODES;
  if (!profile.tenant_id) return [];

  const effective = await getEffectiveEntitlements(profile.tenant_id as string, role);
  return effective.filter((e) => e.isEnabled).map((e) => e.code);
}

// ============================================================
// Super-admin management (guarded internally)
// ============================================================

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return null;
  return user;
}

export async function getTenantEntitlementOverrides(
  tenantId: string,
): Promise<{ role: PlatformRole; code: CapabilityCode; isEnabled: boolean; notes?: string }[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_tenant_entitlements')
    .select('role, capability_code, is_enabled, notes')
    .eq('tenant_id', tenantId);
  return ((data as { role: PlatformRole; capability_code: string; is_enabled: boolean; notes: string | null }[]) ?? []).map((r) => ({
    role: r.role,
    code: r.capability_code as CapabilityCode,
    isEnabled: r.is_enabled,
    notes: r.notes ?? undefined,
  }));
}

export async function setTenantEntitlement(
  tenantId: string,
  role: PlatformRole,
  capability: CapabilityCode,
  isEnabled: boolean,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();
  const { data: prev } = await admin
    .from('civis_tenant_entitlements')
    .select('is_enabled')
    .eq('tenant_id', tenantId).eq('role', role).eq('capability_code', capability)
    .maybeSingle();

  await admin.from('audit_logs').insert({
    user_id: actor.id, user_role: 'super_admin', action: 'ENTITLEMENT_CHANGED',
    resource: 'civis_tenant_entitlements',
    metadata: { tenant: tenantId, role, capability, old_value: prev?.is_enabled ?? null, new_value: isEnabled, changed_by: actor.email },
  });

  const { error } = await admin.from('civis_tenant_entitlements').upsert(
    { tenant_id: tenantId, role, capability_code: capability, is_enabled: isEnabled, configured_by: actor.id, configured_at: new Date().toISOString(), notes: notes ?? null },
    { onConflict: 'tenant_id,role,capability_code' },
  );
  return { success: !error, error: error?.message };
}

export async function bulkSetEntitlements(
  tenantId: string,
  role: PlatformRole,
  entitlements: { code: CapabilityCode; isEnabled: boolean }[],
): Promise<{ success: boolean; changed: number; error?: string }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { success: false, changed: 0, error: 'Unauthorized' };
  if (entitlements.length === 0) return { success: true, changed: 0 };

  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actor.id, user_role: 'super_admin', action: 'ENTITLEMENTS_BULK_CHANGED',
    resource: 'civis_tenant_entitlements',
    metadata: { tenant: tenantId, role, changes: entitlements, changed_by: actor.email },
  });

  const rows = entitlements.map((e) => ({
    tenant_id: tenantId, role, capability_code: e.code, is_enabled: e.isEnabled,
    configured_by: actor.id, configured_at: new Date().toISOString(),
  }));
  const { error } = await admin
    .from('civis_tenant_entitlements')
    .upsert(rows, { onConflict: 'tenant_id,role,capability_code' });
  return { success: !error, changed: error ? 0 : rows.length, error: error?.message };
}

// Reconcile a role's full desired toggle state: capabilities matching the catalog
// default have their override removed; capabilities differing get an override row.
export async function reconcileEntitlements(
  tenantId: string,
  role: PlatformRole,
  desired: { code: CapabilityCode; isEnabled: boolean }[],
): Promise<{ success: boolean; changed: number; error?: string }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { success: false, changed: 0, error: 'Unauthorized' };
  if (role === 'super_admin') return { success: true, changed: 0 };

  const r = role as PlatformRoleExcludingSuperAdmin;
  const toUpsert: { code: CapabilityCode; isEnabled: boolean }[] = [];
  const toDelete: CapabilityCode[] = [];

  for (const d of desired) {
    const cap = CAPABILITY_CATALOG.find((c) => c.code === d.code);
    if (!cap) continue;
    const def = cap.defaults[r] ?? false;
    if (d.isEnabled === def) toDelete.push(d.code);
    else toUpsert.push(d);
  }

  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actor.id, user_role: 'super_admin', action: 'ENTITLEMENTS_BULK_CHANGED',
    resource: 'civis_tenant_entitlements',
    metadata: { tenant: tenantId, role, overrides: toUpsert, reverted: toDelete, changed_by: actor.email },
  });

  if (toDelete.length > 0) {
    await admin.from('civis_tenant_entitlements')
      .delete().eq('tenant_id', tenantId).eq('role', role).in('capability_code', toDelete);
  }
  if (toUpsert.length > 0) {
    const rows = toUpsert.map((e) => ({
      tenant_id: tenantId, role, capability_code: e.code, is_enabled: e.isEnabled,
      configured_by: actor.id, configured_at: new Date().toISOString(),
    }));
    const { error } = await admin.from('civis_tenant_entitlements')
      .upsert(rows, { onConflict: 'tenant_id,role,capability_code' });
    if (error) return { success: false, changed: 0, error: error.message };
  }
  return { success: true, changed: toUpsert.length + toDelete.length };
}

export async function resetToDefaults(
  tenantId: string,
  role: PlatformRole,
): Promise<{ success: boolean; removed: number; error?: string }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { success: false, removed: 0, error: 'Unauthorized' };

  const admin = createAdminClient();
  const { count } = await admin
    .from('civis_tenant_entitlements')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId).eq('role', role);

  await admin.from('audit_logs').insert({
    user_id: actor.id, user_role: 'super_admin', action: 'ENTITLEMENTS_RESET_TO_DEFAULT',
    resource: 'civis_tenant_entitlements',
    metadata: { tenant: tenantId, role, removed_count: count ?? 0, reset_by: actor.email },
  });

  const { error } = await admin
    .from('civis_tenant_entitlements')
    .delete().eq('tenant_id', tenantId).eq('role', role);
  return { success: !error, removed: count ?? 0, error: error?.message };
}

export async function copyEntitlementsFromTenant(
  sourceTenantId: string,
  targetTenantId: string,
): Promise<{ success: boolean; copied: number; error?: string }> {
  const actor = await requireSuperAdmin();
  if (!actor) return { success: false, copied: 0, error: 'Unauthorized' };

  const admin = createAdminClient();
  const { data: source } = await admin
    .from('civis_tenant_entitlements')
    .select('role, capability_code, is_enabled, notes')
    .eq('tenant_id', sourceTenantId);

  const rows = ((source as { role: string; capability_code: string; is_enabled: boolean; notes: string | null }[]) ?? []).map((r) => ({
    tenant_id: targetTenantId, role: r.role, capability_code: r.capability_code,
    is_enabled: r.is_enabled, notes: r.notes, configured_by: actor.id, configured_at: new Date().toISOString(),
  }));

  await admin.from('audit_logs').insert({
    user_id: actor.id, user_role: 'super_admin', action: 'ENTITLEMENTS_COPIED',
    resource: 'civis_tenant_entitlements',
    metadata: { source_tenant: sourceTenantId, target_tenant: targetTenantId, copied_count: rows.length, copied_by: actor.email },
  });

  if (rows.length === 0) return { success: true, copied: 0 };
  const { error } = await admin
    .from('civis_tenant_entitlements')
    .upsert(rows, { onConflict: 'tenant_id,role,capability_code' });
  return { success: !error, copied: error ? 0 : rows.length, error: error?.message };
}
