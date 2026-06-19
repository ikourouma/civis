// Diplomatic titles (Vienna Convention reference). Display-only — does NOT affect
// platform permissions, which are governed by `role` + entitlements.
export interface DiplomaticTitle {
  value: string;
  labelEn: string;
  labelFr: string;
}

export const DIPLOMATIC_TITLES: DiplomaticTitle[] = [
  // Leadership & Diplomatic Ranks
  { value: 'ambassador', labelEn: 'Ambassador', labelFr: 'Ambassadeur' },
  { value: 'high_commissioner', labelEn: 'High Commissioner', labelFr: 'Haut-Commissaire' },
  { value: 'charge_daffaires', labelEn: "Chargé d'Affaires", labelFr: "Chargé d'Affaires" },
  { value: 'deputy_chief_of_mission', labelEn: 'Deputy Chief of Mission', labelFr: 'Chef de Mission Adjoint' },
  { value: 'minister_counselor', labelEn: 'Minister-Counselor', labelFr: 'Ministre-Conseiller' },

  // Mid-Level & Junior Diplomats
  { value: 'first_secretary', labelEn: 'First Secretary', labelFr: 'Premier Secrétaire' },
  { value: 'second_secretary', labelEn: 'Second Secretary', labelFr: 'Deuxième Secrétaire' },
  { value: 'third_secretary', labelEn: 'Third Secretary', labelFr: 'Troisième Secrétaire' },

  // Consular & Public Services
  { value: 'consul_general', labelEn: 'Consul General', labelFr: 'Consul Général' },
  { value: 'consul', labelEn: 'Consul', labelFr: 'Consul' },
  { value: 'vice_consul', labelEn: 'Vice-Consul', labelFr: 'Vice-Consul' },

  // Specialist Attachés
  { value: 'political_officer', labelEn: 'Political Officer', labelFr: 'Conseiller Politique' },
  { value: 'economic_officer', labelEn: 'Economic Officer', labelFr: 'Conseiller Économique' },
  { value: 'public_affairs_officer', labelEn: 'Public Affairs Officer', labelFr: 'Chargé des Affaires Publiques' },
  { value: 'cultural_secretary', labelEn: 'Cultural / Educational Secretary', labelFr: 'Secrétaire Culturel' },
  { value: 'agricultural_officer', labelEn: 'Agricultural / Trade Officer', labelFr: 'Attaché Agricole / Commercial' },
  { value: 'science_attache', labelEn: 'Science & Environment Attaché', labelFr: 'Attaché Scientifique' },
  { value: 'defense_attache', labelEn: 'Defense Attaché', labelFr: 'Attaché de Défense' },
  { value: 'it_officer', labelEn: 'IT / Diplomatic Technology Officer', labelFr: 'Responsable Technologies' },
  { value: 'medical_provider', labelEn: 'Medical Provider', labelFr: 'Médecin' },

  // Administrative & Specialist
  { value: 'management_officer', labelEn: 'Management / Administrative Officer', labelFr: 'Responsable Administratif' },
  { value: 'regional_security_officer', labelEn: 'Regional Security Officer', labelFr: 'Responsable Sécurité Régional' },
  { value: 'locally_employed_staff', labelEn: 'Locally Employed Staff', labelFr: 'Personnel Recruté Localement' },
  { value: 'human_resources', labelEn: 'Human Resources', labelFr: 'Ressources Humaines' },
  { value: 'facilities_management', labelEn: 'Facilities Management', labelFr: 'Gestion des Installations' },
  { value: 'consular_officer', labelEn: 'Consular Officer', labelFr: 'Officier Consulaire' },

  // Generic
  { value: 'other', labelEn: 'Other', labelFr: 'Autre' },
];

export function diplomaticTitleLabel(value: string | null | undefined, locale: 'en' | 'fr' = 'en'): string | null {
  if (!value) return null;
  const t = DIPLOMATIC_TITLES.find((x) => x.value === value);
  if (!t) return null;
  return locale === 'fr' ? t.labelFr : t.labelEn;
}
