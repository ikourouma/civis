import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyEmbassyCreated } from '@/lib/services/notifications/notification.service';

export type MissionType =
  | 'embassy'
  | 'consulate'
  | 'high_commission'
  | 'permanent_mission'
  | 'honorary_consulate';

export type EmbassyStatus = 'active' | 'inactive' | 'archived';

export interface Embassy {
  id: string;
  tenantId: string;
  name: string;
  missionType: MissionType;
  hostCountry: string;
  hostCountryCode: string;
  hostCity: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  jurisdictionDescription: string | null;
  headOfMission: string | null;
  status: EmbassyStatus;
  timezone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmbassyStaffMember {
  id: string;
  userId: string;
  embassyId: string;
  role: string;
  isActive: boolean;
  assignedAt: string;
  fullName: string | null;
  email: string;
}

export interface EmbassyStats {
  total: number;
  pending: number;
  verified: number;
  thisMonth: number;
}

export interface CreateEmbassyInput {
  name: string;
  missionType: MissionType;
  hostCountry: string;
  hostCountryCode: string;
  hostCity: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  jurisdictionDescription?: string;
  headOfMission?: string;
  timezone?: string;
  jurisdictionCountries?: { code: string; name: string }[];
}

export interface EmbassyJurisdiction {
  countryCode: string;
  countryName: string | null;
}

export interface EmbassyWithCounts extends Embassy {
  staffCount: number;
  registrantCount: number;
}

export interface EmbassyDetail {
  embassy: Embassy;
  staff: EmbassyStaffMember[];
  stats: EmbassyStats;
  jurisdictions: EmbassyJurisdiction[];
}

interface EmbassyRow {
  id: string;
  tenant_id: string;
  name: string;
  mission_type: MissionType;
  host_country: string;
  host_country_code: string;
  host_city: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  jurisdiction_description: string | null;
  head_of_mission: string | null;
  status: EmbassyStatus;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

function mapEmbassy(row: EmbassyRow): Embassy {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    missionType: row.mission_type,
    hostCountry: row.host_country,
    hostCountryCode: row.host_country_code,
    hostCity: row.host_city,
    address: row.address,
    email: row.email,
    phone: row.phone,
    website: row.website,
    jurisdictionDescription: row.jurisdiction_description,
    headOfMission: row.head_of_mission,
    status: row.status,
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// All embassies for the current tenant (tenant_admin view).
export async function getEmbassiesByTenant(): Promise<Embassy[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('civis_embassies')
    .select('*')
    .order('name');

  if (error || !data) return [];
  return (data as EmbassyRow[]).map(mapEmbassy);
}

// The embassy assigned to the current embassy_admin or consular_officer.
export async function getMyEmbassy(): Promise<Embassy | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('civis_embassies')
    .select('*')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return mapEmbassy(data as EmbassyRow);
}

// Create a new embassy plus a default jurisdiction entry.
export async function createEmbassy(
  input: CreateEmbassyInput,
  actorId: string,
  tenantId: string,
): Promise<{ embassy: Embassy | null; error: string | null }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('civis_embassies')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      mission_type: input.missionType,
      host_country: input.hostCountry,
      host_country_code: input.hostCountryCode.toUpperCase(),
      host_city: input.hostCity,
      address: input.address ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      jurisdiction_description: input.jurisdictionDescription ?? null,
      head_of_mission: input.headOfMission ?? null,
      timezone: input.timezone ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    return { embassy: null, error: error?.message ?? 'Failed to create embassy' };
  }

  // Default jurisdiction covering the host country
  await admin.from('civis_embassy_jurisdictions').insert({
    tenant_id: tenantId,
    embassy_id: data.id,
    country_code: input.hostCountryCode.toUpperCase(),
    country_name: input.hostCountry,
  });

  // Audit log
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: 'tenant_admin',
    action: 'EMBASSY_CREATED',
    resource: 'civis_embassies',
    resource_id: data.id,
    metadata: { name: input.name, host_country: input.hostCountry },
  });

  return { embassy: mapEmbassy(data as EmbassyRow), error: null };
}

// Partial update on an embassy.
export async function updateEmbassy(
  id: string,
  input: Partial<CreateEmbassyInput>,
  actorId: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  const { error } = await admin
    .from('civis_embassies')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.missionType !== undefined && { mission_type: input.missionType }),
      ...(input.hostCountry !== undefined && { host_country: input.hostCountry }),
      ...(input.hostCity !== undefined && { host_city: input.hostCity }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.phone !== undefined && { phone: input.phone }),
      ...(input.website !== undefined && { website: input.website }),
      ...(input.headOfMission !== undefined && { head_of_mission: input.headOfMission }),
      ...(input.timezone !== undefined && { timezone: input.timezone }),
      ...(input.jurisdictionDescription !== undefined && {
        jurisdiction_description: input.jurisdictionDescription,
      }),
    })
    .eq('id', id);

  if (!error) {
    await admin.from('audit_logs').insert({
      user_id: actorId,
      user_role: 'tenant_admin',
      action: 'EMBASSY_UPDATED',
      resource: 'civis_embassies',
      resource_id: id,
      metadata: input,
    });
  }

  return { error: error?.message ?? null };
}

// Assign a platform user as staff on an embassy.
export async function assignStaffToEmbassy(
  userId: string,
  embassyId: string,
  role: string,
  tenantId: string,
  assignedBy: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  const { error } = await admin.from('civis_embassy_staff').upsert({
    tenant_id: tenantId,
    embassy_id: embassyId,
    user_id: userId,
    role,
    is_active: true,
    assigned_by: assignedBy,
  }, { onConflict: 'embassy_id,user_id' });

  return { error: error?.message ?? null };
}

// All staff for a given embassy (with profile join).
export async function getEmbassyStaff(embassyId: string): Promise<EmbassyStaffMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('civis_embassy_staff')
    .select('id, user_id, embassy_id, role, is_active, assigned_at, profiles(full_name, email)')
    .eq('embassy_id', embassyId)
    .eq('is_active', true)
    .order('assigned_at');

  if (error || !data) return [];

  return (data as unknown as {
    id: string;
    user_id: string;
    embassy_id: string;
    role: string;
    is_active: boolean;
    assigned_at: string;
    profiles: { full_name: string | null; email: string } | null;
  }[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    embassyId: row.embassy_id,
    role: row.role,
    isActive: row.is_active,
    assignedAt: row.assigned_at,
    fullName: row.profiles?.full_name ?? null,
    email: row.profiles?.email ?? '',
  }));
}

// Live stats for a specific embassy.
export async function getEmbassyStats(embassyId: string): Promise<EmbassyStats> {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [totalRes, pendingRes, verifiedRes, monthRes] = await Promise.all([
    supabase
      .from('civis_registrants')
      .select('id', { count: 'exact', head: true })
      .eq('embassy_id', embassyId),
    supabase
      .from('civis_registrants')
      .select('id', { count: 'exact', head: true })
      .eq('embassy_id', embassyId)
      .eq('verification_status', 'pending_review'),
    supabase
      .from('civis_registrants')
      .select('id', { count: 'exact', head: true })
      .eq('embassy_id', embassyId)
      .eq('verification_status', 'verified'),
    supabase
      .from('civis_registrants')
      .select('id', { count: 'exact', head: true })
      .eq('embassy_id', embassyId)
      .gte('created_at', monthStart),
  ]);

  return {
    total: totalRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    verified: verifiedRes.count ?? 0,
    thisMonth: monthRes.count ?? 0,
  };
}

// ============================================================
// Mission 005-C — Tenant Admin embassy management
// ============================================================

// Create embassy + jurisdiction entries + audit. tenant_admin scope enforced by caller.
export async function createEmbassyWithJurisdiction(
  input: CreateEmbassyInput,
  actorId: string,
  tenantId: string,
): Promise<{ embassy: Embassy | null; error: string | null }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('civis_embassies')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      mission_type: input.missionType,
      host_country: input.hostCountry,
      host_country_code: input.hostCountryCode.toUpperCase(),
      host_city: input.hostCity,
      address: input.address ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      jurisdiction_description: input.jurisdictionDescription ?? null,
      head_of_mission: input.headOfMission ?? null,
      timezone: input.timezone ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    return { embassy: null, error: error?.message ?? 'Failed to create embassy' };
  }

  // Jurisdictions — default to host country if none provided
  const jurisdictions =
    input.jurisdictionCountries && input.jurisdictionCountries.length > 0
      ? input.jurisdictionCountries
      : [{ code: input.hostCountryCode.toUpperCase(), name: input.hostCountry }];

  await admin.from('civis_embassy_jurisdictions').insert(
    jurisdictions.map((j) => ({
      tenant_id: tenantId,
      embassy_id: data.id,
      country_code: j.code.toUpperCase(),
      country_name: j.name,
    })),
  );

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: 'tenant_admin',
    action: 'EMBASSY_CREATED',
    resource: 'civis_embassies',
    resource_id: data.id,
    metadata: {
      embassy_name: input.name,
      host_country: input.hostCountry,
      host_city: input.hostCity,
      mission_type: input.missionType,
    },
  });

  await notifyEmbassyCreated(tenantId, input.name);

  return { embassy: mapEmbassy(data as EmbassyRow), error: null };
}

// Replace an embassy's jurisdiction set.
export async function setEmbassyJurisdictions(
  embassyId: string,
  tenantId: string,
  countries: { code: string; name: string }[],
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  await admin.from('civis_embassy_jurisdictions').delete().eq('embassy_id', embassyId);
  if (countries.length > 0) {
    const { error } = await admin.from('civis_embassy_jurisdictions').insert(
      countries.map((c) => ({
        tenant_id: tenantId,
        embassy_id: embassyId,
        country_code: c.code.toUpperCase(),
        country_name: c.name,
      })),
    );
    return { error: error?.message ?? null };
  }
  return { error: null };
}

export async function deactivateEmbassy(
  embassyId: string,
  reason: string,
  actorId: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { data: emb } = await admin.from('civis_embassies').select('name').eq('id', embassyId).maybeSingle();
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: 'tenant_admin',
    action: 'EMBASSY_DEACTIVATED',
    resource: 'civis_embassies',
    resource_id: embassyId,
    metadata: { embassy_name: emb?.name, reason },
  });
  const { error } = await admin.from('civis_embassies').update({ status: 'inactive' }).eq('id', embassyId);
  return { error: error?.message ?? null };
}

export async function reactivateEmbassy(
  embassyId: string,
  actorId: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const { data: emb } = await admin.from('civis_embassies').select('name').eq('id', embassyId).maybeSingle();
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: 'tenant_admin',
    action: 'EMBASSY_REACTIVATED',
    resource: 'civis_embassies',
    resource_id: embassyId,
    metadata: { embassy_name: emb?.name },
  });
  const { error } = await admin.from('civis_embassies').update({ status: 'active' }).eq('id', embassyId);
  return { error: error?.message ?? null };
}

// Single embassy by id (RLS-scoped).
export async function getEmbassyById(id: string): Promise<Embassy | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('civis_embassies').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapEmbassy(data as EmbassyRow);
}

// All embassies for the current tenant, with staff + registrant counts.
export async function getEmbassiesWithCounts(): Promise<EmbassyWithCounts[]> {
  const admin = createAdminClient();
  const supabase = await createClient();

  // RLS-scoped list (tenant rows only)
  const { data: embassies } = await supabase.from('civis_embassies').select('*').order('name');
  if (!embassies) return [];

  return Promise.all(
    (embassies as EmbassyRow[]).map(async (e) => {
      const [{ count: staffCount }, { count: registrantCount }] = await Promise.all([
        admin.from('civis_embassy_staff').select('id', { count: 'exact', head: true }).eq('embassy_id', e.id).eq('is_active', true),
        admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('embassy_id', e.id),
      ]);
      return { ...mapEmbassy(e), staffCount: staffCount ?? 0, registrantCount: registrantCount ?? 0 };
    }),
  );
}

export async function getEmbassyJurisdictions(embassyId: string): Promise<EmbassyJurisdiction[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('civis_embassy_jurisdictions')
    .select('country_code, country_name')
    .eq('embassy_id', embassyId)
    .order('country_code');
  return ((data as { country_code: string; country_name: string | null }[]) ?? []).map((j) => ({
    countryCode: j.country_code,
    countryName: j.country_name,
  }));
}

// Full embassy detail bundle for the detail page.
export async function getEmbassyWithStaffAndStats(embassyId: string): Promise<EmbassyDetail | null> {
  const embassy = await getEmbassyById(embassyId);
  if (!embassy) return null;
  const [staff, stats, jurisdictions] = await Promise.all([
    getEmbassyStaff(embassyId),
    getEmbassyStats(embassyId),
    getEmbassyJurisdictions(embassyId),
  ]);
  return { embassy, staff, stats, jurisdictions };
}
