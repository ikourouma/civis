'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/services/auth';
import type { PlatformRole } from '@/lib/services/auth/auth.types';
import {
  getUserRecentActivity,
  resetPlatformUserPassword,
  setPlatformUserActive,
  updatePlatformUser,
  type UpdatePlatformUserInput,
} from './platform-users.service';

type Result = { success: boolean; error?: string };

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'super_admin') return null;
  return user;
}

export async function updatePlatformUserAction(userId: string, input: UpdatePlatformUserInput): Promise<Result> {
  const user = await requireSuperAdmin();
  if (!user) return { success: false, error: 'Unauthorized' };
  const { error } = await updatePlatformUser(userId, input, user.id, user.role);
  if (!error) revalidatePath('/admin/users');
  return { success: !error, error: error ?? undefined };
}

export async function changeUserTenantAction(userId: string, tenantId: string | null): Promise<Result> {
  const user = await requireSuperAdmin();
  if (!user) return { success: false, error: 'Unauthorized' };
  const { error } = await updatePlatformUser(userId, { tenantId }, user.id, user.role);
  if (!error) revalidatePath('/admin/users');
  return { success: !error, error: error ?? undefined };
}

export async function setPlatformUserActiveAction(userId: string, isActive: boolean): Promise<Result> {
  const user = await requireSuperAdmin();
  if (!user) return { success: false, error: 'Unauthorized' };
  const { error } = await setPlatformUserActive(userId, isActive, user.id, user.role);
  if (!error) revalidatePath('/admin/users');
  return { success: !error, error: error ?? undefined };
}

export async function resetPlatformUserPasswordAction(userId: string, email: string): Promise<Result> {
  const user = await requireSuperAdmin();
  if (!user) return { success: false, error: 'Unauthorized' };
  const { error } = await resetPlatformUserPassword(userId, email, user.id, user.role);
  return { success: !error, error: error ?? undefined };
}

export async function loadUserActivityAction(userId: string): Promise<{ action: string; createdAt: string }[]> {
  const user = await requireSuperAdmin();
  if (!user) return [];
  return getUserRecentActivity(userId);
}

// `role` re-exported for the client edit form typing convenience.
export type { PlatformRole };
