// Tenant configuration settings (Mission 006-B). General fields map to dedicated
// civis_tenants columns; security / retention / consent / notification config lives
// in the civis_tenants.settings JSONB column.
import { createAdminClient } from '@/lib/supabase/admin';

export interface SecuritySettings {
  mfaRoles: string[];
  passwordMaxAgeDays: number;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
}

export interface RetentionSettings {
  retentionDays: number;
  autoDelete: boolean;
  policyDescription: string;
}

export interface ConsentSettings {
  textEn: string;
  textFr: string;
  version: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  newRegistration: boolean;
  registrationApproved: boolean;
  gdprRequest: boolean;
  staffProvisioned: boolean;
  embassyCreated: boolean;
}

export interface TenantSettings {
  // General (read-only fields managed by super admin)
  tenantName: string;
  countryCode: string;
  deploymentTier: string;
  currencyCode: string | null;
  // General (editable)
  defaultLanguage: string;
  supportedLanguages: string[];
  primaryContactEmail: string | null;
  timezone: string | null;
  // JSONB-backed
  security: SecuritySettings;
  retention: RetentionSettings;
  consent: ConsentSettings;
  notifications: NotificationSettings;
}

const DEFAULT_SECURITY: SecuritySettings = {
  mfaRoles: [],
  passwordMaxAgeDays: 90,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
};
const DEFAULT_RETENTION: RetentionSettings = {
  retentionDays: 2555,
  autoDelete: false,
  policyDescription: '',
};
const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailEnabled: false,
  newRegistration: true,
  registrationApproved: false,
  gdprRequest: false,
  staffProvisioned: false,
  embassyCreated: false,
};

interface SettingsBlob {
  security?: Partial<SecuritySettings>;
  retention?: Partial<RetentionSettings>;
  consent?: Partial<ConsentSettings>;
  notifications?: Partial<NotificationSettings>;
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_tenants')
    .select('name, country_code, deployment_tier, currency_code, default_language, supported_languages, primary_contact_email, timezone, settings')
    .eq('id', tenantId)
    .maybeSingle();
  if (!data) return null;

  const row = data as {
    name: string; country_code: string; deployment_tier: string; currency_code: string | null;
    default_language: string; supported_languages: string[]; primary_contact_email: string | null;
    timezone: string | null; settings: SettingsBlob | null;
  };
  const s = row.settings ?? {};

  return {
    tenantName: row.name,
    countryCode: row.country_code,
    deploymentTier: row.deployment_tier,
    currencyCode: row.currency_code,
    defaultLanguage: row.default_language,
    supportedLanguages: row.supported_languages ?? ['en'],
    primaryContactEmail: row.primary_contact_email,
    timezone: row.timezone,
    security: { ...DEFAULT_SECURITY, ...s.security },
    retention: { ...DEFAULT_RETENTION, ...s.retention },
    consent: {
      textEn: s.consent?.textEn ?? '',
      textFr: s.consent?.textFr ?? '',
      version: s.consent?.version ?? '1.0',
    },
    notifications: { ...DEFAULT_NOTIFICATIONS, ...s.notifications },
  };
}

export interface UpdateTenantSettingsInput {
  defaultLanguage?: string;
  supportedLanguages?: string[];
  primaryContactEmail?: string | null;
  timezone?: string | null;
  security?: SecuritySettings;
  retention?: RetentionSettings;
  consent?: { textEn: string; textFr: string };
  notifications?: NotificationSettings;
}

// Bumps the consent version when consent text changes (existing records keep their snapshot).
function bumpVersion(version: string): string {
  const parts = version.split('.');
  const minor = parseInt(parts[1] ?? '0', 10) + 1;
  return `${parts[0] ?? '1'}.${minor}`;
}

export async function updateTenantSettings(
  tenantId: string,
  input: UpdateTenantSettingsInput,
  actorId: string,
  actorRole: string,
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const current = await getTenantSettings(tenantId);
  if (!current) return { success: false, error: 'Tenant not found.' };

  // Column updates.
  const columnUpdates: Record<string, unknown> = {};
  if (input.defaultLanguage !== undefined) columnUpdates.default_language = input.defaultLanguage;
  if (input.supportedLanguages !== undefined) columnUpdates.supported_languages = input.supportedLanguages;
  if (input.primaryContactEmail !== undefined) columnUpdates.primary_contact_email = input.primaryContactEmail;
  if (input.timezone !== undefined) columnUpdates.timezone = input.timezone;

  // Settings JSONB updates (merge over current).
  const consentChanged =
    input.consent &&
    (input.consent.textEn !== current.consent.textEn || input.consent.textFr !== current.consent.textFr);

  const newSettings: SettingsBlob = {
    security: input.security ?? current.security,
    retention: input.retention ?? current.retention,
    consent: input.consent
      ? {
          textEn: input.consent.textEn,
          textFr: input.consent.textFr,
          version: consentChanged ? bumpVersion(current.consent.version) : current.consent.version,
        }
      : current.consent,
    notifications: input.notifications ?? current.notifications,
  };
  columnUpdates.settings = newSettings;

  await admin.from('audit_logs').insert({
    user_id: actorId,
    user_role: actorRole,
    action: 'TENANT_SETTINGS_UPDATED',
    resource: 'civis_tenants',
    resource_id: tenantId,
    metadata: { fields: Object.keys(input), consent_version_bumped: !!consentChanged },
  });

  const { error } = await admin.from('civis_tenants').update(columnUpdates).eq('id', tenantId);
  return { success: !error, error: error?.message };
}
