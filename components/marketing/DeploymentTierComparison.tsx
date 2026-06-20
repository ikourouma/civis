import { Check, Minus } from 'lucide-react';
import { Fragment } from 'react';

import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

type Lang = 'en' | 'fr';
type Cell = string | true | false;

interface Row {
  label: { en: string; fr: string };
  values: [Cell, Cell, Cell];
}
interface Group {
  title: { en: string; fr: string };
  rows: Row[];
}

const GROUPS: Group[] = [
  {
    title: { en: 'Infrastructure', fr: 'Infrastructure' },
    rows: [
      { label: { en: 'Hosting', fr: 'Hébergement' }, values: ['Shared sovereign cloud', 'Dedicated per-country', 'Your infrastructure'] },
      { label: { en: 'Data isolation', fr: 'Isolation des données' }, values: ['Database-level (RLS)', 'Separate database', 'Physically isolated'] },
      { label: { en: 'Data residency', fr: 'Résidence des données' }, values: ['Platform region', 'Government-chosen region', 'Your data center'] },
    ],
  },
  {
    title: { en: 'Access', fr: 'Accès' },
    rows: [
      { label: { en: 'Citizen portal', fr: 'Portail citoyen' }, values: ['Shared (civisos.com)', 'Branded (lr.civisos.com)', 'Custom domain'] },
      { label: { en: 'Branding', fr: 'Image de marque' }, values: ['Civis-first', 'Co-branded', 'Full white-label'] },
    ],
  },
  {
    title: { en: 'Capabilities', fr: 'Fonctionnalités' },
    rows: [
      { label: { en: 'Diaspora Registry', fr: 'Registre diaspora' }, values: [true, true, true] },
      { label: { en: 'Embassy Workspace', fr: 'Espace ambassade' }, values: [true, true, true] },
      { label: { en: 'Intelligence Dashboard', fr: 'Tableau analytique' }, values: ['Basic', 'Full', 'Full'] },
      { label: { en: 'Report Builder', fr: 'Générateur de rapports' }, values: [false, true, true] },
      { label: { en: 'Data Export', fr: 'Export de données' }, values: [false, 'CSV, PDF', 'CSV, PDF'] },
      { label: { en: 'Audit Trail', fr: "Journal d'audit" }, values: ['Own actions', 'Full tenant', 'Full + export'] },
      { label: { en: 'GDPR Rights', fr: 'Droits RGPD' }, values: ['Export, Correction', '+ Deletion', '+ Deletion'] },
      { label: { en: 'Dia AI Intelligence', fr: 'Renseignement Dia AI' }, values: [false, false, true] },
      { label: { en: 'Monitoring', fr: 'Surveillance' }, values: [false, false, true] },
    ],
  },
  {
    title: { en: 'Support', fr: 'Support' },
    rows: [
      { label: { en: 'Onboarding', fr: 'Intégration' }, values: ['Self-service', 'Guided', 'Full implementation'] },
      { label: { en: 'SLA', fr: 'SLA' }, values: ['99.5%', '99.9%', '99.99%'] },
      { label: { en: 'Support', fr: 'Assistance' }, values: ['Email', 'Email + Priority', 'Dedicated account'] },
    ],
  },
];

const TIER_NAMES = ['Cloud', 'Government', 'Sovereign'];

const READINESS: { en: string; fr: string }[] = [
  { en: 'Reliable power supply (99.9% uptime)', fr: 'Alimentation électrique fiable (99,9 % de disponibilité)' },
  { en: 'Network connectivity (minimum 100Mbps dedicated)', fr: 'Connectivité réseau (minimum 100 Mbps dédiés)' },
  { en: 'Server capacity (minimum 8 cores, 32GB RAM, 500GB SSD)', fr: 'Capacité serveur (minimum 8 cœurs, 32 Go RAM, 500 Go SSD)' },
  { en: 'IT team (minimum 2 certified operators)', fr: 'Équipe informatique (minimum 2 opérateurs certifiés)' },
  { en: 'Physical security for server environment', fr: "Sécurité physique de l'environnement serveur" },
];

function cell(value: Cell) {
  if (value === true) return <Check className="mx-auto h-4 w-4 text-success-teal" aria-label="Included" />;
  if (value === false) return <Minus className="mx-auto h-4 w-4 text-neutral-300" aria-label="Not included" />;
  return <span className="text-sm text-ink">{value}</span>;
}

export function DeploymentTierComparison({ locale }: { locale: Lang }) {
  const tt = (o: { en: string; fr: string }) => o[locale];

  return (
    <>
      <SectionWrapper>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-heading text-navy">{locale === 'fr' ? 'Comparer les niveaux de déploiement' : 'Compare Deployment Tiers'}</h2>
        </div>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-navy/10">
                <th className="py-3 pr-4 text-sm font-semibold text-navy">{locale === 'fr' ? 'Fonctionnalité' : 'Feature'}</th>
                {TIER_NAMES.map((n) => (
                  <th key={n} className="px-4 py-3 text-center text-sm font-semibold text-navy">{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g) => (
                <Fragment key={g.title.en}>
                  <tr className="bg-surface/60">
                    <td colSpan={4} className="px-2 py-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">{tt(g.title)}</td>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label.en} className="border-b border-navy/5">
                      <td className="py-3 pr-4 text-sm text-ink">{tt(r.label)}</td>
                      {r.values.map((v, i) => (
                        <td key={i} className="px-4 py-3 text-center">{cell(v)}</td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-8 text-center text-sm text-neutral-500">
          {locale === 'fr' ? 'Aucun prix affiché — contactez notre équipe pour une proposition de déploiement personnalisée.' : 'No pricing displayed — contact our team for a personalized deployment proposal.'}
        </p>
        <div className="mt-6 text-center">
          <Button asChild size="lg"><Link href="/contact">{locale === 'fr' ? 'Demander une présentation gouvernementale →' : 'Request a Government Briefing →'}</Link></Button>
        </div>
      </SectionWrapper>

      <SectionWrapper className="bg-surface">
        <div className="mx-auto max-w-2xl space-y-5">
          <h2 className="text-heading text-navy">{locale === 'fr' ? 'Préparation au déploiement souverain' : 'Sovereign Deployment Readiness'}</h2>
          <p className="text-ink">{locale === 'fr' ? 'Pour les gouvernements envisageant le niveau Souverain — exigences d\'infrastructure :' : 'For governments considering Sovereign tier — infrastructure requirements:'}</p>
          <ul className="space-y-3">
            {READINESS.map((r) => (
              <li key={r.en} className="flex items-start gap-3 text-sm text-ink">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-teal" aria-hidden="true" />
                {tt(r)}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline"><Link href="/contact">{locale === 'fr' ? "Demander une évaluation de préparation souveraine →" : 'Request a Sovereign Readiness Assessment →'}</Link></Button>
        </div>
      </SectionWrapper>
    </>
  );
}
