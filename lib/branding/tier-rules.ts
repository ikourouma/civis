// Deployment-tier branding rules — how the Civis identity and the country identity
// co-present across Cloud / Government / Sovereign deployments.
// See lib/branding/README.md (Tier-Dependent Behaviors).

export type DeploymentTier = 'cloud' | 'government' | 'sovereign';

export interface TierBrandingRules {
  showCivisAttribution: boolean;
  civisAttributionPlacement: 'header' | 'footer' | 'hidden';
  showCountryBrand: boolean;
  primaryIdentity: 'civis' | 'country' | 'balanced';
  headerLockup: 'civis-only' | 'civis-with-country-accent' | 'civis-and-country' | 'country-only';
  documentBranding: 'civis' | 'country' | 'both';
  emailBranding: 'civis' | 'country' | 'both';
}

export function getBrandingRules(tier: DeploymentTier): TierBrandingRules {
  switch (tier) {
    case 'cloud':
      // Civis-first: Civis is the primary identity, country shown as accent
      return {
        showCivisAttribution: true,
        civisAttributionPlacement: 'header',
        showCountryBrand: true,
        primaryIdentity: 'civis',
        headerLockup: 'civis-with-country-accent',
        documentBranding: 'civis',
        emailBranding: 'civis',
      };
    case 'government':
      // Balanced: Both Civis and country represented prominently
      return {
        showCivisAttribution: true,
        civisAttributionPlacement: 'footer',
        showCountryBrand: true,
        primaryIdentity: 'balanced',
        headerLockup: 'civis-and-country',
        documentBranding: 'both',
        emailBranding: 'both',
      };
    case 'sovereign':
      // Country-first: Country is primary identity, Civis minimized
      return {
        showCivisAttribution: false,
        civisAttributionPlacement: 'hidden',
        showCountryBrand: true,
        primaryIdentity: 'country',
        headerLockup: 'country-only',
        documentBranding: 'country',
        emailBranding: 'country',
      };
  }
}

// Map a brand source to its default deployment tier (used when a tenant has no
// explicit tier set). bridge55/liberia_asset brands imply a dedicated national
// deployment; the manual platform brand implies shared cloud.
export function tierForBrandSource(
  source: 'bridge55' | 'liberia_asset' | 'manual' | undefined,
): DeploymentTier {
  if (source === 'bridge55' || source === 'liberia_asset') return 'government';
  return 'cloud';
}
