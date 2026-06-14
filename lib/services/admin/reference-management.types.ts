// Shared types + constants for reference-data administration.
// Kept separate from the 'use server' actions module (which may only export async fns).

export type SuggestionCategory =
  | 'occupation'
  | 'industry'
  | 'field_of_study'
  | 'diaspora_association'
  | 'employer';

export type SuggestionStatus = 'approved' | 'pending_review' | 'rejected' | 'merged';

export type CanonicalTab =
  | 'countries'
  | 'occupations'
  | 'industries'
  | 'fields'
  | 'education'
  | 'associations';

export interface RegistrySuggestion {
  id: string;
  tenantId: string | null;
  tenantName: string | null;
  suggestedBy: string | null;
  suggestedByEmail: string | null;
  category: SuggestionCategory;
  suggestedValue: string;
  language: string;
  context: string | null;
  status: SuggestionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewerNotes: string | null;
  mergedIntoTable: string | null;
  mergedIntoId: string | null;
  createdAt: string;
}

export interface CanonicalEntry {
  id: string;
  nameEn: string;
  nameFr: string | null;
  category: string | null;
  usageCount: number;
  // Tab-specific optionals
  naicsCode?: string | null;
  flagEmoji?: string;
  isoCode?: string;
  isAUMember?: boolean;
  levelOrder?: number;
  countryCode?: string | null;
}

export interface SuggestionFilters {
  category?: SuggestionCategory;
  status?: SuggestionStatus;
  tenantId?: string;
  query?: string;
}

// suggestion_category -> canonical table (employer has no canonical table)
export const CATEGORY_TABLE: Record<SuggestionCategory, string | null> = {
  occupation: 'civis_occupations',
  industry: 'civis_industries',
  field_of_study: 'civis_fields_of_study',
  diaspora_association: 'civis_diaspora_associations',
  employer: null,
};

// admin tab -> canonical table
export const TAB_TABLE: Record<CanonicalTab, string> = {
  countries: 'civis_countries',
  occupations: 'civis_occupations',
  industries: 'civis_industries',
  fields: 'civis_fields_of_study',
  education: 'civis_education_levels',
  associations: 'civis_diaspora_associations',
};

// admin tab -> suggestion category (for the merge picker / add-new shape)
export const TAB_CATEGORY: Partial<Record<CanonicalTab, SuggestionCategory>> = {
  occupations: 'occupation',
  industries: 'industry',
  fields: 'field_of_study',
  associations: 'diaspora_association',
};
