// ONE-TIME USE — delete this file after provisioning is confirmed.
// Protected by PROVISION_SECRET header to prevent accidental calls.
// Call with: GET /api/admin/provision
// Header: x-provision-secret: civis-provision-2026

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const PROVISION_SECRET = 'civis-provision-2026';
const TEMP_PASSWORD = 'Civis@TempAdmin2026';

const USERS = [
  { email: 'tenantadmin@civisos.com',     role: 'tenant_admin',     name: 'Tenant Administrator' },
  { email: 'embassyadmin@civisos.com',    role: 'embassy_admin',    name: 'Embassy Administrator' },
  { email: 'consularofficer@civisos.com', role: 'consular_officer', name: 'Consular Officer' },
  { email: 'analyst@civisos.com',         role: 'analyst',          name: 'Intelligence Analyst' },
  { email: 'executiveviewer@civisos.com', role: 'executive_viewer', name: 'Executive Viewer' },
  { email: 'registrant@civisos.com',      role: 'registrant',       name: 'Diaspora Registrant' },
  { email: 'minister@afronovation.com',    role: 'executive_viewer', name: 'Minister of Foreign Affairs' },
  { email: 'centralbank@afronovation.com', role: 'analyst',          name: 'Central Bank Governor' },
  { email: 'diasporadir@afronovation.com', role: 'tenant_admin',     name: 'Diaspora Commission Director' },
  { email: 'devpartner@afronovation.com',  role: 'executive_viewer', name: 'Development Partner' },
  { email: 'cio@afronovation.com',         role: 'tenant_admin',     name: 'Head of Digital Government' },
];

export async function GET(request: Request) {
  const secret = request.headers.get('x-provision-secret');
  if (secret !== PROVISION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const results: { email: string; status: string; role: string }[] = [];

  for (const user of USERS) {
    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: user.name, role: user.role },
    });

    if (error) {
      results.push({ email: user.email, status: `FAILED: ${error.message}`, role: user.role });
      continue;
    }

    if (data.user) {
      const { error: profileError } = await admin
        .from('profiles')
        .update({ role: user.role as never, full_name: user.name })
        .eq('id', data.user.id);

      results.push({
        email: user.email,
        status: profileError ? `USER_OK_PROFILE_ERR: ${profileError.message}` : 'OK',
        role: user.role,
      });

      await admin.from('audit_logs').insert({
        user_email: 'system@civisos.com',
        user_role: 'super_admin',
        action: 'USER_PROVISIONED',
        resource: 'auth.users',
        resource_id: data.user.id,
        metadata: { provisioned_email: user.email, role: user.role, mission: 'Mission-002' },
      });
    }
  }

  return NextResponse.json({ provisioned: results.length, results });
}
