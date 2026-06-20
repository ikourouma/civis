// Simple in-memory rate limiter (Mission 006-D, Deliverable 7.1).
// Sufficient for a single instance / demo; swap for Redis in production.
const store = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 10, windowMs = 3_600_000): boolean {
  const now = Date.now();
  const record = store.get(key);
  if (!record || record.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) return false;
  record.count++;
  return true;
}
