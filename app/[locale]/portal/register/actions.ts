'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/services/auth';
import { captureConsent } from '@/lib/services/consent';
import { createRegistrant } from '@/lib/services/registrants';
import type { CreateRegistrantInput } from '@/lib/services/registrants';

export interface RegistrationFormData {
  // Personal
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality: string;
  dualNationality?: string;
  countryOfBirth?: string;
  cityOfBirth?: string;

  // Contact
  email?: string;
  phonePrimary?: string;
  preferredLanguage?: string;
  countryOfResidence: string;
  cityOfResidence: string;
  yearsAbroad?: number;
  entryYear?: number;

  // Professional
  occupation?: string;
  employer?: string;
  industrySector?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  generation?: string;
  diasporaAssociation?: string;
  returnInterest?: boolean;
  investmentInterest?: boolean;

  // Consent (captured at step 1, persisted at step 5)
  consentText: string;
  consentLanguage: string;
}

export async function submitRegistrationAction(
  data: RegistrationFormData,
): Promise<{ success: boolean; error: string | null }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized. Please sign in.' };

  if (!user.tenantId) return { success: false, error: 'No tenant associated with your account.' };

  // Get request metadata for consent audit trail
  const headersList = await headers();
  const ipAddress = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? undefined;
  const userAgent = headersList.get('user-agent') ?? undefined;

  // Step 1: Persist consent record FIRST (consent-first architecture).
  // No personal data has been stored until this point.
  const { consentRecordId, error: consentError } = await captureConsent(
    user.tenantId,
    null, // registrant not yet created
    data.consentText,
    data.consentLanguage,
    user.id,
    ipAddress,
    userAgent,
  );

  if (consentError || !consentRecordId) {
    return { success: false, error: consentError ?? 'Failed to record consent. Please try again.' };
  }

  // Step 2: Create registrant record atomically with the consent record ID.
  const input: CreateRegistrantInput = {
    tenantId: user.tenantId,
    profileId: user.id,
    firstName: data.firstName,
    lastName: data.lastName,
    middleName: data.middleName,
    preferredName: data.preferredName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    nationality: data.nationality,
    dualNationality: data.dualNationality,
    countryOfBirth: data.countryOfBirth,
    cityOfBirth: data.cityOfBirth,
    email: data.email,
    phonePrimary: data.phonePrimary,
    preferredLanguage: data.preferredLanguage ?? data.consentLanguage,
    countryOfResidence: data.countryOfResidence,
    cityOfResidence: data.cityOfResidence,
    yearsAbroad: data.yearsAbroad,
    entryYear: data.entryYear,
    occupation: data.occupation,
    employer: data.employer,
    industrySector: data.industrySector,
    educationLevel: data.educationLevel,
    fieldOfStudy: data.fieldOfStudy,
    generation: data.generation,
    diasporaAssociation: data.diasporaAssociation,
    returnInterest: data.returnInterest ?? false,
    investmentInterest: data.investmentInterest ?? false,
    consentRecordId,
  };

  const { registrant, error: registrantError } = await createRegistrant(input);

  if (registrantError || !registrant) {
    return { success: false, error: registrantError ?? 'Failed to submit registration.' };
  }

  revalidatePath('/portal/dashboard');
  return { success: true, error: null };
}
