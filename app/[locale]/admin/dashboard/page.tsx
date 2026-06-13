import { getCurrentUser } from '@/lib/services/auth';

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-deepest">
      <div className="text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gold">
          Authentication Verified
        </p>
        <h1 className="mb-2 text-3xl font-bold text-white">
          Welcome, {user?.fullName ?? user?.email}
        </h1>
        <p className="text-sm text-surface/60">Role: {user?.role}</p>
        <p className="mt-6 text-sm text-surface/40">
          Super Admin workspace arrives in Mission 003.
        </p>
      </div>
    </div>
  );
}
