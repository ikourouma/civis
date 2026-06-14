// Generate Civis favicon assets from a shape-based "C." mark.
// Shapes (not fonts) so rendering is deterministic across platforms.
// Run: npx tsx scripts/generate-favicons.ts
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const NAVY = '#0D1B2E';
const GOLD = '#C9A84C';
const WHITE = '#FFFFFF';

// 512x512 source. The "C" is an open ring (gap facing right); a gold dot sits
// lower-right. cornerRadius rounds the navy backdrop for app icons.
function markSvg(cornerRadius: number): string {
  const cx = 205;
  const cy = 256;
  const r = 150;
  // 3/4 visible ring, 1/4 gap, rotated so the opening faces right.
  const circumference = 2 * Math.PI * r;
  const visible = circumference * 0.72;
  const gap = circumference - visible;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${cornerRadius}" ry="${cornerRadius}" fill="${NAVY}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${WHITE}" stroke-width="58"
          stroke-linecap="round" stroke-dasharray="${visible} ${gap}"
          transform="rotate(45 ${cx} ${cy})"/>
  <circle cx="392" cy="372" r="48" fill="${GOLD}"/>
</svg>`;
}

async function main() {
  const pub = resolve(process.cwd(), 'public');
  const squareSvg = Buffer.from(markSvg(0)); // square (tabs, android)
  const roundedSvg = Buffer.from(markSvg(96)); // rounded (apple touch icon)

  const targets: { file: string; size: number; src: Buffer }[] = [
    { file: 'favicon-16x16.png', size: 16, src: squareSvg },
    { file: 'favicon-32x32.png', size: 32, src: squareSvg },
    { file: 'android-chrome-192x192.png', size: 192, src: squareSvg },
    { file: 'android-chrome-512x512.png', size: 512, src: squareSvg },
    { file: 'apple-touch-icon.png', size: 180, src: roundedSvg },
  ];

  for (const t of targets) {
    await sharp(t.src).resize(t.size, t.size).png().toFile(resolve(pub, t.file));
    console.log(`  + ${t.file} (${t.size}x${t.size})`);
  }

  // favicon.ico from 16 + 32 PNG buffers
  const png16 = await sharp(squareSvg).resize(16, 16).png().toBuffer();
  const png32 = await sharp(squareSvg).resize(32, 32).png().toBuffer();
  const ico = await pngToIco([png16, png32]);
  writeFileSync(resolve(pub, 'favicon.ico'), ico);
  console.log('  + favicon.ico (16, 32)');

  console.log('\nFavicon assets generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
