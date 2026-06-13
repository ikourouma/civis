'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Footer newsletter subscribe — UI only in Mission 001-A, no email
 * service integration. Shows a translated confirmation on submit.
 */
export function NewsletterForm() {
  const t = useTranslations('Footer.newsletter');
  const [submitted, setSubmitted] = React.useState(false);

  if (submitted) {
    return <p className="text-sm text-gold">{t('confirmation')}</p>;
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <Label htmlFor="newsletter-email" className="text-xs uppercase tracking-widest text-gold">
        {t('title')}
      </Label>
      <div className="flex gap-2">
        <Input
          id="newsletter-email"
          type="email"
          required
          placeholder={t('placeholder')}
          className="border-surface/20 bg-navy-deep text-surface placeholder:text-surface/50"
        />
        <Button type="submit" variant="gold" size="default" className="shrink-0">
          {t('button')}
        </Button>
      </div>
    </form>
  );
}
