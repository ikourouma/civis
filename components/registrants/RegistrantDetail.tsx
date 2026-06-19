'use client';

import {
  Activity as ActivityIcon,
  AlertTriangle,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Archive,
  Eye,
  FileText,
  Pencil,
  Pin,
  ShieldCheck,
  StickyNote,
  User,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { EntitlementGate } from '@/components/entitlements/EntitlementGate';
import { useHasCapability } from '@/components/providers/EntitlementProvider';
import { useSession } from '@/components/providers/SessionProvider';
import { Link } from '@/i18n/navigation';
import type { ConsentRecord } from '@/lib/services/consent/consent.service';
import { getSignedDocUrl } from '@/lib/services/documents/document.actions';
import {
  addNoteAction,
  approveRegistrantDetailAction,
  archiveNoteAction,
  editNoteAction,
  flagDuplicateAction,
  pinNoteAction,
  rejectRegistrantDetailAction,
  reviewDocumentAction,
  updateRegistrantSectionAction,
} from '@/lib/services/registrants/registrant.actions';
import type {
  Registrant,
  RegistrantActivityEntry,
  RegistrantDocument,
  RegistrantNote,
  StaffEditSection,
  StaffSectionInput,
} from '@/lib/services/registrants';
import { cn } from '@/lib/utils';

type TabKey = 'personal' | 'contact' | 'professional' | 'documents' | 'consent' | 'notes' | 'activity';

interface Props {
  locale: string;
  registrant: Registrant;
  embassyName: string | null;
  documents: RegistrantDocument[];
  consent: ConsentRecord | null;
  notes: RegistrantNote[];
  activity: RegistrantActivityEntry[];
  variant: 'page' | 'panel';
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-white/5 text-surface/50',
  basic_registered: 'bg-blue-400/15 text-blue-400',
  submitted: 'bg-amber-400/15 text-amber-400',
  active: 'bg-emerald-400/15 text-emerald-400',
  inactive: 'bg-white/5 text-surface/50',
  archived: 'bg-white/5 text-surface/40',
  pending_review: 'bg-amber-400/15 text-amber-400',
  verified: 'bg-emerald-400/15 text-emerald-400',
  rejected: 'bg-red-400/15 text-red-400',
  unverified: 'bg-white/5 text-surface/50',
  uploaded: 'bg-blue-400/15 text-blue-400',
  under_review: 'bg-amber-400/15 text-amber-400',
};

const NOTE_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'follow_up', label: 'Follow-up Required' },
  { value: 'verification', label: 'Verification Note' },
  { value: 'gdpr', label: 'GDPR-Related' },
];
const NOTE_TYPE_LABEL: Record<string, string> = Object.fromEntries(NOTE_TYPES.map((n) => [n.value, n.label]));
const NOTE_TYPE_BADGE: Record<string, string> = {
  general: 'bg-white/5 text-surface/50',
  follow_up: 'bg-amber-400/15 text-amber-400',
  verification: 'bg-blue-400/15 text-blue-400',
  gdpr: 'bg-purple-400/15 text-purple-300',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function ageFrom(dob: string | null): string {
  if (!dob) return '';
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  const years = Math.floor(diff / 31557600000);
  return Number.isFinite(years) && years > 0 ? ` (age ${years})` : '';
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</dt>
      <dd className="mt-1 text-sm text-surface/80">{value || '—'}</dd>
    </div>
  );
}

export function RegistrantDetail({
  locale,
  registrant,
  embassyName,
  documents,
  consent,
  notes,
  activity,
  variant,
}: Props) {
  const t = useTranslations('registrant_detail');
  const [tab, setTab] = useState<TabKey>('personal');
  const [editing, setEditing] = useState<StaffEditSection | null>(null);
  const [form, setForm] = useState<StaffSectionInput>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reject flow
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  // Notes
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  // Document preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  const canEditContact = useHasCapability('REGISTRANT_EDIT_CONTACT');
  const canAddNotes = useHasCapability('REGISTRANT_ADD_NOTES');
  const currentUserId = useSession()?.id ?? null;

  const fullName = [registrant.firstName, registrant.middleName, registrant.lastName]
    .filter(Boolean)
    .join(' ');
  const initials = `${registrant.firstName?.[0] ?? ''}${registrant.lastName?.[0] ?? ''}`.toUpperCase();

  const isSubmitted = registrant.verificationStatus === 'pending_review' || registrant.registrationStatus === 'submitted';

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 4000);
  }

  function startEdit(section: StaffEditSection) {
    setErr(null);
    const r = registrant;
    if (section === 'personal') {
      setForm({
        firstName: r.firstName, lastName: r.lastName, middleName: r.middleName,
        preferredName: r.preferredName, dateOfBirth: r.dateOfBirth, gender: r.gender,
        nationality: r.nationality, dualNationality: r.dualNationality,
        countryOfBirth: r.countryOfBirth, cityOfBirth: r.cityOfBirth, generation: r.generation,
      });
    } else if (section === 'contact') {
      setForm({
        email: r.email, phonePrimary: r.phonePrimary, phoneSecondary: r.phoneSecondary,
        countryOfResidence: r.countryOfResidence, cityOfResidence: r.cityOfResidence,
        yearsAbroad: r.yearsAbroad, entryYear: r.entryYear,
      });
    } else {
      setForm({
        occupation: r.occupation, employer: r.employer, industrySector: r.industrySector,
        educationLevel: r.educationLevel, fieldOfStudy: r.fieldOfStudy,
        diasporaAssociation: r.diasporaAssociation, returnInterest: r.returnInterest,
        investmentInterest: r.investmentInterest,
      });
    }
    setEditing(section);
  }

  function saveEdit() {
    if (!editing) return;
    const section = editing;
    startTransition(async () => {
      const res = await updateRegistrantSectionAction(registrant.id, section, form);
      if (res.success) {
        setEditing(null);
        flash(t('actions.save_changes') + ' ✓');
      } else {
        setErr(res.error ?? 'Save failed.');
      }
    });
  }

  function runAction(fn: () => Promise<{ success: boolean; error?: string }>, success: string) {
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (res.success) flash(success);
      else setErr(res.error ?? 'Action failed.');
    });
  }

  function submitNote() {
    if (!noteText.trim()) return;
    startTransition(async () => {
      const res = await addNoteAction(registrant.id, noteText, noteType);
      if (res.success) {
        setNoteText('');
        flash(t('notes.add_button') + ' ✓');
      } else setErr(res.error ?? 'Failed to add note.');
    });
  }

  function saveEditNote(noteId: string) {
    startTransition(async () => {
      const res = await editNoteAction(registrant.id, noteId, editNoteText);
      if (res.success) { setEditingNoteId(null); flash('Note updated ✓'); }
      else setErr(res.error ?? 'Failed to edit note.');
    });
  }

  function togglePin(noteId: string, pinned: boolean) {
    startTransition(async () => {
      const res = await pinNoteAction(registrant.id, noteId, pinned);
      if (!res.success) setErr(res.error ?? 'Failed to pin note.');
    });
  }

  function doArchive(noteId: string) {
    startTransition(async () => {
      const res = await archiveNoteAction(registrant.id, noteId);
      if (res.success) flash('Note archived ✓');
      else setErr(res.error ?? 'Failed to archive note.');
    });
  }

  async function openPreview(doc: RegistrantDocument) {
    const url = await getSignedDocUrl(doc.storagePath);
    if (url) {
      setPreviewUrl(url);
      setPreviewName(doc.fileName);
    }
  }

  const tabs: { key: TabKey; label: string; Icon: typeof User }[] = [
    { key: 'personal', label: t('tabs.personal'), Icon: User },
    { key: 'contact', label: t('tabs.contact'), Icon: User },
    { key: 'professional', label: t('tabs.professional'), Icon: Briefcase },
    { key: 'documents', label: t('tabs.documents'), Icon: FileText },
    ...(variant === 'page'
      ? [{ key: 'consent' as TabKey, label: t('tabs.consent'), Icon: ShieldCheck }]
      : []),
    { key: 'notes', label: t('tabs.notes'), Icon: StickyNote },
    ...(variant === 'page'
      ? [{ key: 'activity' as TabKey, label: t('tabs.activity'), Icon: ActivityIcon }]
      : []),
  ];

  // ── Editable field renderer ───────────────────
  function field(key: keyof StaffSectionInput, label: string, type: 'text' | 'date' | 'number' = 'text') {
    const value = form[key];
    return (
      <label className="block">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{label}</span>
        <input
          type={type}
          value={(value as string | number | null) ?? ''}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              [key]: type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value,
            }))
          }
          className="mt-1 w-full rounded-lg border border-white/10 bg-navy px-3 py-2 text-sm text-white focus:border-gold/40 focus:outline-none"
        />
      </label>
    );
  }

  function boolField(key: 'returnInterest' | 'investmentInterest', label: string) {
    return (
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
          className="h-4 w-4 rounded border-white/20 bg-navy"
        />
        <span className="text-sm text-surface/80">{label}</span>
      </label>
    );
  }

  return (
    <div className={cn(variant === 'page' && 'mx-auto max-w-5xl')}>
      {/* Breadcrumb */}
      {variant === 'page' && (
        <nav className="mb-4 flex items-center gap-2 text-xs text-surface/50">
          <Link href="/workspace/registry" className="hover:text-gold">
            {t('breadcrumb_registry')}
          </Link>
          <span>/</span>
          <span className="text-surface/80">{fullName}</span>
        </nav>
      )}

      {/* Header card */}
      <div className="mb-6 flex flex-wrap items-start gap-5 rounded-xl border border-white/5 bg-navy-deep p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold/10 text-lg font-bold text-gold">
          {registrant.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={registrant.profilePhotoUrl} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-white">{fullName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn('rounded px-2 py-0.5 text-xs font-medium capitalize', STATUS_BADGE[registrant.registrationStatus])}>
              {registrant.registrationStatus.replace('_', ' ')}
            </span>
            <span className={cn('rounded px-2 py-0.5 text-xs font-medium capitalize', STATUS_BADGE[registrant.verificationStatus])}>
              {registrant.verificationStatus.replace('_', ' ')}
            </span>
            {registrant.isDuplicate && (
              <span className="rounded bg-red-400/15 px-2 py-0.5 text-xs font-medium text-red-400">Duplicate flagged</span>
            )}
            <span className="text-xs text-surface/50">{registrant.profileCompletenessScore}% complete</span>
          </div>
          <p className="mt-2 text-xs text-surface/50">
            Registered {fmtDate(registrant.createdAt)} · Embassy: {embassyName ?? 'Unassigned'}
          </p>
          <p className="text-xs text-surface/50">
            Nationality: {registrant.nationality || '—'} · Residence: {registrant.countryOfResidence || '—'}
            {registrant.cityOfResidence ? `, ${registrant.cityOfResidence}` : ''}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {isSubmitted && (
            <EntitlementGate capability="REGISTRANT_APPROVE">
              <button
                type="button"
                disabled={isPending}
                onClick={() => runAction(() => approveRegistrantDetailAction(registrant.id), t('actions.approve') + ' ✓')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-400/20 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> {t('actions.approve')}
              </button>
            </EntitlementGate>
          )}
          {isSubmitted && (
            <EntitlementGate capability="REGISTRANT_REJECT">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setShowReject((s) => !s)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-400/20 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> {t('actions.reject')}
              </button>
            </EntitlementGate>
          )}
          <EntitlementGate capability="REGISTRANT_FLAG_DUPLICATE">
            <button
              type="button"
              disabled={isPending || registrant.isDuplicate}
              onClick={() => runAction(() => flagDuplicateAction(registrant.id), t('actions.flag_duplicate') + ' ✓')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-surface/70 hover:text-white disabled:opacity-40"
            >
              <Copy className="h-3.5 w-3.5" /> {t('actions.flag_duplicate')}
            </button>
          </EntitlementGate>
        </div>
      </div>

      {/* Reject form */}
      {showReject && (
        <div className="mb-6 space-y-3 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
            placeholder="Reason for rejection…"
            className="w-full rounded-lg border border-white/10 bg-navy p-3 text-sm text-white focus:border-red-400/50 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending || !rejectReason.trim()}
              onClick={() =>
                runAction(async () => {
                  const r = await rejectRegistrantDetailAction(registrant.id, rejectReason);
                  if (r.success) { setShowReject(false); setRejectReason(''); }
                  return r;
                }, t('actions.reject') + ' ✓')
              }
              className="rounded-lg bg-red-400/15 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-400/25 disabled:opacity-50"
            >
              {t('actions.reject')}
            </button>
            <button type="button" onClick={() => setShowReject(false)} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-surface/60">
              {t('actions.cancel_edit')}
            </button>
          </div>
        </div>
      )}

      {/* Flash / error */}
      {msg && <div className="mb-4 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-sm text-emerald-400">{msg}</div>}
      {err && <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-2 text-sm text-red-400">{err}</div>}

      {/* Tab bar */}
      <div className="mb-5 flex flex-wrap gap-1 border-b border-white/5">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setEditing(null); }}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors',
              tab === key ? 'border-b-2 border-gold text-gold' : 'text-surface/60 hover:text-white',
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── Personal ── */}
      {tab === 'personal' && (
        <section className="rounded-xl border border-white/5 bg-navy-deep p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t('tabs.personal')}</h2>
            <EntitlementGate capability="REGISTRANT_EDIT_IDENTITY">
              {editing !== 'personal' && (
                <button type="button" onClick={() => startEdit('personal')} className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
                  <Pencil className="h-3 w-3" /> {t('actions.edit_section')}
                </button>
              )}
            </EntitlementGate>
          </div>
          {editing === 'personal' ? (
            <div className="space-y-4">
              <p className="flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" /> {t('actions.edit_warning')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {field('firstName', 'First Name')}
                {field('lastName', 'Last Name')}
                {field('middleName', 'Middle Name')}
                {field('preferredName', 'Preferred Name')}
                {field('dateOfBirth', 'Date of Birth', 'date')}
                {field('gender', 'Gender')}
                {field('nationality', 'Nationality')}
                {field('dualNationality', 'Dual Nationality')}
                {field('countryOfBirth', 'Country of Birth')}
                {field('cityOfBirth', 'City of Birth')}
                {field('generation', 'Generation')}
              </div>
              <EditBar onSave={saveEdit} onCancel={() => setEditing(null)} pending={isPending} t={t} />
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Row label="Full Name" value={fullName} />
              <Row label="Preferred Name" value={registrant.preferredName} />
              <Row label="Date of Birth" value={registrant.dateOfBirth ? `${fmtDate(registrant.dateOfBirth)}${ageFrom(registrant.dateOfBirth)}` : '—'} />
              <Row label="Gender" value={registrant.gender} />
              <Row label="Nationality" value={registrant.nationality} />
              <Row label="Dual Nationality" value={registrant.dualNationality} />
              <Row label="Country of Birth" value={registrant.countryOfBirth} />
              <Row label="City of Birth" value={registrant.cityOfBirth} />
              <Row label="Generation" value={registrant.generation} />
            </dl>
          )}
        </section>
      )}

      {/* ── Contact ── */}
      {tab === 'contact' && (
        <section className="rounded-xl border border-white/5 bg-navy-deep p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t('tabs.contact')}</h2>
            {canEditContact && editing !== 'contact' && (
              <button type="button" onClick={() => startEdit('contact')} className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
                <Pencil className="h-3 w-3" /> {t('actions.edit_section')}
              </button>
            )}
          </div>
          {editing === 'contact' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {field('email', 'Email')}
                {field('phonePrimary', 'Primary Phone')}
                {field('phoneSecondary', 'Secondary Phone')}
                {field('countryOfResidence', 'Country of Residence')}
                {field('cityOfResidence', 'City of Residence')}
                {field('yearsAbroad', 'Years Abroad', 'number')}
                {field('entryYear', 'Year Arrived', 'number')}
              </div>
              <EditBar onSave={saveEdit} onCancel={() => setEditing(null)} pending={isPending} t={t} />
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Row label="Email" value={registrant.email} />
              <Row label="Primary Phone" value={registrant.phonePrimary} />
              <Row label="Secondary Phone" value={registrant.phoneSecondary} />
              <Row label="Country of Residence" value={registrant.countryOfResidence} />
              <Row label="City of Residence" value={registrant.cityOfResidence} />
              <Row label="Years Abroad" value={registrant.yearsAbroad?.toString()} />
              <Row label="Year Arrived" value={registrant.entryYear?.toString()} />
            </dl>
          )}
        </section>
      )}

      {/* ── Professional ── */}
      {tab === 'professional' && (
        <section className="rounded-xl border border-white/5 bg-navy-deep p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">{t('tabs.professional')}</h2>
            <EntitlementGate capability="REGISTRANT_EDIT_PROFESSIONAL">
              {editing !== 'professional' && (
                <button type="button" onClick={() => startEdit('professional')} className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
                  <Pencil className="h-3 w-3" /> {t('actions.edit_section')}
                </button>
              )}
            </EntitlementGate>
          </div>
          {editing === 'professional' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {field('occupation', 'Occupation')}
                {field('employer', 'Employer')}
                {field('industrySector', 'Industry Sector')}
                {field('educationLevel', 'Education Level')}
                {field('fieldOfStudy', 'Field of Study')}
                {field('diasporaAssociation', 'Diaspora Association')}
              </div>
              <div className="flex gap-6">
                {boolField('returnInterest', 'Interest in Returning')}
                {boolField('investmentInterest', 'Interest in Investing')}
              </div>
              <EditBar onSave={saveEdit} onCancel={() => setEditing(null)} pending={isPending} t={t} />
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Row label="Occupation" value={registrant.occupation} />
              <Row label="Employer" value={registrant.employer} />
              <Row label="Industry Sector" value={registrant.industrySector} />
              <Row label="Education Level" value={registrant.educationLevel} />
              <Row label="Field of Study" value={registrant.fieldOfStudy} />
              <Row label="Diaspora Association" value={registrant.diasporaAssociation} />
              <Row label="Interest in Returning" value={registrant.returnInterest ? 'Yes' : 'No'} />
              <Row label="Interest in Investing" value={registrant.investmentInterest ? 'Yes' : 'No'} />
            </dl>
          )}
        </section>
      )}

      {/* ── Documents ── */}
      {tab === 'documents' && (
        <EntitlementGate
          capability="REGISTRANT_VIEW_DOCUMENTS"
          fallback={<FallbackMsg text={t('documents.no_access')} />}
        >
          <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
            {documents.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-surface/50">No documents uploaded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-semibold uppercase tracking-widest text-surface/40">
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">File</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Uploaded</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {documents.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3 capitalize text-surface/80">{d.documentType.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-surface/70">{d.fileName}</td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded px-2 py-0.5 text-xs capitalize', STATUS_BADGE[d.status] ?? 'bg-white/5 text-surface/50')}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-surface/50">{fmtDate(d.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => openPreview(d)} className="rounded p-1 text-surface/60 hover:text-gold" title={t('documents.preview')}>
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isPending || d.status === 'verified'}
                            onClick={() => runAction(() => reviewDocumentAction(d.id, registrant.id, 'verified'), t('documents.approve_doc') + ' ✓')}
                            className="rounded p-1 text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-30"
                            title={t('documents.approve_doc')}
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isPending || d.status === 'rejected'}
                            onClick={() => runAction(() => reviewDocumentAction(d.id, registrant.id, 'rejected', 'Rejected by reviewer'), t('documents.reject_doc') + ' ✓')}
                            className="rounded p-1 text-red-400 hover:bg-red-400/10 disabled:opacity-30"
                            title={t('documents.reject_doc')}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </EntitlementGate>
      )}

      {/* ── Consent ── */}
      {tab === 'consent' && (
        <EntitlementGate
          capability="REGISTRANT_VIEW_CONSENT"
          fallback={<FallbackMsg text={t('consent.no_access')} />}
        >
          <section className="rounded-xl border border-white/5 bg-navy-deep p-6">
            {!consent ? (
              <p className="text-sm text-surface/50">No consent record on file.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Row label={t('consent.type')} value={consent.consentType} />
                <Row label={t('consent.version')} value={consent.consentVersion} />
                <Row label={t('consent.language')} value={consent.consentLanguage} />
                <Row label="Consented" value={consent.consented ? 'Yes' : 'No'} />
                <Row label={t('consent.captured_at')} value={fmtDateTime(consent.capturedAt)} />
                <Row label="Withdrawn" value={consent.withdrawnAt ? fmtDateTime(consent.withdrawnAt) : 'No'} />
                <div className="col-span-2 md:col-span-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-widest text-surface/40">{t('consent.view_full_text')}</dt>
                  <dd className="mt-1 rounded-lg border border-white/5 bg-navy p-3 text-xs leading-relaxed text-surface/70">
                    {consent.consentTextSnapshot}
                  </dd>
                </div>
              </dl>
            )}
          </section>
        </EntitlementGate>
      )}

      {/* ── Notes ── */}
      {tab === 'notes' && (
        <section className="space-y-4">
          {canAddNotes && (
            <div className="rounded-xl border border-white/5 bg-navy-deep p-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder={t('notes.add_placeholder')}
                className="w-full rounded-lg border border-white/10 bg-navy p-3 text-sm text-white focus:border-gold/40 focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <select value={noteType} onChange={(e) => setNoteType(e.target.value)} className="rounded-lg border border-white/10 bg-navy px-2 py-1.5 text-xs text-surface/70 focus:outline-none">
                  {NOTE_TYPES.map((nt) => <option key={nt.value} value={nt.value}>{nt.label}</option>)}
                </select>
                <button
                  type="button"
                  disabled={isPending || !noteText.trim()}
                  onClick={submitNote}
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest hover:opacity-90 disabled:opacity-40"
                >
                  {t('notes.add_button')}
                </button>
              </div>
            </div>
          )}
          {notes.length === 0 ? (
            <p className="rounded-xl border border-white/5 bg-navy-deep px-6 py-8 text-center text-sm text-surface/50">
              {t('notes.empty')}
            </p>
          ) : (
            <ul className="space-y-3">
              {notes.map((n) => (
                <li key={n.id} className={cn('rounded-xl border bg-navy-deep p-4', n.isPinned ? 'border-gold/30' : 'border-white/5')}>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {n.isPinned && <Pin className="h-3 w-3 text-gold" />}
                    <span className="text-sm font-medium text-white">{n.authorName}</span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-surface/50">{n.authorRole.replace('_', ' ')}</span>
                    <span className={cn('rounded px-1.5 py-0.5 text-[10px] uppercase', NOTE_TYPE_BADGE[n.noteType] ?? 'bg-white/5 text-surface/50')}>{NOTE_TYPE_LABEL[n.noteType] ?? n.noteType}</span>
                    <span className="text-[10px] text-surface/40">{fmtDateTime(n.createdAt)}{n.editedAt ? ' · edited' : ''}</span>
                    {canAddNotes && (
                      <span className="ml-auto flex items-center gap-1">
                        <button type="button" onClick={() => togglePin(n.id, !n.isPinned)} title={n.isPinned ? 'Unpin' : 'Pin'} className="rounded p-1 text-surface/50 hover:text-gold"><Pin className="h-3.5 w-3.5" /></button>
                        {n.authorId === currentUserId && (
                          <button type="button" onClick={() => { setEditingNoteId(n.id); setEditNoteText(n.noteText); }} title="Edit" className="rounded p-1 text-surface/50 hover:text-gold"><Pencil className="h-3.5 w-3.5" /></button>
                        )}
                        <button type="button" onClick={() => doArchive(n.id)} title="Archive" className="rounded p-1 text-surface/50 hover:text-red-400"><Archive className="h-3.5 w-3.5" /></button>
                      </span>
                    )}
                  </div>
                  {editingNoteId === n.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea value={editNoteText} onChange={(e) => setEditNoteText(e.target.value)} rows={2} className="w-full rounded-lg border border-white/10 bg-navy p-2 text-sm text-white focus:border-gold/40 focus:outline-none" />
                      <div className="flex gap-2">
                        <button type="button" disabled={isPending} onClick={() => saveEditNote(n.id)} className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy-deepest hover:opacity-90 disabled:opacity-40">Save</button>
                        <button type="button" onClick={() => setEditingNoteId(null)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-surface/60">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-surface/80">{n.noteText}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── Activity ── */}
      {tab === 'activity' && (
        <section className="overflow-hidden rounded-xl border border-white/5 bg-navy-deep">
          {activity.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-surface/50">No activity recorded.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-4 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{a.action.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-surface/40">
                      {a.userEmail ?? 'system'} · {a.userRole ?? '—'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-surface/40">{fmtDateTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Open full profile (panel variant) */}
      {variant === 'panel' && (
        <div className="mt-6">
          <Link
            href={`/workspace/registrant/${registrant.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
          >
            {t('actions.open_full_profile')} →
          </Link>
        </div>
      )}

      {/* Document preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-white/10 bg-navy-deep" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="truncate text-sm font-medium text-white">{previewName}</p>
              <div className="flex items-center gap-2">
                <a href={previewUrl} download className="rounded p-1 text-surface/60 hover:text-gold"><Download className="h-4 w-4" /></a>
                <button type="button" onClick={() => setPreviewUrl(null)} className="rounded p-1 text-surface/60 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {/\.pdf($|\?)/i.test(previewUrl) ? (
                <iframe src={previewUrl} title={previewName} className="h-[70vh] w-full rounded" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={previewName} className="mx-auto max-h-[70vh] rounded object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditBar({
  onSave,
  onCancel,
  pending,
  t,
}: {
  onSave: () => void;
  onCancel: () => void;
  pending: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex gap-2">
      <button type="button" onClick={onSave} disabled={pending} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-navy-deepest hover:opacity-90 disabled:opacity-40">
        {t('actions.save_changes')}
      </button>
      <button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-surface/60 hover:text-white">
        {t('actions.cancel_edit')}
      </button>
    </div>
  );
}

function FallbackMsg({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-navy-deep px-6 py-10 text-center">
      <p className="text-sm text-surface/50">{text}</p>
    </div>
  );
}
