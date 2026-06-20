-- ============================================================
-- Migration: 012 — Portal Messages (rotating registration-portal carousel)
-- ============================================================

CREATE TABLE public.civis_portal_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.civis_tenants(id) ON DELETE CASCADE,
  headline_en TEXT NOT NULL,
  headline_fr TEXT,
  subtitle_en TEXT,
  subtitle_fr TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.civis_portal_messages ENABLE ROW LEVEL SECURITY;

-- The portal carousel is public (pre-auth), so reads are open.
CREATE POLICY "authenticated_read_portal_messages"
  ON public.civis_portal_messages FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "public_read_portal_messages"
  ON public.civis_portal_messages FOR SELECT
  USING (true);

CREATE POLICY "tenant_admin_manage_own_messages"
  ON public.civis_portal_messages FOR ALL
  USING (
    tenant_id = public.current_user_tenant_id()
    AND public.current_user_role() IN ('tenant_admin', 'super_admin')
  );

CREATE POLICY "super_admin_all_messages"
  ON public.civis_portal_messages FOR ALL
  USING (public.current_user_role() = 'super_admin');

CREATE INDEX idx_portal_messages_tenant ON public.civis_portal_messages(tenant_id, sort_order);

CREATE TRIGGER portal_messages_updated_at
  BEFORE UPDATE ON public.civis_portal_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
