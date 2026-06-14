// Reference autocomplete search — read-only, browser-client safe.
// Canonical reference tables are RLS-readable by all authenticated users.
import { createClient } from '@/lib/supabase/client';

export type ReferenceCategory =
  | 'occupation'
  | 'industry'
  | 'field_of_study'
  | 'diaspora_association'
  | 'employer';

export interface ReferenceMatch {
  id: string;
  value: string; // localized display value
  valueEn: string;
  category: string | null;
  usageCount: number;
}

// Maps a reference category to its canonical table. 'employer' has no canonical
// table (free-text only) — searches return empty so the capture flow takes over.
const TABLE_BY_CATEGORY: Record<ReferenceCategory, string | null> = {
  occupation: 'civis_occupations',
  industry: 'civis_industries',
  field_of_study: 'civis_fields_of_study',
  diaspora_association: 'civis_diaspora_associations',
  employer: null,
};

export async function searchReference(
  category: ReferenceCategory,
  query: string,
  locale: 'en' | 'fr' = 'en',
  limit = 10,
): Promise<ReferenceMatch[]> {
  const table = TABLE_BY_CATEGORY[category];
  if (!table || query.trim().length < 2) return [];

  const supabase = createClient();
  const hasCategory = category === 'occupation' || category === 'field_of_study';

  const columns = ['id', 'name_en', 'name_fr', 'usage_count', hasCategory ? 'category' : null]
    .filter(Boolean)
    .join(', ');

  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .or(`name_en.ilike.%${query}%,name_fr.ilike.%${query}%`)
    .order('usage_count', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as unknown as {
    id: string;
    name_en: string;
    name_fr: string | null;
    usage_count: number;
    category?: string | null;
  }[]).map((row) => ({
    id: row.id,
    value: locale === 'fr' && row.name_fr ? row.name_fr : row.name_en,
    valueEn: row.name_en,
    category: row.category ?? null,
    usageCount: row.usage_count,
  }));
}
