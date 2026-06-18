// Audit trail querying (Mission 006-B). The audit_logs table has no tenant_id,
// so tenant scope is resolved by the actor's profile tenant — every staff and
// registrant action is attributable to a tenant through their profile.
import { createAdminClient } from '@/lib/supabase/admin';

export type AuditActionGroup =
  | 'registration'
  | 'staff'
  | 'embassy'
  | 'export'
  | 'entitlement'
  | 'system';

// Prefix patterns that classify an action code into a group.
const GROUP_PREFIXES: Record<AuditActionGroup, string[]> = {
  registration: ['REGISTRANT_', 'BASIC_REGISTRATION', 'PROFILE_', 'CONSENT_', 'DOCUMENT_', 'GDPR_'],
  staff: ['STAFF_', 'USER_'],
  embassy: ['EMBASSY_'],
  export: ['DATA_EXPORTED', 'AUDIT_EXPORTED', 'EXPORT_'],
  entitlement: ['ENTITLEMENT'],
  system: ['TENANT_', 'BRANDING', 'BRAND_', 'REFERENCE', 'PLATFORM_'],
};

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: string | null;
  userEmail: string;
  userRole: string;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  tenantId: string | null;
  tenantName: string | null;
}

export interface AuditFilters {
  dateFrom?: string;
  dateTo?: string;
  groups?: AuditActionGroup[];
  userEmail?: string;
  search?: string;
  tenantId?: string; // super-admin: filter to one tenant
}

export interface AuditScope {
  tenantId?: string; // tenant-admin: hard scope; super-admin: omit
}

interface AuditRow {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// Map tenantId → name, and user_id → { email, tenantId }.
async function buildLookups(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[],
): Promise<{
  profileById: Map<string, { email: string | null; tenantId: string | null }>;
  tenantNameById: Map<string, string>;
}> {
  const profileById = new Map<string, { email: string | null; tenantId: string | null }>();
  const tenantNameById = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email, tenant_id')
      .in('id', userIds);
    for (const p of (profiles as { id: string; email: string | null; tenant_id: string | null }[]) ?? []) {
      profileById.set(p.id, { email: p.email, tenantId: p.tenant_id });
    }
  }

  const { data: tenants } = await admin.from('civis_tenants').select('id, name');
  for (const t of (tenants as { id: string; name: string }[]) ?? []) {
    tenantNameById.set(t.id, t.name);
  }

  return { profileById, tenantNameById };
}

// Resolve the set of profile ids that belong to a tenant (for scoping).
async function tenantUserIds(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
): Promise<string[]> {
  const { data } = await admin.from('profiles').select('id').eq('tenant_id', tenantId);
  return ((data as { id: string }[]) ?? []).map((p) => p.id);
}

function mapEntry(
  row: AuditRow,
  profileById: Map<string, { email: string | null; tenantId: string | null }>,
  tenantNameById: Map<string, string>,
): AuditEntry {
  const profile = row.user_id ? profileById.get(row.user_id) : undefined;
  const tenantId = profile?.tenantId ?? null;
  return {
    id: row.id,
    timestamp: row.created_at,
    action: row.action,
    userId: row.user_id,
    userEmail: row.user_email ?? profile?.email ?? 'system',
    userRole: row.user_role ?? '—',
    resource: row.resource,
    resourceId: row.resource_id,
    metadata: row.metadata ?? {},
    ipAddress: row.ip_address,
    tenantId,
    tenantName: tenantId ? (tenantNameById.get(tenantId) ?? null) : null,
  };
}

// Build the base filtered query (shared by list + stats + export).
async function resolveScopedUserIds(
  admin: ReturnType<typeof createAdminClient>,
  scope: AuditScope,
  filters: AuditFilters,
): Promise<{ userIds: string[] | null; empty: boolean }> {
  const effectiveTenant = scope.tenantId ?? filters.tenantId;
  if (!effectiveTenant) return { userIds: null, empty: false };
  const ids = await tenantUserIds(admin, effectiveTenant);
  return { userIds: ids, empty: ids.length === 0 };
}

function applyCommonFilters(query: any, filters: AuditFilters, matchUserIds: string[] | null): any {
  let q = query;
  if (filters.dateFrom) q = q.gte('created_at', filters.dateFrom);
  if (filters.dateTo) q = q.lte('created_at', filters.dateTo);
  if (matchUserIds) q = q.in('user_id', matchUserIds);
  if (filters.groups && filters.groups.length > 0) {
    const prefixes = filters.groups.flatMap((g) => GROUP_PREFIXES[g]);
    const ors = prefixes.map((p) => `action.ilike.${p}%`).join(',');
    q = q.or(ors);
  }
  if (filters.search) {
    q = q.or(`action.ilike.%${filters.search}%,resource.ilike.%${filters.search}%`);
  }
  return q;
}

export async function getAuditLog(
  scope: AuditScope,
  filters: AuditFilters = {},
  pagination: { page: number; pageSize: number } = { page: 1, pageSize: 50 },
): Promise<{ entries: AuditEntry[]; total: number }> {
  const admin = createAdminClient();
  const { userIds, empty } = await resolveScopedUserIds(admin, scope, filters);
  if (empty) return { entries: [], total: 0 };

  // userEmail filter resolves to a user_id subset.
  let matchUserIds = userIds;
  if (filters.userEmail) {
    const { data } = await admin.from('profiles').select('id').ilike('email', `%${filters.userEmail}%`);
    const emailIds = ((data as { id: string }[]) ?? []).map((p) => p.id);
    matchUserIds = matchUserIds ? matchUserIds.filter((id) => emailIds.includes(id)) : emailIds;
    if (matchUserIds.length === 0) return { entries: [], total: 0 };
  }

  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;

  let query = admin
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
  query = applyCommonFilters(query as never, filters, matchUserIds);

  const { data, count } = await query;
  const rows = (data as AuditRow[]) ?? [];
  const { profileById, tenantNameById } = await buildLookups(
    admin,
    rows.map((r) => r.user_id).filter((x): x is string => !!x),
  );

  return {
    entries: rows.map((r) => mapEntry(r, profileById, tenantNameById)),
    total: count ?? 0,
  };
}

export interface AuditStats {
  totalEvents: number;
  uniqueUsers: number;
  mostCommonAction: string;
  actionBreakdown: { action: string; count: number }[];
}

export async function getAuditStats(
  scope: AuditScope,
  filters: AuditFilters = {},
): Promise<AuditStats> {
  const admin = createAdminClient();
  const { userIds, empty } = await resolveScopedUserIds(admin, scope, filters);
  if (empty) return { totalEvents: 0, uniqueUsers: 0, mostCommonAction: '—', actionBreakdown: [] };

  let query = admin.from('audit_logs').select('action, user_id').limit(5000);
  query = applyCommonFilters(query as never, filters, userIds);
  const { data } = await query;
  const rows = (data as { action: string; user_id: string | null }[]) ?? [];

  const counts = new Map<string, number>();
  const users = new Set<string>();
  for (const r of rows) {
    counts.set(r.action, (counts.get(r.action) ?? 0) + 1);
    if (r.user_id) users.add(r.user_id);
  }
  const breakdown = Array.from(counts.entries())
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEvents: rows.length,
    uniqueUsers: users.size,
    mostCommonAction: breakdown[0]?.action ?? '—',
    actionBreakdown: breakdown.slice(0, 10),
  };
}

// CSV of the filtered audit log (up to 10k rows). Returned as a string so the
// server action can hand it to the browser for download.
export async function exportAuditCSV(
  scope: AuditScope,
  filters: AuditFilters = {},
): Promise<{ csv: string; rowCount: number }> {
  const { entries } = await getAuditLog(scope, filters, { page: 1, pageSize: 10000 });
  const header = ['Timestamp', 'Action', 'Performed By', 'Role', 'Resource', 'Resource ID', 'Tenant', 'IP Address'];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [header.map(escape).join(',')];
  for (const e of entries) {
    lines.push(
      [
        e.timestamp,
        e.action,
        e.userEmail,
        e.userRole,
        e.resource,
        e.resourceId ?? '',
        e.tenantName ?? '',
        e.ipAddress ?? '',
      ]
        .map((v) => escape(String(v)))
        .join(','),
    );
  }
  return { csv: lines.join('\n'), rowCount: entries.length };
}
