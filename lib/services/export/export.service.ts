// Policy-grade CSV export of diaspora registry data. Privacy-controlled,
// tenant/embassy scoped, and audit-logged (sovereign compliance requirement).
import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ExportFilters {
  status?: string[];
  countries?: string[];
  dateFrom?: string;
  dateTo?: string;
  minCompleteness?: number;
}

export interface ExportPrivacy {
  includeNames: boolean;
  includeEmail: boolean;
  includePhone: boolean;
}

export interface CsvResult {
  csv: string;
  filename: string;
  rowCount: number;
  error?: string;
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportRegistrantsCSV(
  filters: ExportFilters,
  privacy: ExportPrivacy,
): Promise<CsvResult> {
  const user = await getCurrentUser();
  if (!user?.tenantId) return { csv: '', filename: '', rowCount: 0, error: 'Unauthorized' };

  // Phone is a privileged field — only tenant_admin/super_admin may include it.
  const allowPhone = privacy.includePhone && ['tenant_admin', 'super_admin'].includes(user.role);

  const admin = createAdminClient();
  let q = admin
    .from('civis_registrants')
    .select(
      'id, first_name, last_name, email, phone_primary, nationality, country_of_residence, city_of_residence, occupation, education_level, generation, registration_status, verification_status, profile_completeness_score, created_at',
    )
    .eq('tenant_id', user.tenantId);

  if (user.embassyIds[0]) q = q.eq('embassy_id', user.embassyIds[0]);
  if (filters.status && filters.status.length > 0) q = q.in('registration_status', filters.status);
  if (filters.countries && filters.countries.length > 0) q = q.in('country_of_residence', filters.countries);
  if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom);
  if (filters.dateTo) q = q.lte('created_at', filters.dateTo);
  if (filters.minCompleteness) q = q.gte('profile_completeness_score', filters.minCompleteness);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) return { csv: '', filename: '', rowCount: 0, error: error.message };

  const rows = (data as Record<string, unknown>[]) ?? [];

  const headers = ['ID'];
  if (privacy.includeNames) headers.push('First Name', 'Last Name');
  if (privacy.includeEmail) headers.push('Email');
  if (allowPhone) headers.push('Phone');
  headers.push('Nationality', 'Country of Residence', 'City', 'Occupation', 'Education', 'Generation', 'Registration Status', 'Verification Status', 'Completeness', 'Registered Date');

  const lines = [headers.join(',')];
  for (const r of rows) {
    const cells: unknown[] = [r.id];
    if (privacy.includeNames) cells.push(r.first_name, r.last_name);
    if (privacy.includeEmail) cells.push(r.email);
    if (allowPhone) cells.push(r.phone_primary);
    cells.push(
      r.nationality, r.country_of_residence, r.city_of_residence, r.occupation, r.education_level,
      r.generation, r.registration_status, r.verification_status, r.profile_completeness_score,
      r.created_at ? String(r.created_at).split('T')[0] : '',
    );
    lines.push(cells.map(csvCell).join(','));
  }

  const filename = `civis-registry-export-${new Date().toISOString().split('T')[0]}.csv`;

  // Audit (sovereign compliance — every export is traceable)
  await admin.from('audit_logs').insert({
    user_id: user.id,
    user_role: user.role,
    action: 'DATA_EXPORTED',
    resource: 'civis_registrants',
    metadata: {
      export_type: 'csv',
      row_count: rows.length,
      filters_applied: filters,
      privacy: { names: privacy.includeNames, email: privacy.includeEmail, phone: allowPhone },
      exported_by: user.email,
    },
  });

  return { csv: lines.join('\n'), filename, rowCount: rows.length };
}
