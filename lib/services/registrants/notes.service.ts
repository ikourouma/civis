// Internal case notes on a registrant (Mission 006-B).
import { createAdminClient } from '@/lib/supabase/admin';

export type NoteType = 'general' | 'follow_up' | 'verification' | 'gdpr';

export interface RegistrantNote {
  id: string;
  registrantId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  noteText: string;
  noteType: string;
  isPinned: boolean;
  editedAt: string | null;
  createdAt: string;
}

interface NoteRow {
  id: string;
  registrant_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  note_text: string;
  note_type: string;
  is_pinned: boolean;
  edited_at: string | null;
  created_at: string;
}

function mapNote(row: NoteRow): RegistrantNote {
  return {
    id: row.id,
    registrantId: row.registrant_id,
    authorId: row.author_id,
    authorName: row.author_name,
    authorRole: row.author_role,
    noteText: row.note_text,
    noteType: row.note_type ?? 'general',
    isPinned: row.is_pinned ?? false,
    editedAt: row.edited_at,
    createdAt: row.created_at,
  };
}

const NOTE_COLUMNS = 'id, registrant_id, author_id, author_name, author_role, note_text, note_type, is_pinned, edited_at, created_at';

// Notes feed — pinned first, then newest; archived notes excluded.
export async function getRegistrantNotes(registrantId: string): Promise<RegistrantNote[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_registrant_notes')
    .select(NOTE_COLUMNS)
    .eq('registrant_id', registrantId)
    .eq('is_archived', false)
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  return ((data as NoteRow[]) ?? []).map(mapNote);
}

// Add an internal note. Resolves the registrant's tenant and audit-logs.
export async function addRegistrantNote(
  registrantId: string,
  noteText: string,
  authorId: string,
  authorName: string,
  authorRole: string,
  noteType: string = 'general',
): Promise<{ note: RegistrantNote | null; error: string | null }> {
  const admin = createAdminClient();

  const { data: registrant } = await admin
    .from('civis_registrants')
    .select('tenant_id')
    .eq('id', registrantId)
    .maybeSingle();
  if (!registrant) return { note: null, error: 'Registrant not found.' };

  await admin.from('audit_logs').insert({
    user_id: authorId,
    user_role: authorRole,
    action: 'REGISTRANT_NOTE_ADDED',
    resource: 'civis_registrants',
    resource_id: registrantId,
    metadata: { note_type: noteType },
  });

  const { data, error } = await admin
    .from('civis_registrant_notes')
    .insert({
      tenant_id: (registrant as { tenant_id: string }).tenant_id,
      registrant_id: registrantId,
      author_id: authorId,
      author_name: authorName,
      author_role: authorRole,
      note_text: noteText,
      note_type: noteType,
    })
    .select(NOTE_COLUMNS)
    .single();

  if (error || !data) return { note: null, error: error?.message ?? 'Failed to add note.' };
  return { note: mapNote(data as NoteRow), error: null };
}

// Edit a note — author only, within 24h of creation.
export async function editRegistrantNote(
  noteId: string,
  noteText: string,
  actorId: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { data: note } = await admin
    .from('civis_registrant_notes')
    .select('author_id, created_at')
    .eq('id', noteId)
    .maybeSingle();
  if (!note) return { error: 'Note not found.' };
  const row = note as { author_id: string; created_at: string };
  if (row.author_id !== actorId) return { error: 'You can only edit your own notes.' };
  if (Date.now() - new Date(row.created_at).getTime() > 24 * 3.6e6) {
    return { error: 'Notes can only be edited within 24 hours of creation.' };
  }
  const { error } = await admin
    .from('civis_registrant_notes')
    .update({ note_text: noteText, edited_at: new Date().toISOString() })
    .eq('id', noteId);
  return { error: error?.message ?? null };
}

export async function setNotePinned(noteId: string, pinned: boolean): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin.from('civis_registrant_notes').update({ is_pinned: pinned }).eq('id', noteId);
  return { error: error?.message ?? null };
}

// Archive (soft-hide) a note — never hard-deleted (audit-trail preservation).
export async function archiveNote(noteId: string): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { error } = await admin.from('civis_registrant_notes').update({ is_archived: true }).eq('id', noteId);
  return { error: error?.message ?? null };
}
