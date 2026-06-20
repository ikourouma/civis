// Pre-computed analytics cache (Mission 006-D, Deliverable 8).
import type { AnalyticsScope } from './analytics.service';
import {
  getCountryDistribution,
  getDashboardKPIs,
  getProfessionDistribution,
  getRegistrationStatusBreakdown,
} from './analytics.service';
import { createAdminClient } from '@/lib/supabase/admin';

const FRESH_MS = 24 * 3.6e6; // 24 hours

interface CacheRow {
  metric_value: unknown;
  computed_at: string;
}

export async function getCachedMetric<T = unknown>(
  tenantId: string,
  metricKey: string,
  embassyId?: string,
): Promise<T | null> {
  const admin = createAdminClient();
  let q = admin
    .from('civis_analytics_cache')
    .select('metric_value, computed_at')
    .eq('tenant_id', tenantId)
    .eq('metric_key', metricKey);
  q = embassyId ? q.eq('embassy_id', embassyId) : q.is('embassy_id', null);
  const { data } = await q.maybeSingle();
  const row = data as CacheRow | null;
  if (!row) return null;
  if (Date.now() - new Date(row.computed_at).getTime() > FRESH_MS) return null;
  return row.metric_value as T;
}

export async function setCachedMetric(
  tenantId: string,
  metricKey: string,
  value: unknown,
  embassyId?: string,
): Promise<void> {
  const admin = createAdminClient();
  // Delete-then-insert (NULL embassy_id makes a plain upsert unreliable).
  let del = admin.from('civis_analytics_cache').delete().eq('tenant_id', tenantId).eq('metric_key', metricKey);
  del = embassyId ? del.eq('embassy_id', embassyId) : del.is('embassy_id', null);
  await del;
  await admin.from('civis_analytics_cache').insert({
    tenant_id: tenantId,
    embassy_id: embassyId ?? null,
    metric_key: metricKey,
    metric_value: value as object,
    computed_at: new Date().toISOString(),
  });
}

// Recompute and store the core dashboard metrics for a tenant.
export async function recomputeAnalyticsCache(tenantId: string, embassyId?: string): Promise<void> {
  const scope: AnalyticsScope = { tenantId, embassyId };
  const [kpis, status, countries, professions] = await Promise.all([
    getDashboardKPIs(scope),
    getRegistrationStatusBreakdown(scope),
    getCountryDistribution(scope, 5),
    getProfessionDistribution(scope, 5),
  ]);
  await Promise.all([
    setCachedMetric(tenantId, 'dashboard_kpis', kpis, embassyId),
    setCachedMetric(tenantId, 'status_breakdown', status, embassyId),
    setCachedMetric(tenantId, 'country_distribution', countries, embassyId),
    setCachedMetric(tenantId, 'profession_distribution', professions, embassyId),
  ]);
}

// Cache-first dashboard KPIs: serve cache when fresh, else compute + backfill.
export async function getDashboardKPIsCached(scope: AnalyticsScope) {
  const cached = await getCachedMetric<Awaited<ReturnType<typeof getDashboardKPIs>>>(
    scope.tenantId,
    'dashboard_kpis',
    scope.embassyId,
  );
  if (cached) return cached;
  const live = await getDashboardKPIs(scope);
  void setCachedMetric(scope.tenantId, 'dashboard_kpis', live, scope.embassyId);
  return live;
}

export async function getCacheTimestamp(tenantId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_analytics_cache')
    .select('computed_at')
    .eq('tenant_id', tenantId)
    .eq('metric_key', 'dashboard_kpis')
    .is('embassy_id', null)
    .maybeSingle();
  return (data as { computed_at: string } | null)?.computed_at ?? null;
}
