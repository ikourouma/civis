// Canonical registration consent text, parameterized by government (tenant) name.
// Used both for display (consent page) and for the immutable snapshot stored at
// submission. Pure — safe on client and server. Bump CONSENT_VERSION on changes.

export const CONSENT_VERSION = '1.0';

export function buildConsentText(governmentName: string, lang: 'en' | 'fr'): string {
  if (lang === 'fr') {
    return `En m'inscrivant au registre de la diaspora de ${governmentName} via la plateforme Civis, je consens à la collecte, au stockage et au traitement de mes informations personnelles par ${governmentName} aux fins de gestion de la diaspora, de prestation de services consulaires et de planification économique. Je comprends que mes données seront traitées conformément aux lois applicables en matière de protection des données et à l'infrastructure de données souveraine de ${governmentName}, que je peux retirer ce consentement à tout moment, et que mes données personnelles ne seront ni vendues ni partagées avec des tiers sans mon consentement explicite.`;
  }
  return `By registering with the ${governmentName} diaspora registry via the Civis platform, I consent to the collection, storage, and processing of my personal information by ${governmentName} for the purposes of diaspora management, consular service delivery, and economic planning. I understand that my data will be handled in accordance with applicable data protection laws and ${governmentName}'s sovereign data infrastructure, that I may withdraw this consent at any time, and that my personal data will not be sold or shared with third parties without my explicit consent.`;
}
