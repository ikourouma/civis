'use server';

// Registrant document + profile photo uploads. Uses the admin client (the private
// registrant-documents bucket path is keyed by registrant_id, not auth.uid, so
// browser-client RLS would not match). Every caller is verified as the owner.
import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'registrant-documents';

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

type DocumentType =
  | 'passport'
  | 'national_id'
  | 'birth_certificate'
  | 'proof_of_residence'
  | 'visa'
  | 'other';

async function ownedRegistrant(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_registrants')
    .select('id, tenant_id, profile_id')
    .eq('profile_id', userId)
    .maybeSingle();
  return data as { id: string; tenant_id: string; profile_id: string } | null;
}

export async function getSignedDocUrl(path: string): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function uploadProfilePhoto(
  formData: FormData,
): Promise<{ path?: string; signedUrl?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const registrant = await ownedRegistrant(user.id);
  if (!registrant) return { error: 'No registrant record found.' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'No file provided' };
  if (file.size > 5 * 1024 * 1024) return { error: 'Image must be 5MB or smaller.' };

  const ext = EXT_BY_MIME[file.type] ?? 'png';
  const path = `${registrant.tenant_id}/${registrant.id}/profile/photo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (upErr) return { error: upErr.message };

  await admin.from('civis_registrants').update({ profile_photo_url: path }).eq('id', registrant.id);

  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: 'registrant',
    action: 'PROFILE_PHOTO_UPLOADED',
    resource: 'civis_registrants',
    resource_id: registrant.id,
  });

  const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(path, 3600);
  revalidatePath('/portal/profile/complete');
  revalidatePath('/portal/dashboard');
  return { path, signedUrl: signed?.signedUrl };
}

export async function uploadRegistrantDocument(
  formData: FormData,
): Promise<{ id?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  const registrant = await ownedRegistrant(user.id);
  if (!registrant) return { error: 'No registrant record found.' };

  const docType = String(formData.get('documentType') ?? 'other') as DocumentType;
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'No file provided' };
  if (file.size > 10 * 1024 * 1024) return { error: 'File must be 10MB or smaller.' };

  const ext = EXT_BY_MIME[file.type];
  if (!ext) return { error: 'Unsupported file type. Use PDF, JPEG, or PNG.' };

  const path = `${registrant.tenant_id}/${registrant.id}/${docType}_${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (upErr) return { error: upErr.message };

  const { data: doc, error: insErr } = await admin
    .from('civis_registrant_documents')
    .insert({
      tenant_id: registrant.tenant_id,
      registrant_id: registrant.id,
      document_type: docType,
      storage_path: path,
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      status: 'uploaded',
    })
    .select('id')
    .single();

  if (insErr || !doc) return { error: insErr?.message ?? 'Failed to record document.' };

  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: 'registrant',
    action: 'DOCUMENT_UPLOADED',
    resource: 'civis_registrant_documents',
    resource_id: doc.id,
    metadata: { document_type: docType },
  });

  revalidatePath('/portal/profile/complete');
  revalidatePath('/portal/documents');
  return { id: doc.id };
}

// Lightweight completeness lookup for the registrant sidebar badge.
export async function getMyCompleteness(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 100;
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_registrants')
    .select('profile_completeness_score')
    .eq('profile_id', user.id)
    .maybeSingle();
  return (data?.profile_completeness_score as number | undefined) ?? 100;
}

export async function getMyDocumentCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  const registrant = await ownedRegistrant(user.id);
  if (!registrant) return 0;
  const admin = createAdminClient();
  const { count } = await admin
    .from('civis_registrant_documents')
    .select('id', { count: 'exact', head: true })
    .eq('registrant_id', registrant.id);
  return count ?? 0;
}
