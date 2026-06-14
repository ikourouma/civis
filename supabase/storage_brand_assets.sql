-- ============================================================
-- Storage: brand-assets bucket
-- Civis Sovereign Intelligence Platform — Afronovation, Inc.
-- ============================================================
-- Public read for crests/seals/flags (needed for inline rendering in browser)
-- but only super_admin may upload/manage.
-- Run after migration 005.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brand-assets',
  'brand-assets',
  true,  -- Public read — brand assets must be embeddable
  5242880,  -- 5MB per file
  ARRAY['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Anyone can READ brand assets (needed for inline image rendering)
CREATE POLICY "public_read_brand_assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets');

-- Only super admin can UPLOAD/UPDATE/DELETE brand assets
CREATE POLICY "super_admin_manage_brand_assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'brand-assets'
    AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'super_admin'
  );

CREATE POLICY "super_admin_update_brand_assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'brand-assets'
    AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'super_admin'
  );

CREATE POLICY "super_admin_delete_brand_assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'brand-assets'
    AND (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'super_admin'
  );

-- Storage path convention: {country_code_lowercase}/{asset_type}.{ext}
--   ci/flag.svg   gh/flag.svg   lr/flag.svg   lr/seal.svg
