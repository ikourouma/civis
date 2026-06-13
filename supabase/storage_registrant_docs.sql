-- ============================================================
-- Supabase Storage — Registrant Documents Bucket
-- Run in Supabase Dashboard → SQL Editor AFTER Migration 003
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'registrant-documents',
  'registrant-documents',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Embassy staff: upload documents (tenant-scoped path)
CREATE POLICY "embassy_staff_upload_documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'registrant-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Embassy staff: read documents within their tenant
CREATE POLICY "embassy_staff_read_documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'registrant-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (
      SELECT tenant_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Registrant: full access to their own document folder
CREATE POLICY "registrant_own_storage_documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'registrant-documents'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Document path convention: {tenant_id}/{registrant_id}/{document_type}_{timestamp}.{ext}
