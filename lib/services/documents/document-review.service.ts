// Embassy/tenant-scoped document review listing (Mission 006-C, Bug B4).
import { createAdminClient } from '@/lib/supabase/admin';

export interface ReviewDocument {
  id: string;
  registrantId: string;
  registrantName: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  status: string;
  createdAt: string;
}

export interface DocumentReviewFilters {
  status?: string;
  documentType?: string;
  search?: string;
}

export interface DocumentReviewScope {
  tenantId: string;
  embassyId?: string; // when set, only documents of that embassy's registrants
}

interface DocRow {
  id: string;
  registrant_id: string;
  document_type: string;
  file_name: string;
  storage_path: string;
  status: string;
  created_at: string;
  civis_registrants: { first_name: string; last_name: string; embassy_id: string | null; tenant_id: string } | null;
}

export async function getDocumentsForReview(
  scope: DocumentReviewScope,
  filters: DocumentReviewFilters = {},
): Promise<ReviewDocument[]> {
  const admin = createAdminClient();
  let q = admin
    .from('civis_registrant_documents')
    .select('id, registrant_id, document_type, file_name, storage_path, status, created_at, civis_registrants(first_name, last_name, embassy_id, tenant_id)')
    .eq('tenant_id', scope.tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters.status) q = q.eq('status', filters.status);
  if (filters.documentType) q = q.eq('document_type', filters.documentType);

  const { data } = await q;
  let rows = (data as unknown as DocRow[]) ?? [];

  if (scope.embassyId) {
    rows = rows.filter((r) => r.civis_registrants?.embassy_id === scope.embassyId);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    rows = rows.filter((r) => {
      const name = `${r.civis_registrants?.first_name ?? ''} ${r.civis_registrants?.last_name ?? ''}`.toLowerCase();
      return name.includes(s);
    });
  }

  return rows.map((r) => ({
    id: r.id,
    registrantId: r.registrant_id,
    registrantName: `${r.civis_registrants?.first_name ?? ''} ${r.civis_registrants?.last_name ?? ''}`.trim() || 'Unknown',
    documentType: r.document_type,
    fileName: r.file_name,
    storagePath: r.storage_path,
    status: r.status,
    createdAt: r.created_at,
  }));
}
