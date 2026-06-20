'use server';

import { revalidatePath } from 'next/cache';

import {
  getMyNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  type Notification,
} from './notification.service';

export async function loadNotificationsAction(unreadOnly = false): Promise<Notification[]> {
  return getMyNotifications(50, unreadOnly);
}

export async function unreadCountAction(): Promise<number> {
  return getUnreadCount();
}

export async function markReadAction(notificationId: string): Promise<void> {
  await markAsRead(notificationId);
  revalidatePath('/workspace/notifications');
}

export async function markAllReadAction(): Promise<void> {
  await markAllAsRead();
  revalidatePath('/workspace/notifications');
}
