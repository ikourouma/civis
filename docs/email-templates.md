# Civis — Email Templates

Supabase Auth emails are configured manually in the Supabase Dashboard. This file
documents the templates the Afronovation team should set so staff onboarding and
password flows match the Civis brand.

## Where to configure

Supabase Dashboard → **Authentication → Email Templates**.

Supabase template variables are limited to: `{{ .ConfirmationURL }}`,
`{{ .Token }}`, `{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .Email }}`,
`{{ .RedirectTo }}`. Role/tenant cannot be injected by Supabase, so keep the copy
generic.

## Reset Password (used for staff welcome + password resets)

When a Tenant Admin provisions a staff member (or a Super Admin provisions a
Tenant Admin) with "Send welcome email" checked, Civis triggers a Supabase
password-reset email. Use this template so the same email serves as the welcome:

**Subject**

```
Welcome to Civis — Your Account is Ready
```

**Body (HTML)**

```html
<h2>Welcome to Civis</h2>
<p>
  You have been granted access to the Civis Sovereign Intelligence Platform by
  your government's platform administrator.
</p>
<p><a href="{{ .ConfirmationURL }}">Set your password</a> to activate your account.</p>
<p>After setting your password, sign in at: {{ .SiteURL }}/en/auth/signin</p>
<p style="color:#64748b;font-size:12px">
  This link expires in 24 hours. If you did not expect this email, please contact
  your platform administrator.
</p>
<p style="color:#64748b;font-size:12px">— Civis | Sovereign Intelligence Platform · Afronovation, Inc.</p>
```

## Notes

- SMTP must be configured in Supabase (Authentication → SMTP Settings) for emails
  to actually send. Without SMTP, account creation still succeeds — the staff
  member can be given a manual reset link, or the admin can set a temporary
  password out of band. Civis treats the welcome email as best-effort and never
  blocks provisioning on email delivery.
- Account role and tenant are assigned by Civis at provisioning time; they are not
  part of the email payload.
