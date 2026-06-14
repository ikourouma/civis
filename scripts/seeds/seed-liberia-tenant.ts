// Seed the Liberia demo environment: tenant + settings + Embassy D.C. + 7 personas.
// Idempotent — safe to re-run. Requires the Liberia brand (Mission 005-A.2 seed) first.
// Run: npx tsx scripts/seeds/seed-liberia-tenant.ts
import { seedClient } from './_client';

const TEMP_PASSWORD = 'Civis@TempAdmin2026';
const EMBASSY_NAME = 'Embassy of Liberia — Washington D.C.';

type PlatformRole =
  | 'tenant_admin'
  | 'executive_viewer'
  | 'embassy_admin'
  | 'consular_officer'
  | 'analyst'
  | 'registrant';

async function main() {
  const admin = seedClient();
  console.log('Seeding Liberia tenant and personas...\n');

  // 1. Liberia brand
  const { data: brand, error: brandError } = await admin
    .from('civis_country_branding')
    .select('id')
    .eq('country_code', 'LR')
    .single();

  if (brandError || !brand) {
    console.error('❌ Liberia brand not found. Run the Mission 005-A.2 brand seed first.');
    process.exit(1);
  }

  // 2. Liberia tenant (country_code is UNIQUE → upsert)
  const { data: tenant, error: tenantError } = await admin
    .from('civis_tenants')
    .upsert(
      {
        name: 'Republic of Liberia',
        country_code: 'LR',
        official_country_name: 'Republic of Liberia',
        region: 'West Africa',
        deployment_tier: 'government',
        status: 'pilot',
        default_language: 'en',
        supported_languages: ['en'],
        currency_code: 'LRD',
        timezone: 'Africa/Monrovia',
        data_residency_region: 'us-east-1',
        data_residency_notes:
          'Pilot deployment — data residency to be migrated to West Africa region on production rollout',
        primary_contact_email: 'tenantadmin.lr@civisos.com',
        branding_id: brand.id,
        contract_start_date: new Date().toISOString().split('T')[0],
      },
      { onConflict: 'country_code' },
    )
    .select()
    .single();

  if (tenantError || !tenant) {
    console.error('❌ Failed to create Liberia tenant:', tenantError?.message);
    return;
  }
  console.log(`✅ Liberia tenant: ${tenant.id}`);

  // 3. Tenant settings (UNIQUE(tenant_id) → upsert)
  await admin
    .from('civis_tenant_settings')
    .upsert(
      { tenant_id: tenant.id, enable_dia_ai: true, enable_economic_intelligence: true },
      { onConflict: 'tenant_id' },
    );
  console.log('✅ Tenant settings configured');

  // 4. Embassy D.C. (no unique constraint on name → check-then-insert)
  let embassyId: string | undefined;
  const { data: existingEmbassy } = await admin
    .from('civis_embassies')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('name', EMBASSY_NAME)
    .maybeSingle();

  if (existingEmbassy) {
    embassyId = existingEmbassy.id;
    console.log(`↺ Embassy D.C. exists: ${embassyId}`);
  } else {
    const { data: embassy, error: embassyError } = await admin
      .from('civis_embassies')
      .insert({
        tenant_id: tenant.id,
        name: EMBASSY_NAME,
        mission_type: 'embassy',
        host_country: 'United States of America',
        host_country_code: 'US',
        host_city: 'Washington D.C.',
        address: '5201 16th Street NW, Washington, DC 20011, USA',
        email: 'info@liberianembassyus.org',
        phone: '+1 202 723 0437',
        website: 'https://www.liberianembassyus.org',
        jurisdiction_description:
          'Liberian citizens residing in the United States of America and Canada',
        head_of_mission: 'Ambassador — Republic of Liberia',
        status: 'active',
        timezone: 'America/New_York',
      })
      .select('id')
      .single();
    if (embassyError || !embassy) {
      console.error('❌ Embassy creation failed:', embassyError?.message);
      return;
    }
    embassyId = embassy.id;
    console.log(`✅ Liberian Embassy D.C. created: ${embassyId}`);
  }

  // 5. Embassy jurisdictions (no unique constraint → check-then-insert)
  const jurisdictions = [
    { country_code: 'US', country_name: 'United States of America' },
    { country_code: 'CA', country_name: 'Canada' },
  ];
  for (const jur of jurisdictions) {
    const { data: existing } = await admin
      .from('civis_embassy_jurisdictions')
      .select('id')
      .eq('embassy_id', embassyId)
      .eq('country_code', jur.country_code)
      .maybeSingle();
    if (!existing) {
      await admin.from('civis_embassy_jurisdictions').insert({
        tenant_id: tenant.id,
        embassy_id: embassyId,
        country_code: jur.country_code,
        country_name: jur.country_name,
      });
    }
  }
  console.log('✅ Embassy jurisdictions configured (US, CA)');

  // 6. Provision 7 Liberian personas
  const personas: {
    email: string;
    role: PlatformRole;
    full_name: string;
    assign_embassy: string | null;
  }[] = [
    { email: 'tenantadmin.lr@civisos.com', role: 'tenant_admin', full_name: 'Liberia Diaspora Platform Administrator', assign_embassy: null },
    { email: 'minister.lr@civisos.com', role: 'executive_viewer', full_name: 'Minister of Foreign Affairs — Republic of Liberia', assign_embassy: null },
    { email: 'ambassador.dc.lr@civisos.com', role: 'executive_viewer', full_name: 'Ambassador — Republic of Liberia, Washington D.C.', assign_embassy: embassyId! },
    { email: 'embassyadmin.dc.lr@civisos.com', role: 'embassy_admin', full_name: 'Head of Chancery — Liberian Embassy, Washington D.C.', assign_embassy: embassyId! },
    { email: 'consular.dc.lr@civisos.com', role: 'consular_officer', full_name: 'Consular Officer — Liberian Embassy, Washington D.C.', assign_embassy: embassyId! },
    { email: 'analyst.lr@civisos.com', role: 'analyst', full_name: 'Senior Analyst — Liberia Diaspora Affairs Bureau', assign_embassy: null },
    { email: 'citizen.lr@civisos.com', role: 'registrant', full_name: 'Liberian Diaspora Citizen', assign_embassy: null },
  ];

  for (const persona of personas) {
    try {
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: persona.email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: persona.full_name, role: persona.role },
      });

      let userId: string;
      if (authError) {
        if (authError.message.toLowerCase().includes('already')) {
          const { data: existingUsers } = await admin.auth.admin.listUsers();
          const existing = existingUsers.users.find((u) => u.email === persona.email);
          if (!existing) {
            console.error(`❌ ${persona.email}: ${authError.message}`);
            continue;
          }
          userId = existing.id;
          console.log(`↺ User exists: ${persona.email}`);
        } else {
          console.error(`❌ Auth creation failed for ${persona.email}: ${authError.message}`);
          continue;
        }
      } else if (authData?.user) {
        userId = authData.user.id;
      } else {
        console.error(`❌ No user returned for ${persona.email}`);
        continue;
      }

      // Upsert (not update) so the profile exists even if the auth trigger skipped it.
      const { error: profileError } = await admin
        .from('profiles')
        .upsert(
          {
            id: userId,
            email: persona.email,
            full_name: persona.full_name,
            role: persona.role,
            tenant_id: tenant.id,
          },
          { onConflict: 'id' },
        );
      if (profileError) {
        console.error(`⚠️  Profile upsert failed for ${persona.email}: ${profileError.message}`);
      }

      if (persona.assign_embassy) {
        await admin
          .from('civis_embassy_staff')
          .upsert(
            {
              tenant_id: tenant.id,
              embassy_id: persona.assign_embassy,
              user_id: userId,
              role: persona.role,
              is_active: true,
            },
            { onConflict: 'embassy_id,user_id' },
          );
      }

      await admin.from('audit_logs').insert({
        user_email: 'system@civisos.com',
        user_role: 'super_admin',
        action: 'PERSONA_PROVISIONED',
        resource: 'auth.users',
        resource_id: userId,
        metadata: {
          email: persona.email,
          role: persona.role,
          tenant: 'Liberia',
          embassy_assigned: persona.assign_embassy ?? null,
          mission: 'Mission-005-B',
        },
      });

      console.log(`✅ Provisioned: ${persona.email} (${persona.role})`);
    } catch (err) {
      console.error(`❌ Exception for ${persona.email}:`, err);
    }
  }

  console.log('\n✅ Liberia tenant + 7 personas seeded.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
