import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type ConsentType =
  | 'registration'
  | 'economic_profile'
  | 'survey'
  | 'campaign'
  | 'marketing';

export interface ConsentRecord {
  id: string;
  tenantId: string;
  registrantId: string | null;
  consentType: ConsentType;
  consentVersion: string;
  consentLanguage: string;
  consentTextSnapshot: string;
  consented: boolean;
  capturedAt: string;
  withdrawnAt: string | null;
  withdrawalReason: string | null;
}

interface ConsentRow {
  id: string;
  tenant_id: string;
  registrant_id: string | null;
  consent_type: ConsentType;
  consent_version: string;
  consent_language: string;
  consent_text_snapshot: string;
  consented: boolean;
  captured_at: string;
  withdrawn_at: string | null;
  withdrawal_reason: string | null;
}

function mapConsent(row: ConsentRow): ConsentRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    registrantId: row.registrant_id,
    consentType: row.consent_type,
    consentVersion: row.consent_version,
    consentLanguage: row.consent_language,
    consentTextSnapshot: row.consent_text_snapshot,
    consented: row.consented,
    capturedAt: row.captured_at,
    withdrawnAt: row.withdrawn_at,
    withdrawalReason: row.withdrawal_reason,
  };
}

// Capture explicit consent — always uses admin client (no user INSERT policy on consent_records).
// Returns the created consent record ID.
export async function captureConsent(
  tenantId: string,
  registrantId: string | null,
  consentText: string,
  language: string,
  actorId: string | null,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ consentRecordId: string | null; error: string | null }> {
  const admin = createAdminClient();

  // Audit log BEFORE writing consent record (mission rule)
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: 'registrant',
    action: 'CONSENT_CAPTURED',
    resource: 'civis_consent_records',
    resource_id: registrantId ?? undefined,
    metadata: { tenant_id: tenantId, language },
  });

  const { data, error } = await admin
    .from('civis_consent_records')
    .insert({
      tenant_id: tenantId,
      registrant_id: registrantId,
      consent_type: 'registration',
      consent_version: '1.0',
      consent_language: language,
      consent_text_snapshot: consentText,
      consented: true,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
      captured_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    return { consentRecordId: null, error: error?.message ?? 'Failed to record consent' };
  }

  return { consentRecordId: data.id, error: null };
}

// Withdraw consent — sets withdrawn_at timestamp.
// Consent records are immutable — this adds a withdrawal marker, not a deletion.
export async function withdrawConsent(
  consentRecordId: string,
  reason: string,
  actorId: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: 'registrant',
    action: 'CONSENT_WITHDRAWN',
    resource: 'civis_consent_records',
    resource_id: consentRecordId,
    metadata: { reason },
  });

  const { error } = await admin
    .from('civis_consent_records')
    .update({
      withdrawn_at: new Date().toISOString(),
      withdrawal_reason: reason,
    })
    .eq('id', consentRecordId);

  return { error: error?.message ?? null };
}

// Read the current consent record for a registrant (uses RLS — registrant sees own only).
export async function getConsentRecord(registrantId: string): Promise<ConsentRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('civis_consent_records')
    .select('*')
    .eq('registrant_id', registrantId)
    .eq('consent_type', 'registration')
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapConsent(data as ConsentRow);
}
