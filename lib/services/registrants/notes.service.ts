// Internal case notes on a registrant (Mission 006-B).
import { createAdminClient } from '@/lib/supabase/admin';

export interface RegistrantNote {
  id: string;
  registrantId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  noteText: string;
  createdAt: string;
}

interface NoteRow {
  id: string;
  registrant_id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  note_text: string;
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
    createdAt: row.created_at,
  };
}

// Chronological notes feed (newest first).
export async function getRegistrantNotes(registrantId: string): Promise<RegistrantNote[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_registrant_notes')
    .select('id, registrant_id, author_id, author_name, author_role, note_text, created_at')
    .eq('registrant_id', registrantId)
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
    })
    .select('id, registrant_id, author_id, author_name, author_role, note_text, created_at')
    .single();

  if (error || !data) return { note: null, error: error?.message ?? 'Failed to add note.' };
  return { note: mapNote(data as NoteRow), error: null };
}
