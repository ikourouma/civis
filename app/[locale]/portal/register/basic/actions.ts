'use server';

import { headers } from 'next/headers';

import { buildConsentText, CONSENT_VERSION } from '@/lib/services/consent/consent-text';
import { submitBasicRegistration, type BasicRegistrationResult } from '@/lib/services/registrants';
import { getPublicTenantById } from '@/lib/services/tenants/public-tenant.service';

export interface BasicRegistrationActionInput {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  preferredLanguage: string;
  consentLanguage: 'en' | 'fr';
}

export async function submitBasicRegistrationAction(
  input: BasicRegistrationActionInput,
): Promise<BasicRegistrationResult> {
  const tenant = await getPublicTenantById(input.tenantId);
  if (!tenant) {
    return { registrantId: null, profileId: null, status: null, error: 'Invalid tenant.' };
  }

  const governmentName = tenant.displayName[input.consentLanguage] ?? tenant.displayName.en;
  const consentTextSnapshot = buildConsentText(governmentName, input.consentLanguage);

  const headersList = await headers();
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    undefined;
  const userAgent = headersList.get('user-agent') ?? undefined;

  return submitBasicRegistration({
    tenantId: input.tenantId,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phoneCountryCode: input.phoneCountryCode,
    phoneNumber: input.phoneNumber,
    preferredLanguage: input.preferredLanguage,
    consentTextSnapshot,
    consentVersion: CONSENT_VERSION,
    consentLanguage: input.consentLanguage,
    ipAddress,
    userAgent,
  });
}
