// ============================================================
// Civis Platform Capability Catalog — single source of truth.
// The entitlement engine sits ABOVE RBAC: a capability is available only if the
// ROLE permits it AND the TENANT has it toggled ON. super_admin bypasses all.
// ============================================================

export type CapabilityDomain =
  | 'registry'
  | 'registrant_actions'
  | 'embassy'
  | 'staff'
  | 'intelligence'
  | 'executive'
  | 'audit'
  | 'gdpr'
  | 'settings'
  | 'dia_ai'
  | 'monitoring';

export type CapabilityCode =
  // Registry
  | 'REGISTRY_VIEW_LIST'
  | 'REGISTRY_VIEW_PROFILE'
  | 'REGISTRY_SEARCH'
  | 'REGISTRY_EXPORT_CSV'
  | 'REGISTRY_EXPORT_PDF'
  | 'REGISTRY_BULK_ACTIONS'
  // Registrant Actions
  | 'REGISTRANT_APPROVE'
  | 'REGISTRANT_REJECT'
  | 'REGISTRANT_EDIT_IDENTITY'
  | 'REGISTRANT_EDIT_CONTACT'
  | 'REGISTRANT_EDIT_PROFESSIONAL'
  | 'REGISTRANT_VIEW_DOCUMENTS'
  | 'REGISTRANT_VIEW_CONSENT'
  | 'REGISTRANT_ADD_NOTES'
  | 'REGISTRANT_FLAG_DUPLICATE'
  // Embassy
  | 'EMBASSY_CREATE'
  | 'EMBASSY_EDIT'
  | 'EMBASSY_DEACTIVATE'
  | 'EMBASSY_VIEW_STAFF'
  | 'EMBASSY_VIEW_PERFORMANCE'
  // Staff
  | 'STAFF_PROVISION'
  | 'STAFF_ASSIGN_EMBASSY'
  | 'STAFF_CHANGE_ROLE'
  | 'STAFF_DEACTIVATE'
  | 'STAFF_RESET_PASSWORD'
  | 'STAFF_VIEW_ACTIVITY'
  // Intelligence
  | 'INTELLIGENCE_DASHBOARD'
  | 'INTELLIGENCE_REPORTS'
  | 'INTELLIGENCE_EXPORT'
  | 'INTELLIGENCE_DRILL_DOWN'
  | 'INTELLIGENCE_SEGMENTS'
  // Executive
  | 'EXECUTIVE_DASHBOARD'
  | 'EXECUTIVE_BRIEFING_PDF'
  // Audit
  | 'AUDIT_VIEW_OWN'
  | 'AUDIT_VIEW_EMBASSY'
  | 'AUDIT_VIEW_TENANT'
  | 'AUDIT_EXPORT'
  // GDPR / Data Rights
  | 'GDPR_REQUEST_EXPORT'
  | 'GDPR_REQUEST_CORRECTION'
  | 'GDPR_REQUEST_DELETION'
  | 'GDPR_VIEW_CONSENT'
  | 'GDPR_PROCESS_REQUESTS'
  // Settings
  | 'SETTINGS_VIEW'
  | 'SETTINGS_EDIT'
  | 'SETTINGS_DATA_RETENTION'
  | 'SETTINGS_CONSENT_CONFIG'
  // Dia AI (future)
  | 'DIA_AI_FORECASTING'
  | 'DIA_AI_BRIEFS'
  | 'DIA_AI_SEGMENTS'
  | 'DIA_AI_CONFIGURE'
  // Monitoring
  | 'MONITORING_DASHBOARD'
  | 'MONITORING_ALERTS';

export type PlatformRoleExcludingSuperAdmin =
  | 'tenant_admin'
  | 'embassy_admin'
  | 'consular_officer'
  | 'analyst'
  | 'executive_viewer'
  | 'registrant'
  | 'economic_planner';

export interface CapabilityDefinition {
  code: CapabilityCode;
  domain: CapabilityDomain;
  nameEn: string;
  nameFr: string;
  descriptionEn: string;
  descriptionFr: string;
  defaults: Record<PlatformRoleExcludingSuperAdmin, boolean>;
  isConfigurable: boolean;
  isPremium: boolean;
}

// Shorthand default-builders to keep the catalog readable.
const NONE: Record<PlatformRoleExcludingSuperAdmin, boolean> = {
  tenant_admin: false,
  embassy_admin: false,
  consular_officer: false,
  analyst: false,
  executive_viewer: false,
  registrant: false,
  economic_planner: false,
};
const D = (overrides: Partial<Record<PlatformRoleExcludingSuperAdmin, boolean>>) => ({ ...NONE, ...overrides });

export const CAPABILITY_CATALOG: CapabilityDefinition[] = [
  // ── Registry ──────────────────────────────
  { code: 'REGISTRY_VIEW_LIST', domain: 'registry', nameEn: 'View Registrant List', nameFr: 'Voir la liste des inscrits', descriptionEn: 'Access the searchable registrant table with names, status, and summary data.', descriptionFr: 'Accéder au tableau des inscrits avec noms, statuts et données résumées.', defaults: D({ tenant_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'REGISTRY_VIEW_PROFILE', domain: 'registry', nameEn: 'View Registrant Profile', nameFr: "Voir le profil d'un inscrit", descriptionEn: 'View full individual registrant profile including personal details, documents, and history.', descriptionFr: "Voir le profil complet d'un inscrit incluant les détails personnels, documents et historique.", defaults: D({}), isConfigurable: true, isPremium: false },
  { code: 'REGISTRY_SEARCH', domain: 'registry', nameEn: 'Search Registrants', nameFr: 'Rechercher des inscrits', descriptionEn: 'Search registrants by name, email, nationality, or other fields.', descriptionFr: 'Rechercher des inscrits par nom, courriel, nationalité ou autres champs.', defaults: D({ tenant_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'REGISTRY_EXPORT_CSV', domain: 'registry', nameEn: 'Export Registrant Data (CSV)', nameFr: 'Exporter les données (CSV)', descriptionEn: 'Export filtered registrant data as CSV files. All exports are audit-logged.', descriptionFr: 'Exporter les données filtrées au format CSV. Tous les exports sont journalisés.', defaults: D({}), isConfigurable: true, isPremium: false },
  { code: 'REGISTRY_EXPORT_PDF', domain: 'registry', nameEn: 'Export Registrant Data (PDF)', nameFr: 'Exporter les données (PDF)', descriptionEn: 'Generate PDF reports from registrant data.', descriptionFr: 'Générer des rapports PDF à partir des données des inscrits.', defaults: D({}), isConfigurable: true, isPremium: false },
  { code: 'REGISTRY_BULK_ACTIONS', domain: 'registry', nameEn: 'Bulk Registry Actions', nameFr: 'Actions groupées sur le registre', descriptionEn: 'Perform bulk approve, reject, or export actions on multiple registrants.', descriptionFr: 'Effectuer des actions groupées (approuver, rejeter, exporter) sur plusieurs inscrits.', defaults: D({}), isConfigurable: true, isPremium: true },

  // ── Registrant Actions ────────────────────
  { code: 'REGISTRANT_APPROVE', domain: 'registrant_actions', nameEn: 'Approve Registrations', nameFr: 'Approuver les inscriptions', descriptionEn: 'Approve submitted registrations and change status to active.', descriptionFr: 'Approuver les inscriptions soumises et changer le statut en actif.', defaults: D({ tenant_admin: true, embassy_admin: true, consular_officer: true }), isConfigurable: true, isPremium: false },
  { code: 'REGISTRANT_REJECT', domain: 'registrant_actions', nameEn: 'Reject Registrations', nameFr: 'Rejeter les inscriptions', descriptionEn: 'Reject submitted registrations with a required reason.', descriptionFr: 'Rejeter les inscriptions soumises avec un motif obligatoire.', defaults: D({ tenant_admin: true, embassy_admin: true, consular_officer: true }), isConfigurable: true, isPremium: false },
  { code: 'REGISTRANT_EDIT_IDENTITY', domain: 'registrant_actions', nameEn: 'Edit Identity Fields', nameFr: "Modifier les champs d'identité", descriptionEn: 'Edit registrant name, date of birth, nationality, and other identity fields.', descriptionFr: "Modifier le nom, la date de naissance, la nationalité et autres champs d'identité.", defaults: D({}), isConfigurable: true, isPremium: false },
  { code: 'REGISTRANT_EDIT_CONTACT', domain: 'registrant_actions', nameEn: 'Edit Contact Information', nameFr: 'Modifier les informations de contact', descriptionEn: 'Edit registrant email, phone, and address.', descriptionFr: "Modifier le courriel, le téléphone et l'adresse de l'inscrit.", defaults: D({ tenant_admin: true, embassy_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'REGISTRANT_EDIT_PROFESSIONAL', domain: 'registrant_actions', nameEn: 'Edit Professional Information', nameFr: 'Modifier les informations professionnelles', descriptionEn: 'Edit registrant occupation, employer, education, and professional background.', descriptionFr: "Modifier la profession, l'employeur, l'éducation et le parcours professionnel.", defaults: D({ tenant_admin: true, embassy_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'REGISTRANT_VIEW_DOCUMENTS', domain: 'registrant_actions', nameEn: 'View Uploaded Documents', nameFr: 'Voir les documents téléversés', descriptionEn: 'View identity documents uploaded by registrants (passport, ID, certificates).', descriptionFr: "Voir les documents d'identité téléversés (passeport, pièce d'identité, certificats).", defaults: D({ tenant_admin: true, embassy_admin: true, consular_officer: true }), isConfigurable: true, isPremium: false },
  { code: 'REGISTRANT_VIEW_CONSENT', domain: 'registrant_actions', nameEn: 'View Consent Records', nameFr: 'Voir les enregistrements de consentement', descriptionEn: 'View the consent record and privacy choices made by a registrant.', descriptionFr: "Voir l'enregistrement de consentement et les choix de confidentialité d'un inscrit.", defaults: D({}), isConfigurable: true, isPremium: false },
  { code: 'REGISTRANT_ADD_NOTES', domain: 'registrant_actions', nameEn: 'Add Notes to Registrant', nameFr: "Ajouter des notes à l'inscrit", descriptionEn: 'Add internal case notes to a registrant record.', descriptionFr: "Ajouter des notes de dossier internes à un enregistrement d'inscrit.", defaults: D({ tenant_admin: true, embassy_admin: true, consular_officer: true }), isConfigurable: true, isPremium: false },
  { code: 'REGISTRANT_FLAG_DUPLICATE', domain: 'registrant_actions', nameEn: 'Flag Duplicate Records', nameFr: 'Signaler les doublons', descriptionEn: 'Flag a registrant record as a potential duplicate for review.', descriptionFr: "Signaler un enregistrement d'inscrit comme doublon potentiel pour examen.", defaults: D({ tenant_admin: true, embassy_admin: true, consular_officer: true }), isConfigurable: true, isPremium: false },

  // ── Embassy ───────────────────────────────
  { code: 'EMBASSY_CREATE', domain: 'embassy', nameEn: 'Create Embassies', nameFr: 'Créer des ambassades', descriptionEn: 'Create new embassy or consulate workspaces.', descriptionFr: 'Créer de nouveaux espaces ambassade ou consulat.', defaults: D({ tenant_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'EMBASSY_EDIT', domain: 'embassy', nameEn: 'Edit Embassy Profile', nameFr: "Modifier le profil d'ambassade", descriptionEn: 'Edit embassy details, address, contact information.', descriptionFr: "Modifier les détails, l'adresse et les coordonnées de l'ambassade.", defaults: D({ tenant_admin: true, embassy_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'EMBASSY_DEACTIVATE', domain: 'embassy', nameEn: 'Deactivate Embassy', nameFr: 'Désactiver une ambassade', descriptionEn: 'Deactivate an embassy workspace. Data is preserved.', descriptionFr: 'Désactiver un espace ambassade. Les données sont préservées.', defaults: D({ tenant_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'EMBASSY_VIEW_STAFF', domain: 'embassy', nameEn: 'View Embassy Staff', nameFr: "Voir le personnel de l'ambassade", descriptionEn: 'View the staff roster for an embassy.', descriptionFr: "Voir la liste du personnel d'une ambassade.", defaults: D({ tenant_admin: true, embassy_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'EMBASSY_VIEW_PERFORMANCE', domain: 'embassy', nameEn: 'View Embassy Performance', nameFr: "Voir les performances de l'ambassade", descriptionEn: 'View registration metrics and performance data for an embassy.', descriptionFr: "Voir les métriques d'inscription et les données de performance.", defaults: D({ tenant_admin: true, embassy_admin: true, analyst: true }), isConfigurable: true, isPremium: false },

  // ── Staff ─────────────────────────────────
  { code: 'STAFF_PROVISION', domain: 'staff', nameEn: 'Provision Staff Accounts', nameFr: 'Créer des comptes personnel', descriptionEn: 'Create new user accounts for government staff.', descriptionFr: 'Créer de nouveaux comptes utilisateurs pour le personnel gouvernemental.', defaults: D({ tenant_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'STAFF_ASSIGN_EMBASSY', domain: 'staff', nameEn: 'Assign Staff to Embassy', nameFr: 'Affecter le personnel', descriptionEn: 'Assign or reassign staff members to embassies.', descriptionFr: 'Affecter ou réaffecter des membres du personnel aux ambassades.', defaults: D({ tenant_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'STAFF_CHANGE_ROLE', domain: 'staff', nameEn: 'Change Staff Role', nameFr: 'Changer le rôle du personnel', descriptionEn: 'Change the platform role assigned to a staff member.', descriptionFr: 'Modifier le rôle de plateforme attribué à un membre du personnel.', defaults: D({ tenant_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'STAFF_DEACTIVATE', domain: 'staff', nameEn: 'Deactivate Staff', nameFr: 'Désactiver un compte', descriptionEn: 'Deactivate a staff account. The user cannot sign in.', descriptionFr: "Désactiver un compte. L'utilisateur ne peut plus se connecter.", defaults: D({ tenant_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'STAFF_RESET_PASSWORD', domain: 'staff', nameEn: 'Reset Staff Password', nameFr: 'Réinitialiser le mot de passe', descriptionEn: 'Send a password reset email to a staff member.', descriptionFr: 'Envoyer un courriel de réinitialisation de mot de passe.', defaults: D({ tenant_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'STAFF_VIEW_ACTIVITY', domain: 'staff', nameEn: 'View Staff Activity', nameFr: "Voir l'activité du personnel", descriptionEn: 'View the activity log for a specific staff member.', descriptionFr: "Voir le journal d'activité d'un membre du personnel spécifique.", defaults: D({}), isConfigurable: true, isPremium: false },

  // ── Intelligence ──────────────────────────
  { code: 'INTELLIGENCE_DASHBOARD', domain: 'intelligence', nameEn: 'Intelligence Dashboard', nameFr: 'Tableau de bord analytique', descriptionEn: 'Access the full diaspora intelligence dashboard with charts and analytics.', descriptionFr: "Accéder au tableau de bord complet d'intelligence diaspora.", defaults: D({ tenant_admin: true, analyst: true }), isConfigurable: true, isPremium: false },
  { code: 'INTELLIGENCE_REPORTS', domain: 'intelligence', nameEn: 'Generate Reports', nameFr: 'Générer des rapports', descriptionEn: 'Generate intelligence reports from diaspora data.', descriptionFr: 'Générer des rapports de renseignement à partir des données de la diaspora.', defaults: D({ analyst: true }), isConfigurable: true, isPremium: true },
  { code: 'INTELLIGENCE_EXPORT', domain: 'intelligence', nameEn: 'Export Analytics Data', nameFr: 'Exporter les données analytiques', descriptionEn: 'Export aggregated analytics data as CSV or PDF.', descriptionFr: 'Exporter les données analytiques agrégées au format CSV ou PDF.', defaults: D({ analyst: true }), isConfigurable: true, isPremium: false },
  { code: 'INTELLIGENCE_DRILL_DOWN', domain: 'intelligence', nameEn: 'Drill-Down Analytics', nameFr: 'Analyse détaillée', descriptionEn: 'Drill into geographic and demographic detail within the intelligence dashboard.', descriptionFr: 'Explorer en détail les données géographiques et démographiques.', defaults: D({ tenant_admin: true, analyst: true }), isConfigurable: true, isPremium: false },
  { code: 'INTELLIGENCE_SEGMENTS', domain: 'intelligence', nameEn: 'Cohort Segment Builder', nameFr: 'Constructeur de segments', descriptionEn: 'Build custom diaspora cohort segments for targeted analysis.', descriptionFr: 'Construire des segments de cohorte diaspora pour une analyse ciblée.', defaults: D({}), isConfigurable: true, isPremium: true },

  // ── Executive ─────────────────────────────
  { code: 'EXECUTIVE_DASHBOARD', domain: 'executive', nameEn: 'Executive Dashboard', nameFr: 'Tableau de bord exécutif', descriptionEn: 'Access the 90-second executive intelligence view.', descriptionFr: 'Accéder à la vue exécutive de 90 secondes.', defaults: D({ tenant_admin: true, executive_viewer: true }), isConfigurable: true, isPremium: false },
  { code: 'EXECUTIVE_BRIEFING_PDF', domain: 'executive', nameEn: 'Download Executive Briefing', nameFr: 'Télécharger la note exécutive', descriptionEn: 'Download a branded one-page intelligence briefing as PDF.', descriptionFr: "Télécharger une note exécutive d'une page au format PDF.", defaults: D({ tenant_admin: true, analyst: true, executive_viewer: true }), isConfigurable: true, isPremium: false },

  // ── Audit ─────────────────────────────────
  { code: 'AUDIT_VIEW_OWN', domain: 'audit', nameEn: 'View Own Audit Trail', nameFr: 'Voir son propre journal', descriptionEn: 'View your own actions in the audit log.', descriptionFr: 'Voir vos propres actions dans le journal.', defaults: D({ tenant_admin: true, embassy_admin: true, consular_officer: true, analyst: true, registrant: true }), isConfigurable: false, isPremium: false },
  { code: 'AUDIT_VIEW_EMBASSY', domain: 'audit', nameEn: 'View Embassy Audit Log', nameFr: "Voir le journal de l'ambassade", descriptionEn: 'View all audit log entries for your embassy.', descriptionFr: 'Voir toutes les entrées du journal pour votre ambassade.', defaults: D({ tenant_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'AUDIT_VIEW_TENANT', domain: 'audit', nameEn: 'View Full Tenant Audit Log', nameFr: 'Voir le journal complet du locataire', descriptionEn: 'View all audit log entries across the entire tenant.', descriptionFr: "Voir toutes les entrées du journal de l'ensemble du locataire.", defaults: D({}), isConfigurable: true, isPremium: false },
  { code: 'AUDIT_EXPORT', domain: 'audit', nameEn: 'Export Audit Logs', nameFr: 'Exporter le journal', descriptionEn: 'Export audit log entries as CSV.', descriptionFr: 'Exporter les entrées du journal au format CSV.', defaults: D({}), isConfigurable: true, isPremium: true },

  // ── GDPR / Data Rights ────────────────────
  { code: 'GDPR_REQUEST_EXPORT', domain: 'gdpr', nameEn: 'Request Data Export', nameFr: "Demander l'exportation de données", descriptionEn: 'Citizens can request a full export of their personal data (GDPR Art. 15).', descriptionFr: "Les citoyens peuvent demander l'exportation de leurs données personnelles.", defaults: D({ registrant: true }), isConfigurable: true, isPremium: false },
  { code: 'GDPR_REQUEST_CORRECTION', domain: 'gdpr', nameEn: 'Request Data Correction', nameFr: 'Demander la correction des données', descriptionEn: 'Citizens can request corrections to their personal data (GDPR Art. 16).', descriptionFr: 'Les citoyens peuvent demander la correction de leurs données personnelles.', defaults: D({ registrant: true }), isConfigurable: true, isPremium: false },
  { code: 'GDPR_REQUEST_DELETION', domain: 'gdpr', nameEn: 'Request Data Deletion', nameFr: 'Demander la suppression des données', descriptionEn: 'Citizens can request deletion of their account and data (GDPR Art. 17).', descriptionFr: 'Les citoyens peuvent demander la suppression de leur compte et données.', defaults: D({ registrant: true }), isConfigurable: true, isPremium: false },
  { code: 'GDPR_VIEW_CONSENT', domain: 'gdpr', nameEn: 'View Consent Record', nameFr: "Voir l'enregistrement de consentement", descriptionEn: 'View consent capture record and privacy choices.', descriptionFr: "Voir l'enregistrement de consentement et les choix de confidentialité.", defaults: D({ registrant: true }), isConfigurable: true, isPremium: false },
  { code: 'GDPR_PROCESS_REQUESTS', domain: 'gdpr', nameEn: 'Process Data Requests', nameFr: 'Traiter les demandes de données', descriptionEn: 'Process and fulfill citizen data export, correction, and deletion requests.', descriptionFr: 'Traiter et satisfaire les demandes de données des citoyens.', defaults: D({}), isConfigurable: true, isPremium: false },

  // ── Settings ──────────────────────────────
  { code: 'SETTINGS_VIEW', domain: 'settings', nameEn: 'View Settings', nameFr: 'Voir les paramètres', descriptionEn: 'View tenant or embassy configuration settings.', descriptionFr: 'Voir les paramètres de configuration.', defaults: D({ tenant_admin: true }), isConfigurable: true, isPremium: false },
  { code: 'SETTINGS_EDIT', domain: 'settings', nameEn: 'Edit Settings', nameFr: 'Modifier les paramètres', descriptionEn: 'Edit tenant or embassy configuration settings.', descriptionFr: 'Modifier les paramètres de configuration.', defaults: D({}), isConfigurable: true, isPremium: false },
  { code: 'SETTINGS_DATA_RETENTION', domain: 'settings', nameEn: 'Configure Data Retention', nameFr: 'Configurer la rétention des données', descriptionEn: 'Configure data retention policies for the tenant.', descriptionFr: 'Configurer les politiques de rétention des données.', defaults: D({}), isConfigurable: true, isPremium: true },
  { code: 'SETTINGS_CONSENT_CONFIG', domain: 'settings', nameEn: 'Configure Consent Text', nameFr: 'Configurer le texte de consentement', descriptionEn: 'Customize the consent text shown to registrants during registration.', descriptionFr: "Personnaliser le texte de consentement affiché lors de l'inscription.", defaults: D({}), isConfigurable: true, isPremium: false },

  // ── Dia AI (future) ───────────────────────
  { code: 'DIA_AI_FORECASTING', domain: 'dia_ai', nameEn: 'Dia AI Forecasting', nameFr: 'Prévisions Dia AI', descriptionEn: 'Access Dia AI demographic forecasting and predictive analytics.', descriptionFr: "Accéder aux prévisions démographiques et à l'analyse prédictive Dia AI.", defaults: D({}), isConfigurable: true, isPremium: true },
  { code: 'DIA_AI_BRIEFS', domain: 'dia_ai', nameEn: 'Dia AI Executive Briefs', nameFr: 'Notes exécutives Dia AI', descriptionEn: 'Access AI-generated ministerial intelligence briefs.', descriptionFr: 'Accéder aux notes ministérielles générées par IA.', defaults: D({}), isConfigurable: true, isPremium: true },
  { code: 'DIA_AI_SEGMENTS', domain: 'dia_ai', nameEn: 'Dia AI Cohort Segmentation', nameFr: 'Segmentation de cohorte Dia AI', descriptionEn: 'Access AI-powered automatic diaspora cohort identification.', descriptionFr: "Accéder à l'identification automatique de cohortes diaspora par IA.", defaults: D({}), isConfigurable: true, isPremium: true },
  { code: 'DIA_AI_CONFIGURE', domain: 'dia_ai', nameEn: 'Configure Dia AI', nameFr: 'Configurer Dia AI', descriptionEn: 'Configure Dia AI parameters, training schedules, and output preferences.', descriptionFr: "Configurer les paramètres Dia AI, les calendriers d'entraînement et les préférences de sortie.", defaults: D({}), isConfigurable: true, isPremium: true },

  // ── Monitoring ────────────────────────────
  { code: 'MONITORING_DASHBOARD', domain: 'monitoring', nameEn: 'Platform Monitoring', nameFr: 'Surveillance de la plateforme', descriptionEn: 'View platform health, uptime, and system status.', descriptionFr: "Voir la santé de la plateforme, le temps de disponibilité et l'état du système.", defaults: D({}), isConfigurable: true, isPremium: true },
  { code: 'MONITORING_ALERTS', domain: 'monitoring', nameEn: 'System Alerts', nameFr: 'Alertes système', descriptionEn: 'Receive and view system alerts and notifications.', descriptionFr: 'Recevoir et voir les alertes et notifications système.', defaults: D({}), isConfigurable: true, isPremium: true },
];

// Future / "coming soon" domains — toggleable in admin UI but non-functional yet.
export const FUTURE_DOMAINS: CapabilityDomain[] = ['dia_ai', 'monitoring'];

export const CAPABILITY_DOMAINS: CapabilityDomain[] = [
  'registry', 'registrant_actions', 'embassy', 'staff', 'intelligence',
  'executive', 'audit', 'gdpr', 'settings', 'dia_ai', 'monitoring',
];

export function getCapability(code: CapabilityCode): CapabilityDefinition | undefined {
  return CAPABILITY_CATALOG.find((c) => c.code === code);
}

export function getCapabilitiesByDomain(domain: CapabilityDomain): CapabilityDefinition[] {
  return CAPABILITY_CATALOG.filter((c) => c.domain === domain);
}

export function getDefaultsForRole(role: PlatformRoleExcludingSuperAdmin): CapabilityCode[] {
  return CAPABILITY_CATALOG.filter((c) => c.defaults[role] === true).map((c) => c.code);
}
