// Deterministic diaspora analytics — counts, distributions, trends, aggregations.
// Tenant-scoped (and optionally embassy-scoped). No AI, no predictions.
// Uses the admin client with explicit scope filters for consistent aggregation.
import { createAdminClient } from '@/lib/supabase/admin';

export interface AnalyticsScope {
  tenantId: string;
  embassyId?: string;
}

export interface AnalyticsTimeframe {
  from?: Date;
  to?: Date;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface DashboardKPIs {
  totalRegistrants: number;
  activeRegistrants: number;
  pendingVerification: number;
  thisMonthRegistrations: number;
  totalEmbassies: number;
  totalStaff: number;
  avgCompletenessScore: number;
  registrationGrowthPercent: number;
}

export interface CountryDistribution {
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  count: number;
  percentage: number;
}

export interface DemographicBreakdown {
  label: string;
  count: number;
  percentage: number;
}

export interface RegistrationTrend {
  date: string;
  count: number;
  cumulativeCount: number;
}

export interface EmbassyPerformance {
  embassyId: string;
  embassyName: string;
  hostCountry: string;
  totalRegistrants: number;
  pendingVerification: number;
  avgProcessingDays: number;
  staffCount: number;
}

export interface ProfessionDistribution {
  occupation: string;
  count: number;
  percentage: number;
}

type Row = Record<string, unknown>;

function pct(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 1000) / 10;
}

// Fetch scoped registrant rows with the requested columns.
async function fetchRegistrants(scope: AnalyticsScope, columns: string): Promise<Row[]> {
  const admin = createAdminClient();
  let q = admin.from('civis_registrants').select(columns).eq('tenant_id', scope.tenantId);
  if (scope.embassyId) q = q.eq('embassy_id', scope.embassyId);
  const { data } = await q;
  return (data as unknown as Row[]) ?? [];
}

// name -> { code, flag } from civis_countries
async function countryLookup(): Promise<Map<string, { code: string; flag: string }>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_countries')
    .select('country_name_en, iso_code_alpha2, flag_emoji');
  const map = new Map<string, { code: string; flag: string }>();
  for (const c of (data as unknown as { country_name_en: string; iso_code_alpha2: string; flag_emoji: string }[]) ?? []) {
    map.set(c.country_name_en, { code: c.iso_code_alpha2, flag: c.flag_emoji });
  }
  return map;
}

function tally(rows: Row[], field: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const v = r[field];
    if (v == null || v === '') continue;
    m.set(String(v), (m.get(String(v)) ?? 0) + 1);
  }
  return m;
}

// ============================================================
// Dashboard KPIs
// ============================================================

export async function getDashboardKPIs(scope: AnalyticsScope): Promise<DashboardKPIs> {
  const admin = createAdminClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const countQ = (build: (q: any) => any) => {
    let q = admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('tenant_id', scope.tenantId);
    if (scope.embassyId) q = q.eq('embassy_id', scope.embassyId);
    return build(q);
  };

  const [total, active, pending, thisMonth, prevMonth, embassies, staff, scoreRows] = await Promise.all([
    countQ((q) => q),
    countQ((q) => q.eq('registration_status', 'active')),
    countQ((q) => q.eq('verification_status', 'pending_review')),
    countQ((q) => q.gte('created_at', monthStart.toISOString())),
    countQ((q) => q.gte('created_at', prevMonthStart.toISOString()).lt('created_at', monthStart.toISOString())),
    scope.embassyId
      ? Promise.resolve({ count: 1 })
      : admin.from('civis_embassies').select('id', { count: 'exact', head: true }).eq('tenant_id', scope.tenantId).eq('status', 'active'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', scope.tenantId).neq('role', 'registrant'),
    fetchRegistrants(scope, 'profile_completeness_score'),
  ]);

  const avg =
    scoreRows.length === 0
      ? 0
      : Math.round(scoreRows.reduce((s, r) => s + (Number(r.profile_completeness_score) || 0), 0) / scoreRows.length);

  const thisM = thisMonth.count ?? 0;
  const prevM = prevMonth.count ?? 0;
  const growth = prevM === 0 ? (thisM > 0 ? 100 : 0) : Math.round(((thisM - prevM) / prevM) * 1000) / 10;

  return {
    totalRegistrants: total.count ?? 0,
    activeRegistrants: active.count ?? 0,
    pendingVerification: pending.count ?? 0,
    thisMonthRegistrations: thisM,
    totalEmbassies: embassies.count ?? 0,
    totalStaff: staff.count ?? 0,
    avgCompletenessScore: avg,
    registrationGrowthPercent: growth,
  };
}

// ============================================================
// Geographic
// ============================================================

export async function getCountryDistribution(scope: AnalyticsScope, limit = 10): Promise<CountryDistribution[]> {
  const [rows, lookup] = await Promise.all([fetchRegistrants(scope, 'country_of_residence'), countryLookup()]);
  const counts = tally(rows, 'country_of_residence');
  const total = rows.length;
  return [...counts.entries()]
    .map(([name, count]) => {
      const meta = lookup.get(name);
      return { countryCode: meta?.code ?? '', countryName: name, flagEmoji: meta?.flag ?? '🌍', count, percentage: pct(count, total) };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getCityDistribution(
  scope: AnalyticsScope,
  countryName?: string,
  limit = 10,
): Promise<{ city: string; country: string; count: number }[]> {
  const rows = await fetchRegistrants(scope, 'city_of_residence, country_of_residence');
  const filtered = countryName ? rows.filter((r) => r.country_of_residence === countryName) : rows;
  const counts = new Map<string, { country: string; count: number }>();
  for (const r of filtered) {
    const city = String(r.city_of_residence ?? '');
    if (!city) continue;
    const prev = counts.get(city);
    counts.set(city, { country: String(r.country_of_residence ?? ''), count: (prev?.count ?? 0) + 1 });
  }
  return [...counts.entries()]
    .map(([city, v]) => ({ city, country: v.country, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ============================================================
// Demographics
// ============================================================

function breakdownFromMap(counts: Map<string, number>, total: number, order?: string[]): DemographicBreakdown[] {
  let entries = [...counts.entries()];
  if (order) entries = order.filter((o) => counts.has(o)).map((o) => [o, counts.get(o)!] as [string, number]);
  return entries.map(([label, count]) => ({ label, count, percentage: pct(count, total) }));
}

export async function getAgeDistribution(scope: AnalyticsScope): Promise<DemographicBreakdown[]> {
  const rows = await fetchRegistrants(scope, 'date_of_birth');
  const cohorts = ['18–25', '26–35', '36–45', '46–55', '56–65', '65+'];
  const counts = new Map<string, number>(cohorts.map((c) => [c, 0]));
  const now = new Date();
  let total = 0;
  for (const r of rows) {
    if (!r.date_of_birth) continue;
    const age = Math.floor((now.getTime() - new Date(String(r.date_of_birth)).getTime()) / 3.15576e10);
    const c = age <= 25 ? '18–25' : age <= 35 ? '26–35' : age <= 45 ? '36–45' : age <= 55 ? '46–55' : age <= 65 ? '56–65' : '65+';
    counts.set(c, (counts.get(c) ?? 0) + 1);
    total++;
  }
  return breakdownFromMap(counts, total, cohorts);
}

export async function getGenderDistribution(scope: AnalyticsScope): Promise<DemographicBreakdown[]> {
  const rows = await fetchRegistrants(scope, 'gender');
  const counts = tally(rows, 'gender');
  const labelled = new Map<string, number>();
  for (const [k, v] of counts) {
    const label = k === 'male' ? 'Male' : k === 'female' ? 'Female' : 'Other';
    labelled.set(label, (labelled.get(label) ?? 0) + v);
  }
  return breakdownFromMap(labelled, rows.length, ['Male', 'Female', 'Other']);
}

export async function getGenerationDistribution(scope: AnalyticsScope): Promise<DemographicBreakdown[]> {
  const rows = await fetchRegistrants(scope, 'generation');
  const counts = tally(rows, 'generation');
  const labelled = new Map<string, number>();
  const map: Record<string, string> = { first: 'First', second: 'Second', third: 'Third', returnee: 'Returnee' };
  for (const [k, v] of counts) labelled.set(map[k] ?? k, v);
  return breakdownFromMap(labelled, rows.length, ['First', 'Second', 'Third', 'Returnee']);
}

export async function getEducationDistribution(scope: AnalyticsScope): Promise<DemographicBreakdown[]> {
  const rows = await fetchRegistrants(scope, 'education_level');
  const counts = tally(rows, 'education_level');
  const total = rows.filter((r) => r.education_level).length;
  return breakdownFromMap(counts, total).sort((a, b) => b.count - a.count);
}

export async function getProfessionDistribution(scope: AnalyticsScope, limit = 15): Promise<ProfessionDistribution[]> {
  const rows = await fetchRegistrants(scope, 'occupation');
  const counts = tally(rows, 'occupation');
  const total = rows.filter((r) => r.occupation).length;
  return [...counts.entries()]
    .map(([occupation, count]) => ({ occupation, count, percentage: pct(count, total) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ============================================================
// Trends + status
// ============================================================

export async function getRegistrationTrends(scope: AnalyticsScope, timeframe: AnalyticsTimeframe): Promise<RegistrationTrend[]> {
  const rows = await fetchRegistrants(scope, 'created_at');
  const from = timeframe.from ?? new Date(Date.now() - 365 * 24 * 3.6e6);
  const buckets = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(String(r.created_at));
    if (d < from) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const sorted = [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let cumulative = 0;
  return sorted.map(([date, count]) => {
    cumulative += count;
    return { date, count, cumulativeCount: cumulative };
  });
}

export async function getRegistrationStatusBreakdown(scope: AnalyticsScope): Promise<DemographicBreakdown[]> {
  const rows = await fetchRegistrants(scope, 'registration_status');
  const counts = tally(rows, 'registration_status');
  const labelled = new Map<string, number>();
  const map: Record<string, string> = { draft: 'Draft', basic_registered: 'Basic', submitted: 'Submitted', active: 'Active', inactive: 'Inactive', archived: 'Archived' };
  for (const [k, v] of counts) labelled.set(map[k] ?? k, v);
  return breakdownFromMap(labelled, rows.length, ['Draft', 'Basic', 'Submitted', 'Active']);
}

// ============================================================
// Embassy performance
// ============================================================

export async function getEmbassyPerformance(scope: AnalyticsScope): Promise<EmbassyPerformance[]> {
  const admin = createAdminClient();
  const { data: embassies } = await admin
    .from('civis_embassies')
    .select('id, name, host_country')
    .eq('tenant_id', scope.tenantId);

  return Promise.all(
    ((embassies as unknown as { id: string; name: string; host_country: string }[]) ?? []).map(async (e) => {
      const [{ count: total }, { count: pending }, { count: staff }] = await Promise.all([
        admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('embassy_id', e.id),
        admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('embassy_id', e.id).eq('verification_status', 'pending_review'),
        admin.from('civis_embassy_staff').select('id', { count: 'exact', head: true }).eq('embassy_id', e.id).eq('is_active', true),
      ]);
      return {
        embassyId: e.id,
        embassyName: e.name,
        hostCountry: e.host_country,
        totalRegistrants: total ?? 0,
        pendingVerification: pending ?? 0,
        avgProcessingDays: 0,
        staffCount: staff ?? 0,
      };
    }),
  );
}

// ============================================================
// Data quality
// ============================================================

export async function getCompletenessDistribution(scope: AnalyticsScope): Promise<{ range: string; count: number; percentage: number }[]> {
  const rows = await fetchRegistrants(scope, 'profile_completeness_score');
  const ranges = ['0–20%', '21–40%', '41–60%', '61–80%', '81–100%'];
  const counts = new Map<string, number>(ranges.map((r) => [r, 0]));
  for (const r of rows) {
    const s = Number(r.profile_completeness_score) || 0;
    const k = s <= 20 ? '0–20%' : s <= 40 ? '21–40%' : s <= 60 ? '41–60%' : s <= 80 ? '61–80%' : '81–100%';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return ranges.map((range) => ({ range, count: counts.get(range) ?? 0, percentage: pct(counts.get(range) ?? 0, rows.length) }));
}

export async function getFieldCompletionRates(scope: AnalyticsScope): Promise<{ field: string; completionRate: number }[]> {
  const rows = await fetchRegistrants(
    scope,
    'date_of_birth, gender, occupation, education_level, city_of_residence, diaspora_association, field_of_study, generation',
  );
  const total = rows.length || 1;
  const fields: [string, string][] = [
    ['Date of Birth', 'date_of_birth'],
    ['Gender', 'gender'],
    ['Occupation', 'occupation'],
    ['Education', 'education_level'],
    ['City', 'city_of_residence'],
    ['Generation', 'generation'],
    ['Field of Study', 'field_of_study'],
    ['Association', 'diaspora_association'],
  ];
  return fields.map(([field, col]) => ({
    field,
    completionRate: Math.round((rows.filter((r) => r[col] != null && r[col] !== '').length / total) * 100),
  }));
}

// ============================================================
// Engagement signals
// ============================================================

export async function getReturnInterestBreakdown(scope: AnalyticsScope): Promise<{ interested: number; notInterested: number; percentage: number }> {
  const rows = await fetchRegistrants(scope, 'return_interest');
  const interested = rows.filter((r) => r.return_interest === true).length;
  return { interested, notInterested: rows.length - interested, percentage: pct(interested, rows.length) };
}

export async function getInvestmentInterestBreakdown(scope: AnalyticsScope): Promise<{ interested: number; notInterested: number; percentage: number }> {
  const rows = await fetchRegistrants(scope, 'investment_interest');
  const interested = rows.filter((r) => r.investment_interest === true).length;
  return { interested, notInterested: rows.length - interested, percentage: pct(interested, rows.length) };
}

export async function getDiasporaAssociationMembership(scope: AnalyticsScope): Promise<{ isMember: number; notMember: number; percentage: number }> {
  const rows = await fetchRegistrants(scope, 'diaspora_association');
  const isMember = rows.filter((r) => r.diaspora_association != null && r.diaspora_association !== '').length;
  return { isMember, notMember: rows.length - isMember, percentage: pct(isMember, rows.length) };
}
