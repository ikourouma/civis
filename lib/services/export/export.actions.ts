'use server';

import { exportRegistrantsCSV, type CsvResult, type ExportFilters, type ExportPrivacy } from './export.service';
import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function exportRegistrantsCSVAction(
  filters: ExportFilters,
  privacy: ExportPrivacy,
): Promise<CsvResult> {
  return exportRegistrantsCSV(filters, privacy);
}

export interface ExportHistoryEntry {
  type: string;
  rowCount: number;
  createdAt: string;
}

// Recent exports by the current user (from the audit trail).
export async function getExportHistory(): Promise<ExportHistoryEntry[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from('audit_logs')
    .select('metadata, created_at')
    .eq('action', 'DATA_EXPORTED')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return ((data as { metadata: Record<string, unknown>; created_at: string }[]) ?? []).map((a) => ({
    type: String(a.metadata?.export_type ?? 'csv'),
    rowCount: Number(a.metadata?.row_count ?? 0),
    createdAt: a.created_at,
  }));
}
