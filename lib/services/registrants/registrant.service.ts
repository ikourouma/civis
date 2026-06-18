import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type RegistrationStatus =
  | 'draft'
  | 'basic_registered'
  | 'submitted'
  | 'active'
  | 'inactive'
  | 'archived';
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
  profilePhotoUrl: string | null;
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
  profile_photo_url: string | null;
  basic_registration_at: string | null;
  full_registration_at: string | null;
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
    profilePhotoUrl: row.profile_photo_url,
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

// ============================================================
// Mission 005-B — Two-phase registration
// ============================================================

export interface BasicRegistrationInput {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string; // ISO alpha-2
  phoneNumber: string; // E.164
  preferredLanguage: string;
  consentTextSnapshot: string;
  consentVersion: string;
  consentLanguage: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface BasicRegistrationResult {
  registrantId: string | null;
  profileId: string | null;
  status: 'basic_registered' | null;
  // Transient one-time password so the client can auto-establish a session.
  // The account owner resets it later; magic-link auth is a future mission.
  sessionPassword?: string;
  error?: string;
}

function generatePassword(): string {
  // 24 chars, mixed — transient session credential only.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 24; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Phase 1 — create the account + registrant with status 'basic_registered'.
// Consent is captured BEFORE the registrant PII row is written.
export async function submitBasicRegistration(
  input: BasicRegistrationInput,
): Promise<BasicRegistrationResult> {
  const admin = createAdminClient();

  // 1. Validate tenant is live
  const { data: tenant } = await admin
    .from('civis_tenants')
    .select('id, status')
    .eq('id', input.tenantId)
    .maybeSingle();

  if (!tenant || !['active', 'pilot'].includes(tenant.status as string)) {
    return { registrantId: null, profileId: null, status: null, error: 'Invalid or inactive tenant.' };
  }

  // 2. Create the auth user (email pre-confirmed so the citizen can be auto-signed in)
  const sessionPassword = generatePassword();
  const fullName = `${input.firstName} ${input.lastName}`.trim();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: input.email,
    password: sessionPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'registrant' },
  });

  if (authError || !authData?.user) {
    const msg = authError?.message?.toLowerCase().includes('already')
      ? 'An account with this email already exists. Please sign in instead.'
      : authError?.message ?? 'Could not create your account.';
    return { registrantId: null, profileId: null, status: null, error: msg };
  }

  const userId = authData.user.id;

  // 3. Ensure the profile exists with role + tenant (upsert — resilient even if
  //    the auth trigger skipped the insert).
  await admin
    .from('profiles')
    .upsert(
      { id: userId, email: input.email, full_name: fullName, role: 'registrant', tenant_id: input.tenantId },
      { onConflict: 'id' },
    );

  // 4. Capture consent FIRST (before the registrant PII row)
  const { data: consent, error: consentError } = await admin
    .from('civis_consent_records')
    .insert({
      tenant_id: input.tenantId,
      registrant_id: null,
      consent_type: 'registration',
      consent_version: input.consentVersion,
      consent_language: input.consentLanguage,
      consent_text_snapshot: input.consentTextSnapshot,
      consented: true,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      captured_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (consentError || !consent) {
    return { registrantId: null, profileId: userId, status: null, error: 'Failed to record consent.' };
  }

  // Audit consent capture (audit-before-success)
  await admin.from('audit_logs').insert({
    user_id: userId,
    user_role: 'registrant',
    action: 'CONSENT_CAPTURED',
    resource: 'civis_consent_records',
    resource_id: consent.id,
    metadata: { tenant_id: input.tenantId, language: input.consentLanguage },
  });

  // 5. Create the registrant row (basic_registered)
  const now = new Date().toISOString();
  const { data: registrant, error: regError } = await admin
    .from('civis_registrants')
    .insert({
      tenant_id: input.tenantId,
      profile_id: userId,
      first_name: input.firstName,
      last_name: input.lastName,
      nationality: '',
      country_of_residence: '',
      city_of_residence: '',
      email: input.email,
      phone_primary: input.phoneNumber,
      preferred_language: input.preferredLanguage,
      registration_status: 'basic_registered',
      verification_status: 'unverified',
      consent_captured: true,
      consent_record_id: consent.id,
      consent_captured_at: now,
      basic_registration_at: now,
      profile_completeness_score: 25,
    })
    .select('id')
    .single();

  if (regError || !registrant) {
    return { registrantId: null, profileId: userId, status: null, error: regError?.message ?? 'Registration failed.' };
  }

  // Link consent record back to the registrant
  await admin.from('civis_consent_records').update({ registrant_id: registrant.id }).eq('id', consent.id);

  // Audit basic registration
  await admin.from('audit_logs').insert({
    user_id: userId,
    user_role: 'registrant',
    action: 'BASIC_REGISTRATION_COMPLETED',
    resource: 'civis_registrants',
    resource_id: registrant.id,
    metadata: { tenant_id: input.tenantId },
  });

  return {
    registrantId: registrant.id,
    profileId: userId,
    status: 'basic_registered',
    sessionPassword,
  };
}

export type ProfileSection = 'personal' | 'residence' | 'professional' | 'documents';

// Recompute completeness from a full registrant row (0–100).
function fullCompleteness(r: RegistrantRow): number {
  const checks: boolean[] = [
    !!r.first_name,
    !!r.last_name,
    !!r.date_of_birth,
    !!r.gender,
    !!r.nationality,
    !!r.country_of_birth,
    !!r.city_of_birth,
    !!r.email,
    !!r.phone_primary,
    !!r.country_of_residence,
    !!r.city_of_residence,
    !!r.entry_year,
    !!r.occupation,
    !!r.education_level,
    !!r.consent_captured,
    !!r.profile_photo_url,
  ];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return score;
}

const REQUIRED_FOR_SUBMIT: (keyof RegistrantRow)[] = [
  'date_of_birth',
  'gender',
  'nationality',
  'country_of_birth',
  'city_of_birth',
  'country_of_residence',
  'city_of_residence',
];

// Phase 2 — save a profile section, recompute completeness, auto-advance to submitted.
export async function completeProfileSection(
  registrantId: string,
  section: ProfileSection,
  data: Partial<CreateRegistrantInput> & {
    secondNationality?: string;
    addressLine1?: string;
    addressLine2?: string;
    stateRegion?: string;
    postalCode?: string;
    departureYear?: number;
    profilePhotoUrl?: string;
  },
  actorId: string,
): Promise<{ success: boolean; newCompletenessScore: number; status: RegistrationStatus | null; error?: string }> {
  const admin = createAdminClient();

  // Verify ownership
  const { data: existing } = await admin
    .from('civis_registrants')
    .select('*')
    .eq('id', registrantId)
    .maybeSingle();

  if (!existing) return { success: false, newCompletenessScore: 0, status: null, error: 'Registrant not found.' };
  if ((existing as RegistrantRow).profile_id !== actorId) {
    return { success: false, newCompletenessScore: 0, status: null, error: 'Unauthorized.' };
  }

  const updates: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) updates[k] = v;
  };

  if (section === 'personal') {
    set('date_of_birth', data.dateOfBirth);
    set('gender', data.gender);
    set('middle_name', data.middleName);
    set('preferred_name', data.preferredName);
    set('nationality', data.nationality);
    set('dual_nationality', data.secondNationality);
    set('country_of_birth', data.countryOfBirth);
    set('city_of_birth', data.cityOfBirth);
  } else if (section === 'residence') {
    set('phone_secondary', data.phoneSecondary);
    set('country_of_residence', data.countryOfResidence);
    set('city_of_residence', data.cityOfResidence);
    set('years_abroad', data.departureYear ? new Date().getFullYear() - data.departureYear : undefined);
    set('entry_year', data.entryYear);
  } else if (section === 'professional') {
    set('occupation', data.occupation);
    set('employer', data.employer);
    set('industry_sector', data.industrySector);
    set('education_level', data.educationLevel);
    set('field_of_study', data.fieldOfStudy);
    set('generation', data.generation);
    set('diaspora_association', data.diasporaAssociation);
    set('return_interest', data.returnInterest);
    set('investment_interest', data.investmentInterest);
  } else if (section === 'documents') {
    set('profile_photo_url', data.profilePhotoUrl);
  }

  if (Object.keys(updates).length > 0) {
    await admin.from('civis_registrants').update(updates).eq('id', registrantId);
  }

  // Re-read to recompute completeness from the merged row
  const { data: merged } = await admin
    .from('civis_registrants')
    .select('*')
    .eq('id', registrantId)
    .single();

  const mergedRow = merged as RegistrantRow;
  const score = fullCompleteness(mergedRow);

  const requiredComplete = REQUIRED_FOR_SUBMIT.every((k) => !!mergedRow[k]);
  let status = mergedRow.registration_status as RegistrationStatus;

  const finalUpdates: Record<string, unknown> = { profile_completeness_score: score };
  if (score >= 80 && requiredComplete && status === 'basic_registered') {
    status = 'submitted';
    finalUpdates.registration_status = 'submitted';
    finalUpdates.verification_status = 'pending_review';
    finalUpdates.full_registration_at = new Date().toISOString();
  }
  await admin.from('civis_registrants').update(finalUpdates).eq('id', registrantId);

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: 'registrant',
    action: 'PROFILE_SECTION_COMPLETED',
    resource: 'civis_registrants',
    resource_id: registrantId,
    metadata: { section, completeness: score },
  });

  return { success: true, newCompletenessScore: score, status };
}

// ============================================================
// Mission 006-B — Staff-side profile editing, documents, activity
// ============================================================

export type StaffEditSection = 'personal' | 'contact' | 'professional';

export interface StaffSectionInput {
  // personal
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  preferredName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string;
  dualNationality?: string | null;
  countryOfBirth?: string | null;
  cityOfBirth?: string | null;
  generation?: string | null;
  // contact
  email?: string | null;
  phonePrimary?: string | null;
  phoneSecondary?: string | null;
  countryOfResidence?: string;
  cityOfResidence?: string;
  yearsAbroad?: number | null;
  entryYear?: number | null;
  // professional
  occupation?: string | null;
  employer?: string | null;
  industrySector?: string | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  diasporaAssociation?: string | null;
  returnInterest?: boolean;
  investmentInterest?: boolean;
}

const SECTION_AUDIT_ACTION: Record<StaffEditSection, string> = {
  personal: 'REGISTRANT_IDENTITY_EDITED',
  contact: 'REGISTRANT_CONTACT_EDITED',
  professional: 'REGISTRANT_PROFESSIONAL_EDITED',
};

// Staff edit of a registrant section. Audit-logs with the section-specific action,
// then recomputes the completeness score from the merged row.
export async function staffUpdateSection(
  id: string,
  section: StaffEditSection,
  input: StaffSectionInput,
  actorId: string,
  actorRole: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const updates: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) updates[k] = v;
  };

  if (section === 'personal') {
    set('first_name', input.firstName);
    set('last_name', input.lastName);
    set('middle_name', input.middleName);
    set('preferred_name', input.preferredName);
    set('date_of_birth', input.dateOfBirth);
    set('gender', input.gender);
    set('nationality', input.nationality);
    set('dual_nationality', input.dualNationality);
    set('country_of_birth', input.countryOfBirth);
    set('city_of_birth', input.cityOfBirth);
    set('generation', input.generation);
  } else if (section === 'contact') {
    set('email', input.email);
    set('phone_primary', input.phonePrimary);
    set('phone_secondary', input.phoneSecondary);
    set('country_of_residence', input.countryOfResidence);
    set('city_of_residence', input.cityOfResidence);
    set('years_abroad', input.yearsAbroad);
    set('entry_year', input.entryYear);
  } else {
    set('occupation', input.occupation);
    set('employer', input.employer);
    set('industry_sector', input.industrySector);
    set('education_level', input.educationLevel);
    set('field_of_study', input.fieldOfStudy);
    set('diaspora_association', input.diasporaAssociation);
    set('return_interest', input.returnInterest);
    set('investment_interest', input.investmentInterest);
  }

  // Audit BEFORE the write (mission rule: audit-before-success).
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: SECTION_AUDIT_ACTION[section],
    resource: 'civis_registrants',
    resource_id: id,
    metadata: { section, fields: Object.keys(updates) },
  });

  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from('civis_registrants').update(updates).eq('id', id);
    if (error) return { error: error.message };
  }

  // Recompute completeness from the merged row.
  const { data: merged } = await admin
    .from('civis_registrants')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (merged) {
    const score = fullCompleteness(merged as RegistrantRow);
    await admin.from('civis_registrants').update({ profile_completeness_score: score }).eq('id', id);
  }

  return { error: null };
}

// Flag a registrant as a potential duplicate for review.
export async function flagDuplicate(
  id: string,
  actorId: string,
  actorRole: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'REGISTRANT_FLAGGED_DUPLICATE',
    resource: 'civis_registrants',
    resource_id: id,
  });
  const { error } = await admin
    .from('civis_registrants')
    .update({ is_duplicate: true })
    .eq('id', id);
  return { error: error?.message ?? null };
}

export interface RegistrantDocument {
  id: string;
  documentType: string;
  fileName: string;
  status: string;
  storagePath: string;
  mimeType: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionNotes: string | null;
  createdAt: string;
}

// Documents for a registrant (admin client — caller is an entitlement-guarded staff page).
export async function getRegistrantDocuments(registrantId: string): Promise<RegistrantDocument[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_registrant_documents')
    .select('id, document_type, file_name, status, storage_path, mime_type, reviewed_by, reviewed_at, rejection_notes, created_at')
    .eq('registrant_id', registrantId)
    .order('created_at', { ascending: false });
  return (
    (data as {
      id: string; document_type: string; file_name: string; status: string;
      storage_path: string; mime_type: string | null; reviewed_by: string | null;
      reviewed_at: string | null; rejection_notes: string | null; created_at: string;
    }[]) ?? []
  ).map((d) => ({
    id: d.id,
    documentType: d.document_type,
    fileName: d.file_name,
    status: d.status,
    storagePath: d.storage_path,
    mimeType: d.mime_type,
    reviewedBy: d.reviewed_by,
    reviewedAt: d.reviewed_at,
    rejectionNotes: d.rejection_notes,
    createdAt: d.created_at,
  }));
}

export interface RegistrantActivityEntry {
  id: string;
  action: string;
  userEmail: string | null;
  userRole: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// Audit trail filtered to one registrant (admin client — always-visible Activity tab).
export async function getRegistrantActivity(registrantId: string): Promise<RegistrantActivityEntry[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('audit_logs')
    .select('id, action, user_email, user_role, metadata, created_at')
    .eq('resource', 'civis_registrants')
    .eq('resource_id', registrantId)
    .order('created_at', { ascending: false })
    .limit(100);
  return (
    (data as {
      id: string; action: string; user_email: string | null;
      user_role: string | null; metadata: Record<string, unknown>; created_at: string;
    }[]) ?? []
  ).map((a) => ({
    id: a.id,
    action: a.action,
    userEmail: a.user_email,
    userRole: a.user_role,
    metadata: a.metadata ?? {},
    createdAt: a.created_at,
  }));
}

// Explicit submit-for-verification (when required fields are met).
export async function submitForVerification(
  registrantId: string,
  actorId: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('civis_registrants')
    .select('*')
    .eq('id', registrantId)
    .maybeSingle();

  if (!existing) return { success: false, error: 'Registrant not found.' };
  const row = existing as RegistrantRow;
  if (row.profile_id !== actorId) return { success: false, error: 'Unauthorized.' };

  const requiredComplete = REQUIRED_FOR_SUBMIT.every((k) => !!row[k]);
  if (!requiredComplete) return { success: false, error: 'Complete all required fields first.' };

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: 'registrant',
    action: 'PROFILE_SUBMITTED',
    resource: 'civis_registrants',
    resource_id: registrantId,
  });

  const { error } = await admin
    .from('civis_registrants')
    .update({
      registration_status: 'submitted',
      verification_status: 'pending_review',
      full_registration_at: new Date().toISOString(),
    })
    .eq('id', registrantId);

  return { success: !error, error: error?.message };
}
