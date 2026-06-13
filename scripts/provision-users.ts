// scripts/provision-users.ts
// Run once: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/provision-users.ts
// Uses service role — server-side only, never expose to client
// After successful run, delete this script or add it to .gitignore

import { createAdminClient } from '../lib/supabase/admin';

const TEMP_PASSWORD = 'Civis@TempAdmin2026';

const users = [
  // Operational personas
  { email: 'tenantadmin@civisos.com',     role: 'tenant_admin',     name: 'Tenant Administrator' },
  { email: 'embassyadmin@civisos.com',    role: 'embassy_admin',    name: 'Embassy Administrator' },
  { email: 'consularofficer@civisos.com', role: 'consular_officer', name: 'Consular Officer' },
  { email: 'analyst@civisos.com',         role: 'analyst',          name: 'Intelligence Analyst' },
  { email: 'executiveviewer@civisos.com', role: 'executive_viewer', name: 'Executive Viewer' },
  { email: 'registrant@civisos.com',      role: 'registrant',       name: 'Diaspora Registrant' },

  // Procurement personas — mapped to closest operational role
  { email: 'minister@afronovation.com',    role: 'executive_viewer', name: 'Minister of Foreign Affairs' },
  { email: 'centralbank@afronovation.com', role: 'analyst',          name: 'Central Bank Governor' },
  { email: 'diasporadir@afronovation.com', role: 'tenant_admin',     name: 'Diaspora Commission Director' },
  { email: 'devpartner@afronovation.com',  role: 'executive_viewer', name: 'Development Partner' },
  { email: 'cio@afronovation.com',         role: 'tenant_admin',     name: 'Head of Digital Government' },
];

async function provisionUsers() {
  const admin = createAdminClient();

  console.log('Starting Civis user provisioning...\n');

  for (const user of users) {
    try {
      const { data, error } = await admin.auth.admin.createUser({
        email: user.email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
          role: user.role,
        },
      });

      if (error) {
        console.error(`❌ Failed: ${user.email} — ${error.message}`);
        continue;
      }

      if (data.user) {
        const { error: profileError } = await admin
          .from('profiles')
          .update({
            role: user.role as never,
            full_name: user.name,
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error(`⚠️  User created but profile role not set: ${user.email} — ${profileError.message}`);
        } else {
          console.log(`✅ Provisioned: ${user.email} (${user.role})`);
        }

        await admin.from('audit_logs').insert({
          user_email: 'system@civisos.com',
          user_role: 'super_admin',
          action: 'USER_PROVISIONED',
          resource: 'auth.users',
          resource_id: data.user.id,
          metadata: {
            provisioned_email: user.email,
            role: user.role,
            method: 'provision-users-script',
            mission: 'Mission-002',
          },
        });
      }
    } catch (err) {
      console.error(`❌ Exception for ${user.email}:`, err);
    }
  }

  console.log('\nProvisioning complete. Verify in Supabase dashboard → Authentication → Users');
  console.log('All accounts use temp password: Civis@TempAdmin2026');
  console.log('Update civis_users.md with provisioning date and status.');
}

provisionUsers();
