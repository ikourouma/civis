// Tier-aware entitlement defaults (Mission 006-D, Deliverable 2).
// Government extends Cloud; Sovereign extends Government. `getTierCapabilities`
// returns the cumulative capability set for a (tier, role) pair.
import type { CapabilityCode, PlatformRoleExcludingSuperAdmin } from '@/lib/entitlements/capabilities';

export type DeploymentTier = 'cloud' | 'government' | 'sovereign';

type RoleCaps = Partial<Record<PlatformRoleExcludingSuperAdmin, CapabilityCode[]>>;

// Base Cloud-tier capabilities per role.
const CLOUD: RoleCaps = {
  tenant_admin: [
    'REGISTRY_VIEW_LIST', 'REGISTRY_SEARCH', 'REGISTRANT_APPROVE',
    'REGISTRANT_REJECT', 'REGISTRANT_ADD_NOTES', 'REGISTRANT_VIEW_DOCUMENTS',
    'REGISTRANT_EDIT_CONTACT', 'REGISTRANT_EDIT_PROFESSIONAL',
    'EMBASSY_CREATE', 'EMBASSY_EDIT', 'EMBASSY_VIEW_STAFF',
    'STAFF_PROVISION', 'STAFF_ASSIGN_EMBASSY', 'STAFF_CHANGE_ROLE',
    'STAFF_DEACTIVATE', 'STAFF_RESET_PASSWORD',
    'INTELLIGENCE_DASHBOARD', 'INTELLIGENCE_DRILL_DOWN',
    'EXECUTIVE_DASHBOARD', 'EXECUTIVE_BRIEFING_PDF',
    'AUDIT_VIEW_OWN', 'SETTINGS_VIEW',
  ],
  embassy_admin: [
    'REGISTRANT_APPROVE', 'REGISTRANT_REJECT', 'REGISTRANT_ADD_NOTES',
    'REGISTRANT_VIEW_DOCUMENTS', 'REGISTRANT_EDIT_CONTACT',
    'EMBASSY_EDIT', 'EMBASSY_VIEW_STAFF', 'AUDIT_VIEW_OWN',
  ],
  consular_officer: [
    'REGISTRANT_APPROVE', 'REGISTRANT_REJECT', 'REGISTRANT_ADD_NOTES',
    'REGISTRANT_VIEW_DOCUMENTS', 'REGISTRANT_FLAG_DUPLICATE', 'AUDIT_VIEW_OWN',
  ],
  analyst: [
    'INTELLIGENCE_DASHBOARD', 'INTELLIGENCE_DRILL_DOWN',
    'INTELLIGENCE_EXPORT', 'EXECUTIVE_BRIEFING_PDF', 'AUDIT_VIEW_OWN',
  ],
  executive_viewer: ['EXECUTIVE_DASHBOARD', 'EXECUTIVE_BRIEFING_PDF'],
  registrant: [
    'GDPR_REQUEST_EXPORT', 'GDPR_REQUEST_CORRECTION',
    'GDPR_VIEW_CONSENT', 'AUDIT_VIEW_OWN',
  ],
};

// Capabilities Government adds on top of Cloud.
const GOVERNMENT_ADD: RoleCaps = {
  tenant_admin: [
    'REGISTRY_VIEW_PROFILE', 'REGISTRY_EXPORT_CSV', 'REGISTRY_EXPORT_PDF',
    'REGISTRANT_EDIT_IDENTITY', 'REGISTRANT_VIEW_CONSENT',
    'EMBASSY_DEACTIVATE', 'EMBASSY_VIEW_PERFORMANCE', 'STAFF_VIEW_ACTIVITY',
    'INTELLIGENCE_REPORTS',
    'AUDIT_VIEW_EMBASSY', 'AUDIT_VIEW_TENANT', 'AUDIT_EXPORT',
    'GDPR_PROCESS_REQUESTS',
    'SETTINGS_EDIT', 'SETTINGS_DATA_RETENTION', 'SETTINGS_CONSENT_CONFIG',
  ],
  embassy_admin: [
    'REGISTRY_VIEW_LIST', 'REGISTRY_VIEW_PROFILE', 'REGISTRY_SEARCH',
    'REGISTRANT_EDIT_PROFESSIONAL', 'EMBASSY_VIEW_PERFORMANCE', 'AUDIT_VIEW_EMBASSY',
  ],
  consular_officer: ['REGISTRY_VIEW_LIST', 'REGISTRY_VIEW_PROFILE', 'REGISTRY_SEARCH'],
  analyst: ['INTELLIGENCE_REPORTS', 'INTELLIGENCE_SEGMENTS', 'REGISTRY_EXPORT_CSV'],
  executive_viewer: [],
  registrant: ['GDPR_REQUEST_DELETION'],
};

// Capabilities Sovereign adds on top of Government.
const SOVEREIGN_ADD: RoleCaps = {
  tenant_admin: [
    'REGISTRY_BULK_ACTIONS',
    'DIA_AI_FORECASTING', 'DIA_AI_BRIEFS', 'DIA_AI_SEGMENTS', 'DIA_AI_CONFIGURE',
    'MONITORING_DASHBOARD', 'MONITORING_ALERTS', 'INTELLIGENCE_SEGMENTS',
  ],
  embassy_admin: ['REGISTRY_EXPORT_CSV', 'AUDIT_VIEW_EMBASSY'],
  consular_officer: [],
  analyst: ['DIA_AI_FORECASTING', 'DIA_AI_BRIEFS', 'DIA_AI_SEGMENTS', 'REGISTRY_EXPORT_PDF', 'AUDIT_EXPORT'],
  executive_viewer: [],
  registrant: [],
};

const ROLES: PlatformRoleExcludingSuperAdmin[] = [
  'tenant_admin', 'embassy_admin', 'consular_officer', 'analyst', 'executive_viewer', 'registrant', 'economic_planner',
];

// Cumulative capabilities for a (tier, role) pair, de-duplicated.
export function getTierCapabilities(tier: DeploymentTier, role: PlatformRoleExcludingSuperAdmin): CapabilityCode[] {
  const set = new Set<CapabilityCode>(CLOUD[role] ?? []);
  if (tier === 'government' || tier === 'sovereign') {
    for (const c of GOVERNMENT_ADD[role] ?? []) set.add(c);
  }
  if (tier === 'sovereign') {
    for (const c of SOVEREIGN_ADD[role] ?? []) set.add(c);
  }
  return Array.from(set);
}

// All configurable roles (excludes super_admin which bypasses entitlements).
export const TIER_TEMPLATE_ROLES = ROLES;
