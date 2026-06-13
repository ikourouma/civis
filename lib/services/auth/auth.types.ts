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
  isActive: boolean;
  lastSignInAt: string | null;
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
