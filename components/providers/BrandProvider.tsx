'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import type { CountryBrand } from '@/lib/services/branding/branding.service';
import type { DeploymentTier } from '@/lib/branding/tier-rules';

interface BrandContextValue {
  brand: CountryBrand | null;
  isLoading: boolean;
  tier: DeploymentTier;
}

const BrandContext = createContext<BrandContextValue>({
  brand: null,
  isLoading: true,
  tier: 'cloud',
});

export function BrandProvider({
  initialBrand,
  tier,
  children,
}: {
  initialBrand: CountryBrand | null;
  tier: DeploymentTier;
  children: React.ReactNode;
}) {
  const [brand] = useState<CountryBrand | null>(initialBrand);

  // Apply brand tokens to :root on mount and brand change.
  useEffect(() => {
    if (!brand) return;
    const root = document.documentElement;

    root.style.setProperty('--civis-brand-primary', brand.palette.primary);
    root.style.setProperty('--civis-brand-secondary', brand.palette.secondary);
    if (brand.palette.accent) {
      root.style.setProperty('--civis-brand-accent', brand.palette.accent);
    }
    root.style.setProperty('--civis-brand-neutral-dark', brand.palette.neutralDark);
    root.style.setProperty('--civis-brand-neutral-light', brand.palette.neutralLight);

    if (brand.palette.surface[50]) root.style.setProperty('--civis-surface-50', brand.palette.surface[50]);
    if (brand.palette.surface[100]) root.style.setProperty('--civis-surface-100', brand.palette.surface[100]);
    if (brand.palette.surface[500]) root.style.setProperty('--civis-surface-500', brand.palette.surface[500]);
    if (brand.palette.surface[700]) root.style.setProperty('--civis-surface-700', brand.palette.surface[700]);
    if (brand.palette.surface[900]) root.style.setProperty('--civis-surface-900', brand.palette.surface[900]);

    root.setAttribute('data-brand', brand.countryCode.toLowerCase());
    root.setAttribute('data-tier', tier);
  }, [brand, tier]);

  return (
    <BrandContext.Provider value={{ brand, isLoading: false, tier }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextValue {
  return useContext(BrandContext);
}
