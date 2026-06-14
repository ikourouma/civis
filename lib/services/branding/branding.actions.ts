'use server';

// Country branding mutations — super-admin only. Admin (service-role) client,
// audit-before-success. Called from the branding admin panel (client component).
import { revalidatePath } from 'next/cache';

import { generateSurfaceScale } from '@/lib/branding/colors';
import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export interface BrandUpdateInput {
  displayNameEn?: string;
  displayNameFr?: string;
  officialNameEn?: string;
  officialNameFr?: string;
  mottoEn?: string;
  mottoFr?: string;
  brandPrimary?: string;
  brandSecondary?: string;
  brandAccent?: string;
  defaultLanguage?: string;
  supportedLanguages?: string[];
  currencyCode?: string;
  timeZone?: string;
}

const BUCKET = 'brand-assets';
const EXT_BY_TYPE: Record<string, string> = {
  'image/svg+xml': 'svg',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return null;
  return user;
}

export async function updateBrand(
  countryCode: string,
  updates: BrandUpdateInput,
): Promise<{ success: boolean; error?: string }> {
  const user = await requireSuperAdmin();
  if (!user) return { success: false, error: 'Unauthorized' };

  const admin = createAdminClient();
  const patch: Record<string, unknown> = {};

  if (updates.displayNameEn !== undefined) patch.display_name_en = updates.displayNameEn;
  if (updates.displayNameFr !== undefined) patch.display_name_fr = updates.displayNameFr;
  if (updates.officialNameEn !== undefined) patch.official_name_en = updates.officialNameEn;
  if (updates.officialNameFr !== undefined) patch.official_name_fr = updates.officialNameFr;
  if (updates.mottoEn !== undefined) patch.motto_en = updates.mottoEn;
  if (updates.mottoFr !== undefined) patch.motto_fr = updates.mottoFr;
  if (updates.brandPrimary !== undefined) patch.brand_primary = updates.brandPrimary;
  if (updates.brandSecondary !== undefined) patch.brand_secondary = updates.brandSecondary;
  if (updates.brandAccent !== undefined) patch.brand_accent = updates.brandAccent;
  if (updates.defaultLanguage !== undefined) patch.default_language = updates.defaultLanguage;
  if (updates.supportedLanguages !== undefined) patch.supported_languages = updates.supportedLanguages;
  if (updates.currencyCode !== undefined) patch.currency_code = updates.currencyCode;
  if (updates.timeZone !== undefined) patch.time_zone = updates.timeZone;

  // Recompute surface scale if the primary color changed.
  if (updates.brandPrimary) {
    Object.assign(patch, generateSurfaceScale(updates.brandPrimary));
  }

  if (Object.keys(patch).length === 0) return { success: true };

  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'BRANDING_UPDATED',
    resource: 'civis_country_branding',
    metadata: { country_code: countryCode.toUpperCase(), fields: Object.keys(patch) },
  });

  const { error } = await admin
    .from('civis_country_branding')
    .update(patch)
    .eq('country_code', countryCode.toUpperCase());

  if (error) return { success: false, error: error.message };

  revalidatePath('/admin/branding');
  return { success: true };
}

// Tenant admin submits a brand customization request. Recorded to the audit log
// (request fulfillment is a future mission). Returns success for UI confirmation.
export async function submitCustomizationRequest(
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  if (!['tenant_admin', 'super_admin'].includes(user.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }
  if (!message.trim()) return { success: false, error: 'A message is required' };

  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'BRANDING_CUSTOMIZATION_REQUESTED',
    resource: 'civis_country_branding',
    metadata: { tenant_id: user.tenantId, message: message.trim() },
  });

  return { success: true };
}

// Receives FormData: { countryCode, assetType, file }
export async function uploadBrandAsset(
  formData: FormData,
): Promise<{ path?: string; error?: string }> {
  const user = await requireSuperAdmin();
  if (!user) return { error: 'Unauthorized' };

  const countryCode = String(formData.get('countryCode') ?? '').toUpperCase();
  const assetType = String(formData.get('assetType') ?? '') as 'flag' | 'seal' | 'lockup';
  const file = formData.get('file');

  if (!countryCode || !['flag', 'seal', 'lockup'].includes(assetType)) {
    return { error: 'Invalid request' };
  }
  if (!(file instanceof File) || file.size === 0) return { error: 'No file provided' };

  const ext = EXT_BY_TYPE[file.type];
  if (!ext) return { error: 'Unsupported file type' };

  const admin = createAdminClient();
  const key = `${countryCode.toLowerCase()}/${assetType}.${ext}`;
  const fullPath = `${BUCKET}/${key}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(key, buffer, { contentType: file.type, upsert: true });
  if (upErr) return { error: upErr.message };

  const column =
    assetType === 'flag'
      ? 'flag_asset_path'
      : assetType === 'seal'
      ? 'seal_asset_path'
      : 'lockup_asset_path';

  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'BRANDING_ASSET_UPLOADED',
    resource: 'civis_country_branding',
    metadata: { country_code: countryCode, asset_type: assetType, path: fullPath },
  });

  const { error: updErr } = await admin
    .from('civis_country_branding')
    .update({ [column]: fullPath })
    .eq('country_code', countryCode);

  if (updErr) return { error: updErr.message };

  revalidatePath('/admin/branding');
  return { path: fullPath };
}
