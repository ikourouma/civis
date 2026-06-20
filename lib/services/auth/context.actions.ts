'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/services/auth';

const TENANT_CONTEXT_COOKIE = 'tenant_context';

// Super admin enters a tenant's workspace ("View as Tenant"). Mission 006-D D4.
export async function setTenantContextAction(tenantId: string, locale: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return;
  cookies().set(TENANT_CONTEXT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  redirect(`/${locale}/workspace/dashboard`);
}

export async function clearTenantContextAction(locale: string): Promise<void> {
  cookies().delete(TENANT_CONTEXT_COOKIE);
  redirect(`/${locale}/admin/tenants`);
}
