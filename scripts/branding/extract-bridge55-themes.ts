// Extract per-country brand tokens from the Bridge55 master theme file.
// Parses `[data-country="xx"] { --primary: ...; ... }` blocks and writes JSON.
// Run: npx tsx scripts/branding/extract-bridge55-themes.ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SOURCE =
  process.env.BRIDGE55_THEMES_CSS ??
  'C:\\Users\\ikour\\Projects\\bridge55\\packages\\shared\\css\\country-themes.css';

const OUT = resolve(process.cwd(), 'scripts/branding/data/bridge55-themes.json');

export interface Bridge55Theme {
  countryCode: string; // uppercase ISO alpha-2
  primary: string;
  primaryDark?: string;
  primaryLight?: string;
  secondary?: string;
  accent?: string;
}

function extractVar(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`--${name}\\s*:\\s*(#[0-9A-Fa-f]{3,8})`));
  return m && m[1] ? m[1].toUpperCase() : undefined;
}

function main() {
  console.log(`Reading Bridge55 themes from:\n  ${SOURCE}\n`);
  const css = readFileSync(SOURCE, 'utf-8');

  // Match each `[data-country="xx"] { ... }` rule block.
  const blockRe = /\[data-country="([a-z]{2})"\]\s*\{([^}]*)\}/g;
  const themes: Bridge55Theme[] = [];

  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(css)) !== null) {
    const code = match[1]?.toUpperCase();
    const block = match[2];
    if (!code || !block) continue;
    const primary = extractVar(block, 'primary');
    if (!primary) continue;
    themes.push({
      countryCode: code,
      primary,
      primaryDark: extractVar(block, 'primary-dark'),
      primaryLight: extractVar(block, 'primary-light'),
      secondary: extractVar(block, 'secondary'),
      accent: extractVar(block, 'accent'),
    });
  }

  themes.sort((a, b) => a.countryCode.localeCompare(b.countryCode));

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(themes, null, 2) + '\n', 'utf-8');

  console.log(`Extracted ${themes.length} country themes:`);
  console.log(`  ${themes.map((t) => t.countryCode).join(', ')}`);
  console.log(`\nWrote ${OUT}`);
}

main();
