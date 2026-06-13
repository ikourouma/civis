# Typed Service Layer

All data access in Civis flows through this folder — **no component ever calls
Supabase directly** (Doc 08 §8, Engineering Guardrails).

Each domain folder receives its typed service module from Mission 002 onward:

| Folder         | Domain                                         | Arrives in  |
| -------------- | ---------------------------------------------- | ----------- |
| `auth/`        | Authentication, sessions, MFA, role checks     | Mission 002 |
| `tenants/`     | Tenant management and tenant settings          | Mission 002 |
| `registrants/` | Registrant CRUD, verification, consent linkage | Mission 003 |
| `embassies/`   | Embassy and jurisdiction management            | Mission 004 |
| `analytics/`   | Dashboard data from materialized views         | Mission 005 |

Pattern: service functions accept typed inputs (validated with Zod), use the
clients from `/lib/supabase/`, and return typed results. RLS remains the
authoritative data boundary — the service layer never bypasses it.
