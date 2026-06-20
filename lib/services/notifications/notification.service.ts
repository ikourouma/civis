// Structured system notification feed (Mission 006-D, Deliverable 5).
import { getCurrentUser } from '@/lib/services/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export type NotificationType =
  | 'registration_submitted'
  | 'registration_approved'
  | 'registration_rejected'
  | 'profile_updated'
  | 'document_uploaded'
  | 'document_verified'
  | 'document_rejected'
  | 'gdpr_request_received'
  | 'gdpr_request_completed'
  | 'staff_provisioned'
  | 'embassy_created'
  | 'entitlement_changed'
  | 'system_announcement'
  | 'welcome';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
  metadata: Record<string, unknown>;
}

interface NotificationRow {
  id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.notification_type,
    title: row.title,
    body: row.body,
    linkUrl: row.link_url,
    isRead: row.is_read,
    createdAt: row.created_at,
    metadata: row.metadata ?? {},
  };
}

export interface CreateNotificationInput {
  tenantId?: string | null;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const admin = createAdminClient();
  await admin.from('civis_notifications').insert({
    tenant_id: input.tenantId ?? null,
    recipient_id: input.recipientId,
    notification_type: input.type,
    title: input.title,
    body: input.body,
    link_url: input.linkUrl ?? null,
    metadata: input.metadata ?? {},
  });
}

async function createMany(recipients: string[], base: Omit<CreateNotificationInput, 'recipientId'>): Promise<void> {
  if (recipients.length === 0) return;
  const admin = createAdminClient();
  await admin.from('civis_notifications').insert(
    recipients.map((recipientId) => ({
      tenant_id: base.tenantId ?? null,
      recipient_id: recipientId,
      notification_type: base.type,
      title: base.title,
      body: base.body,
      link_url: base.linkUrl ?? null,
      metadata: base.metadata ?? {},
    })),
  );
}

// ── Reads (current user) ──
export async function getMyNotifications(limit = 50, unreadOnly = false): Promise<Notification[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const admin = createAdminClient();
  let q = admin
    .from('civis_notifications')
    .select('id, notification_type, title, body, link_url, is_read, created_at, metadata')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (unreadOnly) q = q.eq('is_read', false);
  const { data } = await q;
  return ((data as NotificationRow[]) ?? []).map(mapNotification);
}

export async function getUnreadCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  const admin = createAdminClient();
  const { count } = await admin
    .from('civis_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', user.id)
    .eq('is_read', false);
  return count ?? 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const admin = createAdminClient();
  await admin
    .from('civis_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('recipient_id', user.id);
}

export async function markAllAsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const admin = createAdminClient();
  await admin
    .from('civis_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_id', user.id)
    .eq('is_read', false);
}

// ── Recipient resolution helpers ──
async function tenantAdmins(tenantId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('role', 'tenant_admin')
    .eq('is_active', true);
  return ((data as { id: string }[]) ?? []).map((p) => p.id);
}

async function embassyStaff(embassyId: string): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('civis_embassy_staff')
    .select('user_id')
    .eq('embassy_id', embassyId)
    .eq('is_active', true);
  return ((data as { user_id: string }[]) ?? []).map((s) => s.user_id);
}

// ── Event notify helpers ──
export async function notifyRegistrationSubmitted(
  tenantId: string,
  registrantName: string,
  embassyId?: string | null,
): Promise<void> {
  const recipients = embassyId ? await embassyStaff(embassyId) : await tenantAdmins(tenantId);
  await createMany(recipients.length ? recipients : await tenantAdmins(tenantId), {
    tenantId,
    type: 'registration_submitted',
    title: 'New registration submitted',
    body: `${registrantName} submitted a registration for review.`,
    linkUrl: '/workspace/cases',
  });
}

export async function notifyRegistrationApproved(registrantProfileId: string | null, registrantName: string): Promise<void> {
  if (!registrantProfileId) return;
  await createNotification({
    recipientId: registrantProfileId,
    type: 'registration_approved',
    title: 'Registration approved',
    body: `Your registration has been approved, ${registrantName}. Welcome.`,
    linkUrl: '/portal/dashboard',
  });
}

export async function notifyRegistrationRejected(
  registrantProfileId: string | null,
  reason: string,
): Promise<void> {
  if (!registrantProfileId) return;
  await createNotification({
    recipientId: registrantProfileId,
    type: 'registration_rejected',
    title: 'Registration needs attention',
    body: `Your registration was not approved. Reason: ${reason}`,
    linkUrl: '/portal/profile/complete',
  });
}

export async function notifyDocumentReviewed(
  registrantProfileId: string | null,
  decision: 'verified' | 'rejected',
): Promise<void> {
  if (!registrantProfileId) return;
  await createNotification({
    recipientId: registrantProfileId,
    type: decision === 'verified' ? 'document_verified' : 'document_rejected',
    title: decision === 'verified' ? 'Document verified' : 'Document rejected',
    body: decision === 'verified' ? 'One of your documents has been verified.' : 'One of your documents was rejected. Please review and re-upload.',
    linkUrl: '/portal/documents',
  });
}

export async function notifyGDPRRequest(tenantId: string, requestType: string, registrantName: string): Promise<void> {
  await createMany(await tenantAdmins(tenantId), {
    tenantId,
    type: 'gdpr_request_received',
    title: 'GDPR request received',
    body: `${registrantName} submitted a ${requestType.replace('_', ' ')} request.`,
    linkUrl: '/workspace/gdpr',
  });
}

export async function notifyStaffProvisioned(tenantId: string, profileId: string, fullName: string): Promise<void> {
  await createNotification({
    tenantId,
    recipientId: profileId,
    type: 'staff_provisioned',
    title: 'Welcome to Civis',
    body: `Your account has been provisioned, ${fullName}. You can now sign in and begin work.`,
    linkUrl: '/workspace/dashboard',
  });
}

export async function notifyEmbassyCreated(tenantId: string, embassyName: string): Promise<void> {
  await createMany(await tenantAdmins(tenantId), {
    tenantId,
    type: 'embassy_created',
    title: 'Embassy created',
    body: `${embassyName} has been added to your deployment.`,
    linkUrl: '/workspace/embassy/manage',
  });
}
