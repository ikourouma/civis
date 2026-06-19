// Registrant-to-embassy auto-mapping (Mission 006-C, Deliverable 1).
// Resolves the embassy with jurisdiction over a registrant's country of residence.
import { createAdminClient } from '@/lib/supabase/admin';

export type EmbassyMatchType =
  | 'jurisdiction_country'
  | 'jurisdiction_city'
  | 'manual_required'
  | 'no_embassy';

export interface EmbassyResolution {
  embassyId: string | null;
  embassyName: string | null;
  matchType: EmbassyMatchType;
  alternativeEmbassies?: { id: string; name: string }[];
}

interface JurisdictionRow {
  embassy_id: string;
  city: string | null;
  civis_embassies: { id: string; name: string; status: string; deleted_at: string | null } | null;
}

export async function resolveEmbassyForRegistrant(
  tenantId: string,
  countryOfResidence: string,
  cityOfResidence?: string,
): Promise<EmbassyResolution> {
  if (!countryOfResidence) return { embassyId: null, embassyName: null, matchType: 'no_embassy' };

  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_embassy_jurisdictions')
    .select('embassy_id, city, civis_embassies(id, name, status, deleted_at)')
    .eq('tenant_id', tenantId)
    .eq('country_code', countryOfResidence);

  const rows = ((data as unknown as JurisdictionRow[]) ?? []).filter(
    (r) => r.civis_embassies && r.civis_embassies.status === 'active' && !r.civis_embassies.deleted_at,
  );

  if (rows.length === 0) {
    return { embassyId: null, embassyName: null, matchType: 'no_embassy' };
  }

  // Deduplicate by embassy.
  const byEmbassy = new Map<string, { name: string; cities: string[] }>();
  for (const r of rows) {
    const e = r.civis_embassies!;
    const entry = byEmbassy.get(e.id) ?? { name: e.name, cities: [] };
    if (r.city) entry.cities.push(r.city.toLowerCase());
    byEmbassy.set(e.id, entry);
  }

  if (byEmbassy.size === 1) {
    const [id, info] = Array.from(byEmbassy.entries())[0]!;
    return { embassyId: id, embassyName: info.name, matchType: 'jurisdiction_country' };
  }

  // Multiple embassies — try a city-level match.
  if (cityOfResidence) {
    const city = cityOfResidence.toLowerCase();
    for (const [id, info] of byEmbassy.entries()) {
      if (info.cities.includes(city)) {
        return { embassyId: id, embassyName: info.name, matchType: 'jurisdiction_city' };
      }
    }
  }

  return {
    embassyId: null,
    embassyName: null,
    matchType: 'manual_required',
    alternativeEmbassies: Array.from(byEmbassy.entries()).map(([id, info]) => ({ id, name: info.name })),
  };
}

// Manually (re)assign a registrant to an embassy (tenant admin action).
export async function assignRegistrantEmbassy(
  registrantId: string,
  embassyId: string | null,
  actorId: string,
  actorRole: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'REGISTRANT_EMBASSY_ASSIGNED',
    resource: 'civis_registrants',
    resource_id: registrantId,
    metadata: { embassy_id: embassyId },
  });
  const { error } = await admin
    .from('civis_registrants')
    .update({ embassy_id: embassyId })
    .eq('id', registrantId);
  return { error: error?.message ?? null };
}
