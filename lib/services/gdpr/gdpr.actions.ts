'use server';

import { revalidatePath } from 'next/cache';

import { checkCapability } from '@/lib/entitlements/guards';
import { getCurrentUser } from '@/lib/services/auth';
import { withdrawConsent } from '@/lib/services/consent/consent.service';
import { getMyRegistrantRecord } from '@/lib/services/registrants';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  completeGDPRRequest,
  denyGDPRRequest,
  processGDPRCorrection,
  processGDPRDeletion,
  processGDPRExport,
  submitGDPRRequest,
  type GDPRRequestType,
} from './gdpr.service';

type Result = { success: boolean; error?: string };

// ── Citizen side ──────────────────────────────

async function currentRegistrant() {
  const user = await getCurrentUser();
  if (!user) return { user: null, registrant: null };
  const registrant = await getMyRegistrantRecord(user.id);
  return { user, registrant };
}

const CITIZEN_CAP: Record<GDPRRequestType, 'GDPR_REQUEST_EXPORT' | 'GDPR_REQUEST_CORRECTION' | 'GDPR_REQUEST_DELETION'> = {
  data_export: 'GDPR_REQUEST_EXPORT',
  data_correction: 'GDPR_REQUEST_CORRECTION',
  data_deletion: 'GDPR_REQUEST_DELETION',
};

export async function submitMyGDPRRequestAction(
  type: GDPRRequestType,
  details?: string,
  correctionFields?: Record<string, { current: string; requested: string }>,
): Promise<Result & { deadline?: string }> {
  const { user, registrant } = await currentRegistrant();
  if (!user || !registrant) return { success: false, error: 'No registrant record found.' };
  const cap = await checkCapability(CITIZEN_CAP[type]);
  if (!cap.allowed) return { success: false, error: cap.error };

  const { requestId, deadline, error } = await submitGDPRRequest(
    registrant.id,
    registrant.tenantId,
    type,
    user.id,
    details,
    correctionFields,
  );
  if (!requestId) return { success: false, error: error ?? 'Could not submit request.' };
  revalidatePath('/portal/privacy');
  return { success: true, deadline: deadline ?? undefined };
}

export async function withdrawMyConsentAction(reason: string): Promise<Result> {
  const { user, registrant } = await currentRegistrant();
  if (!user || !registrant) return { success: false, error: 'No registrant record found.' };
  const cap = await checkCapability('GDPR_VIEW_CONSENT');
  if (!cap.allowed) return { success: false, error: cap.error };
  if (!registrant.consentRecordId) return { success: false, error: 'No consent record on file.' };

  const { error } = await withdrawConsent(registrant.consentRecordId, reason || 'Withdrawn by citizen', user.id);
  if (error) return { success: false, error };

  // Deactivate the registration.
  const admin = createAdminClient();
  await admin
    .from('civis_registrants')
    .update({ registration_status: 'inactive' })
    .eq('id', registrant.id);

  revalidatePath('/portal/privacy');
  return { success: true };
}

// ── Tenant-admin side ─────────────────────────

async function requireProcessor(): Promise<{ ok: boolean; user?: Awaited<ReturnType<typeof getCurrentUser>>; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Unauthorized' };
  const cap = await checkCapability('GDPR_PROCESS_REQUESTS');
  if (user.role !== 'super_admin' && !cap.allowed) return { ok: false, error: cap.error };
  return { ok: true, user };
}

export async function processExportAction(
  requestId: string,
): Promise<Result & { json?: string; filename?: string }> {
  const { ok, user, error } = await requireProcessor();
  if (!ok || !user) return { success: false, error };
  const res = await processGDPRExport(requestId, user.id, user.role);
  if (res.error) return { success: false, error: res.error };
  revalidatePath('/workspace/gdpr');
  return { success: true, json: res.json ?? undefined, filename: res.filename };
}

export async function processCorrectionAction(
  requestId: string,
  corrections: Record<string, string>,
): Promise<Result> {
  const { ok, user, error } = await requireProcessor();
  if (!ok || !user) return { success: false, error };
  const res = await processGDPRCorrection(requestId, corrections, user.id, user.role);
  if (res.success) revalidatePath('/workspace/gdpr');
  return res;
}

export async function processDeletionAction(
  requestId: string,
): Promise<Result & { deletedItems?: string[] }> {
  const { ok, user, error } = await requireProcessor();
  if (!ok || !user) return { success: false, error };
  const res = await processGDPRDeletion(requestId, user.id, user.role);
  if (res.success) revalidatePath('/workspace/gdpr');
  return res;
}

export async function denyRequestAction(requestId: string, reason: string): Promise<Result> {
  const { ok, user, error } = await requireProcessor();
  if (!ok || !user) return { success: false, error };
  if (!reason.trim()) return { success: false, error: 'A reason is required.' };
  const res = await denyGDPRRequest(requestId, reason, user.id, user.role);
  if (res.success) revalidatePath('/workspace/gdpr');
  return res;
}

export async function completeRequestAction(requestId: string): Promise<Result> {
  const { ok, user, error } = await requireProcessor();
  if (!ok || !user) return { success: false, error };
  const res = await completeGDPRRequest(requestId, user.id, user.role);
  if (res.success) revalidatePath('/workspace/gdpr');
  return res;
}
