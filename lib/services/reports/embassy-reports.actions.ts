'use server';

import { getCurrentUser } from '@/lib/services/auth';
import { getMyEmbassy } from '@/lib/services/embassies';
import { createAdminClient } from '@/lib/supabase/admin';

export type EmbassyReportType =
  | 'registration_summary'
  | 'registration_trends'
  | 'pending_cases'
  | 'staff_activity';

type Result = { csv?: string; filename?: string; error?: string };

function toCsv(header: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [header.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

export async function generateEmbassyReportAction(type: EmbassyReportType): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };
  const embassy = await getMyEmbassy();
  if (!embassy) return { error: 'No embassy assigned.' };

  const admin = createAdminClient();

  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'DATA_EXPORTED',
    resource: 'embassy_report',
    metadata: { report_type: type, embassy_id: embassy.id },
  });

  if (type === 'registration_summary' || type === 'pending_cases') {
    let q = admin
      .from('civis_registrants')
      .select('first_name, last_name, email, country_of_residence, registration_status, verification_status, profile_completeness_score, created_at')
      .eq('embassy_id', embassy.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (type === 'pending_cases') q = q.eq('verification_status', 'pending_review');
    const { data } = await q;
    const rows = ((data as {
      first_name: string; last_name: string; email: string | null; country_of_residence: string;
      registration_status: string; verification_status: string; profile_completeness_score: number; created_at: string;
    }[]) ?? []).map((r) => [
      `${r.first_name} ${r.last_name}`, r.email ?? '', r.country_of_residence, r.registration_status,
      r.verification_status, r.profile_completeness_score, new Date(r.created_at).toISOString().slice(0, 10),
    ]);
    return {
      csv: toCsv(['Name', 'Email', 'Country', 'Registration Status', 'Verification', 'Completeness %', 'Registered'], rows),
      filename: `${type}-${embassy.id}.csv`,
    };
  }

  if (type === 'registration_trends') {
    const { data } = await admin
      .from('civis_registrants')
      .select('created_at')
      .eq('embassy_id', embassy.id)
      .is('deleted_at', null);
    const byMonth = new Map<string, number>();
    for (const r of (data as { created_at: string }[]) ?? []) {
      const m = new Date(r.created_at).toISOString().slice(0, 7);
      byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
    }
    const rows = Array.from(byMonth.entries()).sort().map(([m, c]) => [m, c]);
    return { csv: toCsv(['Month', 'Registrations'], rows), filename: `registration-trends-${embassy.id}.csv` };
  }

  // staff_activity
  const { data: staff } = await admin
    .from('civis_embassy_staff')
    .select('user_id')
    .eq('embassy_id', embassy.id)
    .eq('is_active', true);
  const ids = ((staff as { user_id: string }[]) ?? []).map((s) => s.user_id);
  if (ids.length === 0) return { csv: toCsv(['Timestamp', 'User', 'Action'], []), filename: `staff-activity-${embassy.id}.csv` };

  const { data: logs } = await admin
    .from('audit_logs')
    .select('user_email, action, created_at')
    .in('user_id', ids)
    .order('created_at', { ascending: false })
    .limit(1000);
  const rows = ((logs as { user_email: string | null; action: string; created_at: string }[]) ?? []).map((l) => [
    new Date(l.created_at).toISOString(), l.user_email ?? '', l.action,
  ]);
  return { csv: toCsv(['Timestamp', 'User', 'Action'], rows), filename: `staff-activity-${embassy.id}.csv` };
}
