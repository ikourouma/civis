// Seed default Liberia portal carousel messages. Idempotent (clears existing first).
// Run (after migration 012 + seed:liberia): npx tsx scripts/seeds/seed-liberia-portal-messages.ts
import { seedClient, writeSeedAudit } from './_client';

const MESSAGES = [
  {
    headline_en: 'Register with your government and stay connected to Liberia — wherever you are in the world.',
    headline_fr: 'Inscrivez-vous auprès de votre gouvernement et restez connecté au Libéria — où que vous soyez.',
    subtitle_en: 'Join Liberian citizens already registered on the sovereign diaspora platform.',
    subtitle_fr: 'Rejoignez les citoyens libériens déjà inscrits sur la plateforme souveraine de la diaspora.',
    sort_order: 1,
  },
  {
    headline_en: 'Your registration helps Liberia build better consular services, investment programs, and diaspora policy.',
    headline_fr: "Votre inscription aide le Libéria à développer de meilleurs services consulaires et programmes d'investissement.",
    subtitle_en: 'Your data is protected under sovereign infrastructure controlled by your government.',
    subtitle_fr: 'Vos données sont protégées sous une infrastructure souveraine contrôlée par votre gouvernement.',
    sort_order: 2,
  },
  {
    headline_en: "Access consular services, stay informed about diaspora programs, and contribute to Liberia's development.",
    headline_fr: 'Accédez aux services consulaires, restez informé des programmes de la diaspora et contribuez au développement du Libéria.',
    subtitle_en: 'Registration takes less than 2 minutes. Complete your profile at your own pace.',
    subtitle_fr: "L'inscription prend moins de 2 minutes. Complétez votre profil à votre rythme.",
    sort_order: 3,
  },
];

async function main() {
  const admin = seedClient();
  console.log('Seeding Liberia portal messages...\n');

  const { data: tenant } = await admin
    .from('civis_tenants')
    .select('id')
    .eq('country_code', 'LR')
    .maybeSingle();
  if (!tenant) {
    console.error('❌ Liberia tenant not found. Run: npx tsx scripts/seeds/seed-liberia-tenant.ts');
    process.exit(1);
  }

  // Idempotent — clear then insert.
  await admin.from('civis_portal_messages').delete().eq('tenant_id', tenant.id);

  const rows = MESSAGES.map((m) => ({ tenant_id: tenant.id, is_active: true, ...m }));
  const { error } = await admin.from('civis_portal_messages').insert(rows);
  if (error) {
    console.error(`❌ Seed failed: ${error.message}`);
    process.exit(1);
  }

  console.log(`✅ ${rows.length} portal messages seeded for Liberia.`);
  await writeSeedAudit(admin, 'civis_portal_messages', rows.length, 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
