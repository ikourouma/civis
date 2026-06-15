'use server';

import { getCurrentUser } from '@/lib/services/auth';
import { getAllBrands } from '@/lib/services/branding';
import {
  createTenant,
  createTenantWithAdmin,
  getAssignableUsers,
  setTenantStatus,
} from '@/lib/services/tenants';
import type { TenantStatus } from '@/lib/services/tenants';

export interface CreateTenantActionResult {
  ok: boolean;
  error: string | null;
}

// Legacy simple create (kept for any callers); prefer createTenantWithAdminAction.
export async function createTenantAction(formData: FormData): Promise<CreateTenantActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') {
    return { ok: false, error: 'Unauthorized' };
  }

  const name = String(formData.get('name') ?? '').trim();
  const countryCode = String(formData.get('countryCode') ?? '').trim();
  const dataResidencyRegion = String(formData.get('dataResidencyRegion') ?? '').trim();
  const deploymentTier = String(formData.get('deploymentTier') ?? 'cloud') as
    | 'cloud'
    | 'government'
    | 'sovereign';
  const defaultLanguage = String(formData.get('defaultLanguage') ?? 'en');
  const region = String(formData.get('region') ?? '').trim() || undefined;
  const officialCountryName = String(formData.get('officialCountryName') ?? '').trim() || undefined;
  const primaryContactEmail = String(formData.get('primaryContactEmail') ?? '').trim() || undefined;

  if (!name || !countryCode || !dataResidencyRegion) {
    return { ok: false, error: 'Name, country code, and data residency region are required.' };
  }
  if (countryCode.length !== 2) {
    return { ok: false, error: 'Country code must be a 2-letter ISO code.' };
  }

  const { error } = await createTenant({
    name,
    countryCode,
    officialCountryName,
    region,
    deploymentTier,
    defaultLanguage,
    dataResidencyRegion,
    primaryContactEmail,
  });

  return { ok: !error, error };
}

export async function createTenantWithAdminAction(formData: FormData): Promise<CreateTenantActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') {
    return { ok: false, error: 'Unauthorized' };
  }

  const name = String(formData.get('name') ?? '').trim();
  const countryCode = String(formData.get('countryCode') ?? '').trim();
  const dataResidencyRegion = String(formData.get('dataResidencyRegion') ?? '').trim();
  const deploymentTier = String(formData.get('deploymentTier') ?? 'cloud') as
    | 'cloud'
    | 'government'
    | 'sovereign';
  const defaultLanguage = String(formData.get('defaultLanguage') ?? 'en');
  const region = String(formData.get('region') ?? '').trim() || undefined;
  const officialCountryName = String(formData.get('officialCountryName') ?? '').trim() || undefined;
  const primaryContactEmail = String(formData.get('primaryContactEmail') ?? '').trim() || undefined;
  const brandingId = String(formData.get('brandingId') ?? '').trim() || undefined;

  const adminMode = String(formData.get('adminMode') ?? 'provision_new') as
    | 'provision_new'
    | 'assign_existing';
  const adminEmail = String(formData.get('adminEmail') ?? '').trim() || undefined;
  const adminFullName = String(formData.get('adminFullName') ?? '').trim() || undefined;
  const existingUserId = String(formData.get('existingUserId') ?? '').trim() || undefined;
  const sendWelcomeEmail = formData.get('sendWelcomeEmail') === 'on';

  if (!name || !countryCode || !dataResidencyRegion) {
    return { ok: false, error: 'Name, country code, and data residency region are required.' };
  }
  if (countryCode.length !== 2) {
    return { ok: false, error: 'Country code must be a 2-letter ISO code.' };
  }
  if (adminMode === 'provision_new' && (!adminEmail || !adminFullName)) {
    return { ok: false, error: 'Tenant Admin email and name are required.' };
  }
  if (adminMode === 'assign_existing' && !existingUserId) {
    return { ok: false, error: 'Select an existing user to assign as Tenant Admin.' };
  }

  const { error } = await createTenantWithAdmin(
    {
      name,
      countryCode,
      officialCountryName,
      region,
      deploymentTier,
      defaultLanguage,
      dataResidencyRegion,
      primaryContactEmail,
      brandingId,
      adminMode,
      adminEmail,
      adminFullName,
      existingUserId,
      sendWelcomeEmail,
    },
    user.id,
  );

  return { ok: !error, error };
}

export async function listBrandsForSelectAction(): Promise<
  { id: string; countryCode: string; displayName: string; flag: string }[]
> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return [];
  const brands = await getAllBrands();
  return brands.map((b) => ({
    id: b.id,
    countryCode: b.countryCode,
    displayName: b.displayName.en,
    flag: b.assets.flagUrl ?? '',
  }));
}

export async function listAssignableUsersAction(): Promise<
  { id: string; email: string; fullName: string | null }[]
> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return [];
  return getAssignableUsers();
}

export async function setTenantStatusAction(
  tenantId: string,
  status: TenantStatus,
): Promise<CreateTenantActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return { ok: false, error: 'Unauthorized' };
  const { error } = await setTenantStatus(tenantId, status, user.id);
  return { ok: !error, error };
}
