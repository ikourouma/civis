'use server';

import { getCurrentUser } from '@/lib/services/auth';
import { getAllBrands } from '@/lib/services/branding';
import {
  createTenant,
  createTenantWithAdmin,
  getAssignableUsers,
  setTenantStatus,
  updateTenant,
} from '@/lib/services/tenants';
import type { TenantStatus, UpdateTenantInput } from '@/lib/services/tenants';

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

// Country defaults for the Create Tenant auto-fill (D11).
export async function getCountryDefaultsAction(code: string): Promise<{
  officialName: string | null;
  region: string | null;
  currencyCode: string | null;
  defaultLanguage: string;
  dataResidencyRegion: string;
} | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return null;
  if (!code || code.length !== 2) return null;
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_countries')
    .select('official_name_en, country_name_en, region, currency_code')
    .eq('iso_code_alpha2', code.toUpperCase())
    .maybeSingle();
  if (!data) return null;
  const row = data as { official_name_en: string | null; country_name_en: string; region: string | null; currency_code: string | null };

  const region = row.region ?? null;
  // Infer data residency + language from region.
  let dataResidency = 'eu-west-1';
  if (region) {
    if (/Southern Africa/i.test(region)) dataResidency = 'af-south-1';
    else if (/East Africa/i.test(region)) dataResidency = 'eu-central-1';
    else if (/North Africa/i.test(region)) dataResidency = 'eu-south-1';
  }
  const francophone = region ? /(West|Central) Africa/i.test(region) : false;

  return {
    officialName: row.official_name_en ?? row.country_name_en,
    region,
    currencyCode: row.currency_code,
    defaultLanguage: francophone ? 'fr' : 'en',
    dataResidencyRegion: dataResidency,
  };
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

export async function updateTenantAction(
  tenantId: string,
  input: UpdateTenantInput,
): Promise<CreateTenantActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return { ok: false, error: 'Unauthorized' };
  const { error } = await updateTenant(tenantId, input, user.id);
  return { ok: !error, error };
}
