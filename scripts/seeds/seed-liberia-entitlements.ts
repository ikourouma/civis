// Seed the Liberia tenant with recommended operational entitlement overrides
// (more generous than catalog defaults — good for the demo). Idempotent.
// Run (after seed:liberia): npx tsx scripts/seeds/seed-liberia-entitlements.ts
import { seedClient, writeSeedAudit } from './_client';

const LIBERIA_OVERRIDES: { role: string; code: string; enabled: boolean }[] = [
  // Embassy Admin — enable registrant browsing for the demo
  { role: 'embassy_admin', code: 'REGISTRY_VIEW_LIST', enabled: true },
  { role: 'embassy_admin', code: 'REGISTRY_VIEW_PROFILE', enabled: true },
  { role: 'embassy_admin', code: 'REGISTRY_SEARCH', enabled: true },
  { role: 'embassy_admin', code: 'AUDIT_VIEW_EMBASSY', enabled: true },
  // Consular Officer — enable search and profile view
  { role: 'consular_officer', code: 'REGISTRY_VIEW_LIST', enabled: true },
  { role: 'consular_officer', code: 'REGISTRY_VIEW_PROFILE', enabled: true },
  { role: 'consular_officer', code: 'REGISTRY_SEARCH', enabled: true },
  // Tenant Admin — full operational capabilities
  { role: 'tenant_admin', code: 'REGISTRY_VIEW_PROFILE', enabled: true },
  { role: 'tenant_admin', code: 'REGISTRY_EXPORT_CSV', enabled: true },
  { role: 'tenant_admin', code: 'REGISTRY_EXPORT_PDF', enabled: true },
  { role: 'tenant_admin', code: 'AUDIT_VIEW_TENANT', enabled: true },
  { role: 'tenant_admin', code: 'SETTINGS_VIEW', enabled: true },
  { role: 'tenant_admin', code: 'SETTINGS_EDIT', enabled: true },
  { role: 'tenant_admin', code: 'GDPR_PROCESS_REQUESTS', enabled: true },
  // Analyst — reports and export
  { role: 'analyst', code: 'INTELLIGENCE_REPORTS', enabled: true },
  { role: 'analyst', code: 'REGISTRY_EXPORT_CSV', enabled: true },
];

async function main() {
  const admin = seedClient();
  console.log('Seeding Liberia entitlement overrides...\n');

  const { data: tenant } = await admin
    .from('civis_tenants')
    .select('id')
    .eq('country_code', 'LR')
    .maybeSingle();
  if (!tenant) {
    console.error('❌ Liberia tenant not found. Run: npx tsx scripts/seeds/seed-liberia-tenant.ts');
    process.exit(1);
  }

  const rows = LIBERIA_OVERRIDES.map((o) => ({
    tenant_id: tenant.id,
    role: o.role,
    capability_code: o.code,
    is_enabled: o.enabled,
    configured_at: new Date().toISOString(),
    notes: 'Seeded operational default (Mission 006-A)',
  }));

  const { error } = await admin
    .from('civis_tenant_entitlements')
    .upsert(rows, { onConflict: 'tenant_id,role,capability_code' });

  if (error) {
    console.error(`❌ Seed failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`✅ ${rows.length} entitlement overrides seeded for Liberia.`);
  await writeSeedAudit(admin, 'civis_tenant_entitlements', rows.length, 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
