'use server';

import { revalidatePath } from 'next/cache';

import {
  copyEntitlementsFromTenant,
  getEffectiveEntitlements,
  reconcileEntitlements,
  resetToDefaults,
  type EffectiveEntitlement,
} from './entitlement.service';
import type { CapabilityCode } from '@/lib/entitlements/capabilities';
import { getCurrentUser } from '@/lib/services/auth';
import type { PlatformRole } from '@/lib/services/auth/auth.types';

async function superAdmin() {
  const user = await getCurrentUser();
  return user && user.role === 'super_admin' ? user : null;
}

// Effective entitlements for an arbitrary tenant+role (super-admin only).
export async function getEffectiveEntitlementsAction(
  tenantId: string,
  role: PlatformRole,
): Promise<EffectiveEntitlement[]> {
  if (!(await superAdmin())) return [];
  return getEffectiveEntitlements(tenantId, role);
}

export async function saveEntitlementsAction(
  tenantId: string,
  role: PlatformRole,
  entitlements: { code: CapabilityCode; isEnabled: boolean }[],
): Promise<{ success: boolean; changed: number; error?: string }> {
  const res = await reconcileEntitlements(tenantId, role, entitlements);
  if (res.success) revalidatePath('/admin/entitlements');
  return res;
}

export async function resetEntitlementsAction(
  tenantId: string,
  role: PlatformRole,
): Promise<{ success: boolean; removed: number; error?: string }> {
  const res = await resetToDefaults(tenantId, role);
  if (res.success) revalidatePath('/admin/entitlements');
  return res;
}

export async function copyEntitlementsAction(
  sourceTenantId: string,
  targetTenantId: string,
): Promise<{ success: boolean; copied: number; error?: string }> {
  const res = await copyEntitlementsFromTenant(sourceTenantId, targetTenantId);
  if (res.success) revalidatePath('/admin/entitlements');
  return res;
}
