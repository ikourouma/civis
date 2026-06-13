'use server';

import { createTenant } from '@/lib/services/tenants';
import { getCurrentUser } from '@/lib/services/auth';

export interface CreateTenantActionResult {
  ok: boolean;
  error: string | null;
}

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
