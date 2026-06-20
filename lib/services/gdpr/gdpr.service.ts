// GDPR / data-subject request handling (Mission 006-B).
// Citizens submit; tenant admins process. Articles 15 (export), 16 (correction),
// 17 (deletion). Deadlines are 30 days from submission.
import type { AnalyticsScope } from '@/lib/services/analytics';
import { notifyGDPRRequest } from '@/lib/services/notifications/notification.service';
import { createAdminClient } from '@/lib/supabase/admin';

export type GDPRRequestType = 'data_export' | 'data_correction' | 'data_deletion';
export type GDPRRequestStatus = 'pending' | 'in_progress' | 'completed' | 'denied';

export interface GDPRRequest {
  id: string;
  tenantId: string;
  registrantId: string;
  requestType: GDPRRequestType;
  status: GDPRRequestStatus;
  requestDetails: string | null;
  correctionFields: Record<string, { current: string; requested: string }> | null;
  denialReason: string | null;
  processorNotes: string | null;
  deadlineAt: string;
  completedAt: string | null;
  createdAt: string;
  citizenName: string;
  citizenEmail: string | null;
}

interface GDPRRow {
  id: string;
  tenant_id: string;
  registrant_id: string;
  request_type: GDPRRequestType;
  status: GDPRRequestStatus;
  request_details: string | null;
  correction_fields: Record<string, { current: string; requested: string }> | null;
  denial_reason: string | null;
  processor_notes: string | null;
  deadline_at: string;
  completed_at: string | null;
  created_at: string;
}

const DEADLINE_DAYS = 30;

function deadlineFromNow(): string {
  const d = new Date();
  d.setDate(d.getDate() + DEADLINE_DAYS);
  return d.toISOString();
}

// Attach citizen name/email by joining registrants.
async function enrich(
  admin: ReturnType<typeof createAdminClient>,
  rows: GDPRRow[],
): Promise<GDPRRequest[]> {
  if (rows.length === 0) return [];
  const ids = Array.from(new Set(rows.map((r) => r.registrant_id)));
  const { data } = await admin
    .from('civis_registrants')
    .select('id, first_name, last_name, email')
    .in('id', ids);
  const byId = new Map<string, { name: string; email: string | null }>();
  for (const r of (data as { id: string; first_name: string; last_name: string; email: string | null }[]) ?? []) {
    byId.set(r.id, { name: `${r.first_name} ${r.last_name}`.trim(), email: r.email });
  }
  return rows.map((row) => {
    const c = byId.get(row.registrant_id);
    return {
      id: row.id,
      tenantId: row.tenant_id,
      registrantId: row.registrant_id,
      requestType: row.request_type,
      status: row.status,
      requestDetails: row.request_details,
      correctionFields: row.correction_fields,
      denialReason: row.denial_reason,
      processorNotes: row.processor_notes,
      deadlineAt: row.deadline_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      citizenName: c?.name ?? 'Unknown',
      citizenEmail: c?.email ?? null,
    };
  });
}

// ── Citizen side ──────────────────────────────

export async function submitGDPRRequest(
  registrantId: string,
  tenantId: string,
  type: GDPRRequestType,
  actorId: string,
  details?: string,
  correctionFields?: Record<string, { current: string; requested: string }>,
): Promise<{ requestId: string | null; deadline: string | null; error?: string }> {
  const admin = createAdminClient();
  const deadline = deadlineFromNow();

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: 'registrant',
    action: 'GDPR_REQUEST_SUBMITTED',
    resource: 'civis_gdpr_requests',
    resource_id: registrantId,
    metadata: { request_type: type },
  });

  const { data, error } = await admin
    .from('civis_gdpr_requests')
    .insert({
      tenant_id: tenantId,
      registrant_id: registrantId,
      request_type: type,
      request_details: details ?? null,
      correction_fields: correctionFields ?? null,
      deadline_at: deadline,
    })
    .select('id')
    .single();

  if (error || !data) return { requestId: null, deadline: null, error: error?.message };

  const { data: reg } = await admin
    .from('civis_registrants')
    .select('first_name, last_name')
    .eq('id', registrantId)
    .maybeSingle();
  const regRow = reg as { first_name: string; last_name: string } | null;
  await notifyGDPRRequest(tenantId, type, regRow ? `${regRow.first_name} ${regRow.last_name}`.trim() : 'A citizen');

  return { requestId: data.id, deadline };
}

export async function getMyGDPRRequests(registrantId: string): Promise<GDPRRequest[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_gdpr_requests')
    .select('*')
    .eq('registrant_id', registrantId)
    .order('created_at', { ascending: false });
  return enrich(admin, (data as GDPRRow[]) ?? []);
}

// ── Tenant-admin side ─────────────────────────

export async function getTenantGDPRRequests(scope: AnalyticsScope): Promise<GDPRRequest[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_gdpr_requests')
    .select('*')
    .eq('tenant_id', scope.tenantId)
    .order('created_at', { ascending: false });
  return enrich(admin, (data as GDPRRow[]) ?? []);
}

export interface GDPRStats {
  pending: number;
  inProgress: number;
  overdue: number;
  completedThisMonth: number;
}

export async function getGDPRStats(scope: AnalyticsScope): Promise<GDPRStats> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_gdpr_requests')
    .select('status, deadline_at, completed_at')
    .eq('tenant_id', scope.tenantId);
  const rows = (data as { status: GDPRRequestStatus; deadline_at: string; completed_at: string | null }[]) ?? [];
  const now = Date.now();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  let pending = 0, inProgress = 0, overdue = 0, completedThisMonth = 0;
  for (const r of rows) {
    if (r.status === 'pending') pending++;
    if (r.status === 'in_progress') inProgress++;
    if ((r.status === 'pending' || r.status === 'in_progress') && new Date(r.deadline_at).getTime() < now) overdue++;
    if (r.status === 'completed' && r.completed_at && new Date(r.completed_at) >= monthStart) completedThisMonth++;
  }
  return { pending, inProgress, overdue, completedThisMonth };
}

async function loadRequest(
  admin: ReturnType<typeof createAdminClient>,
  requestId: string,
): Promise<GDPRRow | null> {
  const { data } = await admin.from('civis_gdpr_requests').select('*').eq('id', requestId).maybeSingle();
  return (data as GDPRRow) ?? null;
}

// Generate a citizen's complete data package as a JSON string (export).
export async function processGDPRExport(
  requestId: string,
  actorId: string,
  actorRole: string,
): Promise<{ json: string | null; filename: string; error?: string }> {
  const admin = createAdminClient();
  const req = await loadRequest(admin, requestId);
  if (!req) return { json: null, filename: '', error: 'Request not found.' };

  const [{ data: registrant }, { data: documents }, { data: consent }, { data: notes }] = await Promise.all([
    admin.from('civis_registrants').select('*').eq('id', req.registrant_id).maybeSingle(),
    admin.from('civis_registrant_documents').select('document_type, file_name, status, created_at').eq('registrant_id', req.registrant_id),
    admin.from('civis_consent_records').select('consent_type, consent_version, consented, captured_at, withdrawn_at').eq('registrant_id', req.registrant_id),
    admin.from('civis_registrant_notes').select('note_text, author_role, created_at').eq('registrant_id', req.registrant_id),
  ]);

  const pkg = {
    exportedAt: new Date().toISOString(),
    registrant,
    documents: documents ?? [],
    consentRecords: consent ?? [],
    internalNotes: notes ?? [],
  };

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'GDPR_EXPORT_GENERATED',
    resource: 'civis_gdpr_requests',
    resource_id: requestId,
  });
  await admin.from('civis_gdpr_requests').update({ status: 'in_progress', processed_by: actorId, processed_at: new Date().toISOString() }).eq('id', requestId);

  return { json: JSON.stringify(pkg, null, 2), filename: `data-export-${req.registrant_id}.json` };
}

export async function completeGDPRRequest(
  requestId: string,
  actorId: string,
  actorRole: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'GDPR_REQUEST_COMPLETED',
    resource: 'civis_gdpr_requests',
    resource_id: requestId,
  });
  const { error } = await admin
    .from('civis_gdpr_requests')
    .update({ status: 'completed', completed_at: new Date().toISOString(), processed_by: actorId, processed_at: new Date().toISOString() })
    .eq('id', requestId);
  return { success: !error, error: error?.message };
}

export async function denyGDPRRequest(
  requestId: string,
  reason: string,
  actorId: string,
  actorRole: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'GDPR_REQUEST_DENIED',
    resource: 'civis_gdpr_requests',
    resource_id: requestId,
    metadata: { reason },
  });
  const { error } = await admin
    .from('civis_gdpr_requests')
    .update({ status: 'denied', denial_reason: reason, processed_by: actorId, processed_at: new Date().toISOString() })
    .eq('id', requestId);
  return { success: !error, error: error?.message };
}

export async function processGDPRCorrection(
  requestId: string,
  appliedCorrections: Record<string, string>,
  actorId: string,
  actorRole: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const req = await loadRequest(admin, requestId);
  if (!req) return { success: false, error: 'Request not found.' };

  // Whitelist of editable columns.
  const ALLOWED = new Set([
    'first_name', 'last_name', 'middle_name', 'preferred_name', 'date_of_birth', 'gender',
    'nationality', 'email', 'phone_primary', 'country_of_residence', 'city_of_residence',
    'occupation', 'employer', 'education_level',
  ]);
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(appliedCorrections)) {
    if (ALLOWED.has(k)) updates[k] = v;
  }

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'GDPR_CORRECTION_APPLIED',
    resource: 'civis_registrants',
    resource_id: req.registrant_id,
    metadata: { request_id: requestId, fields: Object.keys(updates) },
  });

  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from('civis_registrants').update(updates).eq('id', req.registrant_id);
    if (error) return { success: false, error: error.message };
  }

  return completeGDPRRequest(requestId, actorId, actorRole);
}

// Permanently delete a citizen: storage docs, child rows, anonymize registrant,
// delete auth account. The audit trail is preserved for compliance.
export async function processGDPRDeletion(
  requestId: string,
  actorId: string,
  actorRole: string,
): Promise<{ success: boolean; deletedItems: string[]; error?: string }> {
  const admin = createAdminClient();
  const req = await loadRequest(admin, requestId);
  if (!req) return { success: false, deletedItems: [], error: 'Request not found.' };

  const registrantId = req.registrant_id;
  const deletedItems: string[] = [];

  // Look up the registrant's storage paths + auth profile.
  const { data: registrant } = await admin
    .from('civis_registrants')
    .select('profile_id, profile_photo_url')
    .eq('id', registrantId)
    .maybeSingle();
  const profileId = (registrant as { profile_id: string | null } | null)?.profile_id ?? null;

  const { data: docs } = await admin
    .from('civis_registrant_documents')
    .select('storage_path')
    .eq('registrant_id', registrantId);
  const paths = ((docs as { storage_path: string }[]) ?? []).map((d) => d.storage_path).filter(Boolean);
  if (paths.length > 0) {
    await admin.storage.from('registrant-documents').remove(paths);
    deletedItems.push(`${paths.length} document file(s)`);
  }

  // Delete child rows.
  await admin.from('civis_registrant_documents').delete().eq('registrant_id', registrantId);
  await admin.from('civis_registrant_addresses').delete().eq('registrant_id', registrantId);
  await admin.from('civis_registrant_notes').delete().eq('registrant_id', registrantId);
  await admin.from('civis_household_members').delete().eq('registrant_id', registrantId);
  deletedItems.push('addresses, documents, notes, household memberships');

  // Anonymize the registrant record (keep the row for analytics integrity).
  await admin
    .from('civis_registrants')
    .update({
      first_name: '[DELETED]',
      last_name: '[DELETED]',
      middle_name: null,
      preferred_name: null,
      email: null,
      phone_primary: null,
      phone_secondary: null,
      profile_photo_url: null,
      profile_id: null,
      registration_status: 'archived',
      verification_status: 'unverified',
      notes: null,
    })
    .eq('id', registrantId);
  deletedItems.push('registrant PII anonymized');

  // Delete the auth account.
  if (profileId) {
    await admin.auth.admin.deleteUser(profileId).catch(() => undefined);
    deletedItems.push('auth account');
  }

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'GDPR_DELETION_EXECUTED',
    resource: 'civis_registrants',
    resource_id: registrantId,
    metadata: { request_id: requestId, deleted: deletedItems },
  });

  await admin
    .from('civis_gdpr_requests')
    .update({ status: 'completed', completed_at: new Date().toISOString(), processed_by: actorId, processed_at: new Date().toISOString() })
    .eq('id', requestId);

  return { success: true, deletedItems };
}
