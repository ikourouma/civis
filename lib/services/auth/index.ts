// Server-safe barrel — safe to import in Server Components and Route Handlers.
// Client components must import directly from auth.client.service to avoid
// pulling next/headers into the browser bundle.
export { getSession, getCurrentUser } from './auth.service';
export { signIn, signOut } from './auth.client.service';
export { getUserProfile, updateUserProfile } from './profile.service';
export type { CivisUser, CivisSession, PlatformRole } from './auth.types';
