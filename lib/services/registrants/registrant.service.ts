import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type RegistrationStatus = 'draft' | 'submitted' | 'active' | 'inactive' | 'archived';
export type VerificationStatus = 'unverified' | 'pending_review' | 'verified' | 'rejected';

export interface Registrant {
  id: string;
  tenantId: string;
  embassyId: string | null;
  profileId: string | null;
  firstName: string;
  lastName: string;
  middleName: string | null;
  preferredName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  nationality: string;
  dualNationality: string | null;
  countryOfBirth: string | null;
  cityOfBirth: string | null;
  email: string | null;
  phonePrimary: string | null;
  phoneSecondary: string | null;
  preferredLanguage: string;
  countryOfResidence: string;
  cityOfResidence: string;
  yearsAbroad: number | null;
  entryYear: number | null;
  occupation: string | null;
  employer: string | null;
  industrySector: string | null;
  educationLevel: string | null;
  fieldOfStudy: string | null;
  generation: string | null;
  diasporaAssociation: string | null;
  returnInterest: boolean;
  investmentInterest: boolean;
  registrationStatus: RegistrationStatus;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  rejectionReason: string | null;
  consentCaptured: boolean;
  consentRecordId: string | null;
  consentCapturedAt: string | null;
  profileCompletenessScore: number;
  isDuplicate: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrantSummary {
  id: string;
  firstName: string;
  lastName: string;
  nationality: string;
  countryOfResidence: string;
  registrationStatus: RegistrationStatus;
  verificationStatus: VerificationStatus;
  profileCompletenessScore: number;
  createdAt: string;
  embassyName?: string;
}

export interface CreateRegistrantInput {
  tenantId: string;
  embassyId?: string;
  profileId?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality: string;
  dualNationality?: string;
  countryOfBirth?: string;
  cityOfBirth?: string;
  email?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  preferredLanguage?: string;
  countryOfResidence: string;
  cityOfResidence: string;
  yearsAbroad?: number;
  entryYear?: number;
  occupation?: string;
  employer?: string;
  industrySector?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  generation?: string;
  diasporaAssociation?: string;
  returnInterest?: boolean;
  investmentInterest?: boolean;
  consentRecordId?: string;
}

export interface SearchFilters {
  query?: string;
  embassyId?: string;
  registrationStatus?: RegistrationStatus;
  verificationStatus?: VerificationStatus;
  countryOfResidence?: string;
  page?: number;
  pageSize?: number;
}

export interface RegistrantStats {
  total: number;
  verified: number;
  pending: number;
  draft: number;
}

interface RegistrantRow {
  id: string;
  tenant_id: string;
  embassy_id: string | null;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  preferred_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string;
  dual_nationality: string | null;
  country_of_birth: string | null;
  city_of_birth: string | null;
  email: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  preferred_language: string;
  country_of_residence: string;
  city_of_residence: string;
  years_abroad: number | null;
  entry_year: number | null;
  occupation: string | null;
  employer: string | null;
  industry_sector: string | null;
  education_level: string | null;
  field_of_study: string | null;
  generation: string | null;
  diaspora_association: string | null;
  return_interest: boolean;
  investment_interest: boolean;
  registration_status: RegistrationStatus;
  verification_status: VerificationStatus;
  verified_at: string | null;
  rejection_reason: string | null;
  consent_captured: boolean;
  consent_record_id: string | null;
  consent_captured_at: string | null;
  profile_completeness_score: number;
  is_duplicate: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRegistrant(row: RegistrantRow): Registrant {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    embassyId: row.embassy_id,
    profileId: row.profile_id,
    firstName: row.first_name,
    lastName: row.last_name,
    middleName: row.middle_name,
    preferredName: row.preferred_name,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    nationality: row.nationality,
    dualNationality: row.dual_nationality,
    countryOfBirth: row.country_of_birth,
    cityOfBirth: row.city_of_birth,
    email: row.email,
    phonePrimary: row.phone_primary,
    phoneSecondary: row.phone_secondary,
    preferredLanguage: row.preferred_language,
    countryOfResidence: row.country_of_residence,
    cityOfResidence: row.city_of_residence,
    yearsAbroad: row.years_abroad,
    entryYear: row.entry_year,
    occupation: row.occupation,
    employer: row.employer,
    industrySector: row.industry_sector,
    educationLevel: row.education_level,
    fieldOfStudy: row.field_of_study,
    generation: row.generation,
    diasporaAssociation: row.diaspora_association,
    returnInterest: row.return_interest,
    investmentInterest: row.investment_interest,
    registrationStatus: row.registration_status,
    verificationStatus: row.verification_status,
    verifiedAt: row.verified_at,
    rejectionReason: row.rejection_reason,
    consentCaptured: row.consent_captured,
    consentRecordId: row.consent_record_id,
    consentCapturedAt: row.consent_captured_at,
    profileCompletenessScore: row.profile_completeness_score,
    isDuplicate: row.is_duplicate,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function scoreCompleteness(input: CreateRegistrantInput, consentCaptured = false): number {
  let score = 0;
  if (input.firstName) score += 10;
  if (input.lastName) score += 10;
  if (input.dateOfBirth) score += 10;
  if (input.gender) score += 5;
  if (input.nationality) score += 10;
  if (input.email) score += 10;
  if (input.phonePrimary) score += 5;
  if (input.countryOfResidence) score += 10;
  if (input.cityOfResidence) score += 5;
  if (input.occupation) score += 10;
  if (input.educationLevel) score += 10;
  if (consentCaptured) score += 5;
  return Math.min(score, 100);
}

// Create a new registrant record. Requires consent_record_id (consent must be captured first).
export async function createRegistrant(
  input: CreateRegistrantInput,
): Promise<{ registrant: Registrant | null; error: string | null }> {
  const admin = createAdminClient();
  const score = scoreCompleteness(input, !!input.consentRecordId);

  const { data, error } = await admin
    .from('civis_registrants')
    .insert({
      tenant_id: input.tenantId,
      embassy_id: input.embassyId ?? null,
      profile_id: input.profileId ?? null,
      first_name: input.firstName,
      last_name: input.lastName,
      middle_name: input.middleName ?? null,
      preferred_name: input.preferredName ?? null,
      date_of_birth: input.dateOfBirth ?? null,
      gender: input.gender ?? null,
      nationality: input.nationality,
      dual_nationality: input.dualNationality ?? null,
      country_of_birth: input.countryOfBirth ?? null,
      city_of_birth: input.cityOfBirth ?? null,
      email: input.email ?? null,
      phone_primary: input.phonePrimary ?? null,
      phone_secondary: input.phoneSecondary ?? null,
      preferred_language: input.preferredLanguage ?? 'en',
      country_of_residence: input.countryOfResidence,
      city_of_residence: input.cityOfResidence,
      years_abroad: input.yearsAbroad ?? null,
      entry_year: input.entryYear ?? null,
      occupation: input.occupation ?? null,
      employer: input.employer ?? null,
      industry_sector: input.industrySector ?? null,
      education_level: input.educationLevel ?? null,
      field_of_study: input.fieldOfStudy ?? null,
      generation: input.generation ?? null,
      diaspora_association: input.diasporaAssociation ?? null,
      return_interest: input.returnInterest ?? false,
      investment_interest: input.investmentInterest ?? false,
      registration_status: 'submitted',
      verification_status: 'pending_review',
      consent_captured: !!input.consentRecordId,
      consent_record_id: input.consentRecordId ?? null,
      consent_captured_at: input.consentRecordId ? new Date().toISOString() : null,
      profile_completeness_score: score,
    })
    .select()
    .single();

  if (error || !data) {
    return { registrant: null, error: error?.message ?? 'Failed to create registrant' };
  }

  return { registrant: mapRegistrant(data as RegistrantRow), error: null };
}

// Approve a registrant — moves to active + verified.
export async function approveRegistrant(
  id: string,
  actorId: string,
  actorRole: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  // Write audit log BEFORE updating (mission rule: audit before success)
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'REGISTRANT_APPROVED',
    resource: 'civis_registrants',
    resource_id: id,
  });

  const { error } = await admin
    .from('civis_registrants')
    .update({
      registration_status: 'active',
      verification_status: 'verified',
      verified_by: actorId,
      verified_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', id);

  return { error: error?.message ?? null };
}

// Reject a registrant with a required reason.
export async function rejectRegistrant(
  id: string,
  reason: string,
  actorId: string,
  actorRole: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'REGISTRANT_REJECTED',
    resource: 'civis_registrants',
    resource_id: id,
    metadata: { reason },
  });

  const { error } = await admin
    .from('civis_registrants')
    .update({
      registration_status: 'inactive',
      verification_status: 'rejected',
      rejection_reason: reason,
    })
    .eq('id', id);

  return { error: error?.message ?? null };
}

// Paginated search with filters (RLS scopes to allowed rows automatically).
export async function searchRegistrants(
  filters: SearchFilters,
): Promise<{ registrants: Registrant[]; total: number }> {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from('civis_registrants')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.query) {
    q = q.or(
      `first_name.ilike.%${filters.query}%,last_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`,
    );
  }
  if (filters.embassyId) q = q.eq('embassy_id', filters.embassyId);
  if (filters.registrationStatus) q = q.eq('registration_status', filters.registrationStatus);
  if (filters.verificationStatus) q = q.eq('verification_status', filters.verificationStatus);
  if (filters.countryOfResidence) q = q.eq('country_of_residence', filters.countryOfResidence);

  const { data, error, count } = await q;

  if (error || !data) return { registrants: [], total: 0 };
  return {
    registrants: (data as RegistrantRow[]).map(mapRegistrant),
    total: count ?? 0,
  };
}

// Full registrant profile by ID (RLS scopes access).
export async function getRegistrantById(id: string): Promise<Registrant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('civis_registrants')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return mapRegistrant(data as RegistrantRow);
}

// Partial update + recalculate completeness score.
export async function updateRegistrantProfile(
  id: string,
  input: Partial<CreateRegistrantInput>,
  actorId: string,
  actorRole: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (input.firstName !== undefined) updates.first_name = input.firstName;
  if (input.lastName !== undefined) updates.last_name = input.lastName;
  if (input.dateOfBirth !== undefined) updates.date_of_birth = input.dateOfBirth;
  if (input.gender !== undefined) updates.gender = input.gender;
  if (input.email !== undefined) updates.email = input.email;
  if (input.phonePrimary !== undefined) updates.phone_primary = input.phonePrimary;
  if (input.countryOfResidence !== undefined) updates.country_of_residence = input.countryOfResidence;
  if (input.cityOfResidence !== undefined) updates.city_of_residence = input.cityOfResidence;
  if (input.occupation !== undefined) updates.occupation = input.occupation;
  if (input.educationLevel !== undefined) updates.education_level = input.educationLevel;

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'REGISTRANT_UPDATED',
    resource: 'civis_registrants',
    resource_id: id,
    metadata: Object.keys(updates),
  });

  const { error } = await admin
    .from('civis_registrants')
    .update(updates)
    .eq('id', id);

  return { error: error?.message ?? null };
}

// Simple duplicate detection: same name + DOB + nationality.
export async function detectDuplicates(
  firstName: string,
  lastName: string,
  dateOfBirth: string | null,
  nationality: string,
  tenantId: string,
): Promise<RegistrantSummary[]> {
  const admin = createAdminClient();

  let q = admin
    .from('civis_registrants')
    .select('id, first_name, last_name, nationality, country_of_residence, registration_status, verification_status, profile_completeness_score, created_at')
    .eq('tenant_id', tenantId)
    .ilike('first_name', firstName)
    .ilike('last_name', lastName)
    .eq('nationality', nationality);

  if (dateOfBirth) {
    q = q.eq('date_of_birth', dateOfBirth);
  }

  const { data } = await q.limit(5);
  if (!data) return [];

  return (data as {
    id: string;
    first_name: string;
    last_name: string;
    nationality: string;
    country_of_residence: string;
    registration_status: RegistrationStatus;
    verification_status: VerificationStatus;
    profile_completeness_score: number;
    created_at: string;
  }[]).map((r) => ({
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    nationality: r.nationality,
    countryOfResidence: r.country_of_residence,
    registrationStatus: r.registration_status,
    verificationStatus: r.verification_status,
    profileCompletenessScore: r.profile_completeness_score,
    createdAt: r.created_at,
  }));
}

// Aggregate stats for the tenant registry dashboard.
export async function getRegistrantStats(tenantId: string): Promise<RegistrantStats> {
  const admin = createAdminClient();

  const [totalRes, verifiedRes, pendingRes, draftRes] = await Promise.all([
    admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('verification_status', 'verified'),
    admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('verification_status', 'pending_review'),
    admin.from('civis_registrants').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('registration_status', 'draft'),
  ]);

  return {
    total: totalRes.count ?? 0,
    verified: verifiedRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    draft: draftRes.count ?? 0,
  };
}

// Registrant's own record (for the portal dashboard).
export async function getMyRegistrantRecord(profileId: string): Promise<Registrant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('civis_registrants')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRegistrant(data as RegistrantRow);
}
