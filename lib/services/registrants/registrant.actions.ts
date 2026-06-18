'use server';

import { revalidatePath } from 'next/cache';

import { checkCapability } from '@/lib/entitlements/guards';
import { getCurrentUser } from '@/lib/services/auth';
import {
  approveRegistrant,
  flagDuplicate,
  rejectRegistrant,
  staffUpdateSection,
  type StaffEditSection,
  type StaffSectionInput,
} from './registrant.service';
import { addRegistrantNote } from './notes.service';
import { createAdminClient } from '@/lib/supabase/admin';

type Result = { success: boolean; error?: string };

export async function approveRegistrantDetailAction(id: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  const cap = await checkCapability('REGISTRANT_APPROVE');
  if (!cap.allowed) return { success: false, error: cap.error };
  const { error } = await approveRegistrant(id, user.id, user.role);
  if (!error) revalidatePath(`/workspace/registrant/${id}`);
  return { success: !error, error: error ?? undefined };
}

export async function rejectRegistrantDetailAction(id: string, reason: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  if (!reason.trim()) return { success: false, error: 'A reason is required.' };
  const cap = await checkCapability('REGISTRANT_REJECT');
  if (!cap.allowed) return { success: false, error: cap.error };
  const { error } = await rejectRegistrant(id, reason, user.id, user.role);
  if (!error) revalidatePath(`/workspace/registrant/${id}`);
  return { success: !error, error: error ?? undefined };
}

const SECTION_CAPABILITY = {
  personal: 'REGISTRANT_EDIT_IDENTITY',
  contact: 'REGISTRANT_EDIT_CONTACT',
  professional: 'REGISTRANT_EDIT_PROFESSIONAL',
} as const;

export async function updateRegistrantSectionAction(
  id: string,
  section: StaffEditSection,
  input: StaffSectionInput,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  const cap = await checkCapability(SECTION_CAPABILITY[section]);
  if (!cap.allowed) return { success: false, error: cap.error };
  const { error } = await staffUpdateSection(id, section, input, user.id, user.role);
  if (!error) revalidatePath(`/workspace/registrant/${id}`);
  return { success: !error, error: error ?? undefined };
}

export async function flagDuplicateAction(id: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  const cap = await checkCapability('REGISTRANT_FLAG_DUPLICATE');
  if (!cap.allowed) return { success: false, error: cap.error };
  const { error } = await flagDuplicate(id, user.id, user.role);
  if (!error) revalidatePath(`/workspace/registrant/${id}`);
  return { success: !error, error: error ?? undefined };
}

export async function addNoteAction(registrantId: string, noteText: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  if (!noteText.trim()) return { success: false, error: 'Note cannot be empty.' };
  const cap = await checkCapability('REGISTRANT_ADD_NOTES');
  if (!cap.allowed) return { success: false, error: cap.error };
  const { error } = await addRegistrantNote(
    registrantId,
    noteText.trim(),
    user.id,
    user.fullName ?? user.email,
    user.role,
  );
  if (!error) revalidatePath(`/workspace/registrant/${registrantId}`);
  return { success: !error, error: error ?? undefined };
}

// Review (approve / reject) an uploaded document.
export async function reviewDocumentAction(
  documentId: string,
  registrantId: string,
  decision: 'verified' | 'rejected',
  notes?: string,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };
  const cap = await checkCapability('REGISTRANT_VIEW_DOCUMENTS');
  if (!cap.allowed) return { success: false, error: cap.error };

  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'DOCUMENT_REVIEWED',
    resource: 'civis_registrant_documents',
    resource_id: documentId,
    metadata: { decision, registrant_id: registrantId },
  });

  const { error } = await admin
    .from('civis_registrant_documents')
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_notes: decision === 'rejected' ? (notes ?? null) : null,
    })
    .eq('id', documentId);

  if (!error) revalidatePath(`/workspace/registrant/${registrantId}`);
  return { success: !error, error: error?.message };
}
