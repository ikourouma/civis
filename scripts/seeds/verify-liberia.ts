// Read-only verification of the Liberia demo seed (Mission 005-B).
// Run: npx tsx scripts/seeds/verify-liberia.ts
import { seedClient } from './_client';

const EMBASSY_NAME = 'Embassy of Liberia — Washington D.C.';
const PERSONAS = [
  { email: 'tenantadmin.lr@civisos.com', role: 'tenant_admin', embassy: false },
  { email: 'minister.lr@civisos.com', role: 'executive_viewer', embassy: false },
  { email: 'ambassador.dc.lr@civisos.com', role: 'executive_viewer', embassy: true },
  { email: 'embassyadmin.dc.lr@civisos.com', role: 'embassy_admin', embassy: true },
  { email: 'consular.dc.lr@civisos.com', role: 'consular_officer', embassy: true },
  { email: 'analyst.lr@civisos.com', role: 'analyst', embassy: false },
  { email: 'citizen.lr@civisos.com', role: 'registrant', embassy: false },
];

const ok = (b: boolean) => (b ? '✅' : '❌');
let failures = 0;
function check(label: string, pass: boolean, detail = '') {
  if (!pass) failures++;
  console.log(`  ${ok(pass)} ${label}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  const admin = seedClient();
  console.log('\nVerifying Liberia demo environment...\n');

  // Tenant
  const { data: tenant } = await admin
    .from('civis_tenants')
    .select('id, name, status, deployment_tier, branding_id, country_code')
    .eq('country_code', 'LR')
    .maybeSingle();
  console.log('Tenant:');
  check('LR tenant exists', !!tenant, tenant?.name);
  check('deployment_tier = government', tenant?.deployment_tier === 'government');
  check('status = pilot', tenant?.status === 'pilot');
  check('branding_id linked', !!tenant?.branding_id);

  if (!tenant) {
    console.log('\n❌ No Liberia tenant — run: npx tsx scripts/seeds/seed-liberia-tenant.ts\n');
    process.exit(1);
  }

  // Brand link points to LR brand
  const { data: brand } = await admin
    .from('civis_country_branding')
    .select('id, country_code, seal_asset_path')
    .eq('id', tenant.branding_id)
    .maybeSingle();
  check('branding resolves to LR brand', brand?.country_code === 'LR');
  check('LR seal asset path set', !!brand?.seal_asset_path, brand?.seal_asset_path ?? 'missing');

  // Embassy
  const { data: embassy } = await admin
    .from('civis_embassies')
    .select('id, status')
    .eq('tenant_id', tenant.id)
    .eq('name', EMBASSY_NAME)
    .maybeSingle();
  console.log('\nEmbassy:');
  check('Embassy D.C. exists', !!embassy);
  check('Embassy status = active', embassy?.status === 'active');

  if (embassy) {
    const { data: jur } = await admin
      .from('civis_embassy_jurisdictions')
      .select('country_code')
      .eq('embassy_id', embassy.id);
    const codes = (jur ?? []).map((j) => j.country_code).sort();
    check('Jurisdictions US + CA', codes.includes('US') && codes.includes('CA'), codes.join(', '));
  }

  // Personas
  console.log('\nPersonas:');
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const p of PERSONAS) {
    const authUser = authUsers?.users.find((u) => u.email === p.email);
    if (!authUser) {
      check(p.email, false, 'no auth user');
      continue;
    }
    const { data: profile } = await admin
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', authUser.id)
      .maybeSingle();

    const roleOk = profile?.role === p.role;
    const tenantOk = profile?.tenant_id === tenant.id;

    let embassyOk = true;
    if (p.embassy && embassy) {
      const { data: staff } = await admin
        .from('civis_embassy_staff')
        .select('embassy_id, is_active')
        .eq('user_id', authUser.id)
        .eq('embassy_id', embassy.id)
        .eq('is_active', true)
        .maybeSingle();
      embassyOk = !!staff;
    } else {
      // National-scope users must NOT be embassy-assigned
      const { count } = await admin
        .from('civis_embassy_staff')
        .select('embassy_id', { count: 'exact', head: true })
        .eq('user_id', authUser.id)
        .eq('is_active', true);
      embassyOk = (count ?? 0) === 0;
    }

    check(
      p.email,
      roleOk && tenantOk && embassyOk,
      `role:${ok(roleOk)} tenant:${ok(tenantOk)} ${p.embassy ? 'embassy-scoped' : 'national'}:${ok(embassyOk)}`,
    );
  }

  console.log(
    failures === 0
      ? '\n✅ Liberia demo environment verified — all checks passed.\n'
      : `\n❌ ${failures} check(s) failed. Re-run the seed if needed.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
