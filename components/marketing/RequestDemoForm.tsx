'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/**
 * Mission 001 placeholder request-demo flow — captures the field set and shows
 * a localized confirmation. CRM routing to the Afronovation pipeline arrives
 * with the service layer in a later mission; no data leaves the browser here.
 */
export function RequestDemoForm() {
  const t = useTranslations('Contact.form');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center gap-4 rounded-lg border border-success-teal/40 bg-white p-12 text-center"
        role="status"
      >
        <CheckCircle2 className="h-10 w-10 text-success-teal" aria-hidden="true" />
        <h2 className="text-subheading text-navy">{t('confirmationTitle')}</h2>
        <p className="max-w-md text-sm leading-relaxed text-ink">{t('confirmationBody')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate={false}>
      <div className="space-y-2">
        <Label htmlFor="fullName">{t('fullName.label')}</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          placeholder={t('fullName.placeholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="government">{t('government.label')}</Label>
        <Input
          id="government"
          name="government"
          autoComplete="organization"
          required
          placeholder={t('government.placeholder')}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="country">{t('country.label')}</Label>
          <Input
            id="country"
            name="country"
            autoComplete="country-name"
            required
            placeholder={t('country.placeholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">{t('role.label')}</Label>
          <Input
            id="role"
            name="role"
            autoComplete="organization-title"
            required
            placeholder={t('role.placeholder')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{t('message.label')}</Label>
        <Textarea id="message" name="message" required placeholder={t('message.placeholder')} />
      </div>

      <div className="space-y-4">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          {t('submit')}
        </Button>
        <p className="text-xs leading-relaxed text-neutral-500">{t('privacyNote')}</p>
      </div>
    </form>
  );
}
