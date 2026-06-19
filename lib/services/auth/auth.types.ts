export type PlatformRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'embassy_admin'
  | 'consular_officer'
  | 'analyst'
  | 'executive_viewer'
  | 'registrant'
  | 'economic_planner';

export interface CivisUser {
  id: string;
  email: string;
  fullName: string | null;
  role: PlatformRole;
  tenantId: string | null;
  embassyIds: string[]; // Active embassy assignments (Mission 005-B)
  isActive: boolean;
  lastSignInAt: string | null;
  diplomaticTitle?: string | null; // Display-only institutional title (Mission 006-C)
}

export interface ScopedQuery {
  tenantId: string;
  embassyIds?: string[]; // If present, scope further to these embassies
  isEmbassyScoped: boolean;
}

// Resolve the data scope for a user — embassy-scoped if they have assignments.
export function getScopeForUser(user: CivisUser): ScopedQuery {
  return {
    tenantId: user.tenantId!,
    embassyIds: user.embassyIds.length > 0 ? user.embassyIds : undefined,
    isEmbassyScoped: user.embassyIds.length > 0,
  };
}

export interface CivisSession {
  user: CivisUser;
  accessToken: string;
  expiresAt: number;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  session?: CivisSession;
  error?: string;
}
