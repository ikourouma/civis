// Tier entitlement upgrade/downgrade (Mission 006-D, Deliverable 2).
import { CAPABILITY_CATALOG, type CapabilityCode, type PlatformRoleExcludingSuperAdmin } from '@/lib/entitlements/capabilities';
import { getTierCapabilities, TIER_TEMPLATE_ROLES, type DeploymentTier } from '@/lib/entitlements/tier-templates';
import { getEffectiveEntitlements, reconcileEntitlements } from './entitlement.service';
import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export interface TierChangeSet {
  role: string;
  capabilities: string[];
}

export interface TierUpgradePreview {
  added: TierChangeSet[];
  removed: TierChangeSet[];
  totalChanges: number;
}

const CONFIGURABLE = CAPABILITY_CATALOG.filter((c) => c.isConfigurable).map((c) => c.code);
const NAME_BY_CODE = new Map(CAPABILITY_CATALOG.map((c) => [c.code, c.nameEn] as const));

export function capabilityName(code: CapabilityCode): string {
  return NAME_BY_CODE.get(code) ?? code;
}

// Diff the tenant's current effective entitlements against a target tier template.
export async function previewTierUpgrade(
  tenantId: string,
  _currentTier: DeploymentTier,
  targetTier: DeploymentTier,
): Promise<TierUpgradePreview> {
  const added: TierChangeSet[] = [];
  const removed: TierChangeSet[] = [];

  for (const role of TIER_TEMPLATE_ROLES) {
    const target = new Set(getTierCapabilities(targetTier, role));
    const effective = await getEffectiveEntitlements(tenantId, role);
    const currentEnabled = new Set(effective.filter((e) => e.isEnabled).map((e) => e.code));

    const addedCaps = Array.from(target).filter((c) => !currentEnabled.has(c)).map((c) => capabilityName(c));
    const removedCaps = Array.from(currentEnabled).filter((c) => !target.has(c) && CONFIGURABLE.includes(c)).map((c) => capabilityName(c));

    if (addedCaps.length) added.push({ role, capabilities: addedCaps });
    if (removedCaps.length) removed.push({ role, capabilities: removedCaps });
  }

  const totalChanges =
    added.reduce((n, r) => n + r.capabilities.length, 0) +
    removed.reduce((n, r) => n + r.capabilities.length, 0);

  return { added, removed, totalChanges };
}

// Set every configurable capability per role to match the tier template.
export async function applyTierEntitlements(
  tenantId: string,
  tier: DeploymentTier,
): Promise<{ success: boolean; applied: number; error?: string }> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return { success: false, applied: 0, error: 'Unauthorized' };

  let applied = 0;
  for (const role of TIER_TEMPLATE_ROLES) {
    const target = new Set(getTierCapabilities(tier, role));
    const desired = CONFIGURABLE.map((code) => ({ code, isEnabled: target.has(code) }));
    const res = await reconcileEntitlements(tenantId, role, desired);
    if (!res.success) return { success: false, applied, error: res.error };
    applied += res.changed;
  }

  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: 'super_admin',
    action: 'TIER_ENTITLEMENTS_APPLIED',
    resource: 'civis_tenants',
    resource_id: tenantId,
    metadata: { tier, applied },
  });

  return { success: true, applied };
}
