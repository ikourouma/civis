import type { Config } from 'tailwindcss';

/**
 * Civis Sovereign Design System — Tailwind configuration.
 *
 * Brand tokens per Mission 001 and Doc 07 (Sovereign Design System v2.0).
 * Spacing follows the 8-point grid (Tailwind's default 4px scale is compliant).
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        // Runtime country-branding tokens — Mission 005-A.2 (resolve via CSS vars)
        'brand-primary': 'var(--civis-brand-primary)',
        'brand-secondary': 'var(--civis-brand-secondary)',
        'brand-accent': 'var(--civis-brand-accent)',
        'brand-neutral-dark': 'var(--civis-brand-neutral-dark)',
        'brand-neutral-light': 'var(--civis-brand-neutral-light)',
        'surface-50': 'var(--civis-surface-50)',
        'surface-100': 'var(--civis-surface-100)',
        'surface-500': 'var(--civis-surface-500)',
        'surface-700': 'var(--civis-surface-700)',
        'surface-900': 'var(--civis-surface-900)',
        // Civis brand tokens — Mission 001
        navy: {
          DEFAULT: '#2A3F62',
          deep: '#1B2A4A', // Sovereign Navy — Doc 07
          deepest: '#0D1B2E', // Hero / closing CTA surfaces — Mission 001-A
          panel: '#1A2C42', // Dark intelligence panel surface — Mission 001-A
        },
        gold: {
          DEFAULT: '#C9A84C', // Strategic Gold — accent only, never a background
        },
        surface: {
          DEFAULT: '#EAF2FA', // Light Blue surface
        },
        ink: {
          DEFAULT: '#2D2D2D', // Dark Gray text
        },
        // Semantic intelligence palette — Doc 07
        intelligence: '#2E6FD6',
        'alert-amber': '#D97706',
        'success-teal': '#0D9488',
        neutral: {
          100: '#F5F7FA',
          200: '#E4E9F0',
          500: '#8896A7',
          800: '#2C3A4A',
        },
        // shadcn/ui theme variables
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        // Runtime brand typography — Mission 005-A.2
        display: 'var(--civis-font-display)',
        body: 'var(--civis-font-body)',
      },
      fontSize: {
        // Sovereign typography scale — Doc 07
        'display-lg': ['3rem', { lineHeight: '1.1', fontWeight: '700' }], // H1 48px
        display: ['2.25rem', { lineHeight: '1.15', fontWeight: '700' }], // H1 36px
        'heading-lg': ['2rem', { lineHeight: '1.2', fontWeight: '600' }], // H2 32px
        heading: ['1.75rem', { lineHeight: '1.25', fontWeight: '600' }], // H2 28px
        subheading: ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }], // H3 24px
        'body-lg': ['1rem', { lineHeight: '1.5' }], // Body primary 16px
        body: ['0.875rem', { lineHeight: '1.5' }], // Body secondary 14px
        label: ['0.8125rem', { lineHeight: '1.4', fontWeight: '500' }], // Data labels 13px
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
