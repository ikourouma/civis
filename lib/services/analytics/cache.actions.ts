'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/services/auth';
import { recomputeAnalyticsCache } from './cache.service';

export async function refreshAnalyticsCacheAction(): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user?.tenantId) return { success: false, error: 'No tenant context' };
  await recomputeAnalyticsCache(user.tenantId);
  revalidatePath('/intelligence/dashboard');
  return { success: true };
}
