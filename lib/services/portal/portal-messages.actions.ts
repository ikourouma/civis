'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/services/auth';
import {
  createPortalMessage,
  deletePortalMessage,
  getTenantPortalMessages,
  reorderPortalMessages,
  updatePortalMessage,
  type PortalMessage,
  type PortalMessageInput,
} from './portal-messages.service';

const MAX_MESSAGES = 5;

async function tenantAdmin() {
  const user = await getCurrentUser();
  if (!user?.tenantId) return null;
  if (!['tenant_admin', 'super_admin'].includes(user.role)) return null;
  return user;
}

export async function loadPortalMessagesAction(): Promise<PortalMessage[]> {
  const user = await tenantAdmin();
  if (!user?.tenantId) return [];
  return getTenantPortalMessages(user.tenantId);
}

export async function createPortalMessageAction(data: PortalMessageInput): Promise<{ success: boolean; error?: string }> {
  const user = await tenantAdmin();
  if (!user?.tenantId) return { success: false, error: 'Unauthorized' };
  const existing = (await getTenantPortalMessages(user.tenantId)).filter((m) => m.isActive);
  if (existing.length >= MAX_MESSAGES) return { success: false, error: `Maximum ${MAX_MESSAGES} messages allowed.` };
  const { error } = await createPortalMessage(user.tenantId, data);
  if (!error) revalidatePath('/workspace/settings');
  return { success: !error, error: error ?? undefined };
}

export async function updatePortalMessageAction(id: string, data: PortalMessageInput): Promise<{ success: boolean; error?: string }> {
  const user = await tenantAdmin();
  if (!user?.tenantId) return { success: false, error: 'Unauthorized' };
  const { error } = await updatePortalMessage(user.tenantId, id, data);
  if (!error) revalidatePath('/workspace/settings');
  return { success: !error, error: error ?? undefined };
}

export async function deletePortalMessageAction(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await tenantAdmin();
  if (!user?.tenantId) return { success: false, error: 'Unauthorized' };
  const { error } = await deletePortalMessage(user.tenantId, id);
  if (!error) revalidatePath('/workspace/settings');
  return { success: !error, error: error ?? undefined };
}

export async function reorderPortalMessagesAction(orderedIds: string[]): Promise<{ success: boolean; error?: string }> {
  const user = await tenantAdmin();
  if (!user?.tenantId) return { success: false, error: 'Unauthorized' };
  const { error } = await reorderPortalMessages(user.tenantId, orderedIds);
  if (!error) revalidatePath('/workspace/settings');
  return { success: !error, error: error ?? undefined };
}
