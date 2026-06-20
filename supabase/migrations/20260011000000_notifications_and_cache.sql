-- ============================================================
-- Migration: 011 — Notification Center & Analytics Cache
-- Mission 006-D — Platform Polish, Tier Implementation
-- ============================================================

-- ── Notifications ──
CREATE TYPE notification_type AS ENUM (
  'registration_submitted',
  'registration_approved',
  'registration_rejected',
  'profile_updated',
  'document_uploaded',
  'document_verified',
  'document_rejected',
  'gdpr_request_received',
  'gdpr_request_completed',
  'staff_provisioned',
  'embassy_created',
  'entitlement_changed',
  'system_announcement',
  'welcome'
);

CREATE TABLE public.civis_notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  recipient_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  link_url          TEXT,
  is_read           BOOLEAN NOT NULL DEFAULT false,
  read_at           TIMESTAMPTZ,
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_notifications"
  ON public.civis_notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "users_update_own_notifications"
  ON public.civis_notifications FOR UPDATE
  USING (recipient_id = auth.uid());

-- System inserts notifications via the admin (service-role) client only.

CREATE INDEX idx_notifications_recipient ON public.civis_notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_tenant ON public.civis_notifications(tenant_id);

-- ── Analytics cache ──
CREATE TABLE public.civis_analytics_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  embassy_id    UUID REFERENCES public.civis_embassies(id) ON DELETE CASCADE,
  metric_key    TEXT NOT NULL,
  metric_value  JSONB NOT NULL,
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, embassy_id, metric_key)
);

ALTER TABLE public.civis_analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read_own_cache"
  ON public.civis_analytics_cache FOR SELECT
  USING (
    tenant_id = public.current_user_tenant_id()
    OR public.current_user_role() = 'super_admin'
  );

CREATE INDEX idx_analytics_cache_lookup ON public.civis_analytics_cache(tenant_id, metric_key);
