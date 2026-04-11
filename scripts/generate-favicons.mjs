/**
 * generate-favicons.mjs
 * Genera los favicons de ClinicBoard desde logo-mark.svg usando sharp.
 * Uso: node scripts/generate-favicons.mjs
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svgPath = resolve(root, 'public/brand/logo-mark.svg');
const svgBuffer = readFileSync(svgPath);

const sizes = [
  { size: 16,  name: 'favicon-16x16.png' },
  { size: 32,  name: 'favicon-32x32.png' },
  { size: 48,  name: 'favicon-48x48.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
];

mkdirSync(resolve(root, 'public/brand'), { recursive: true });

for (const { size, name } of sizes) {
  const outPath = resolve(root, 'public/brand', name);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✅  ${name} (${size}×${size})`);
}

// Favicon.ico — usa el 32x32 como base con sips (macOS)
// sharp no genera .ico nativamente; lo notar en el output.
console.log('\n🎉 Favicons generados en public/brand/');
console.log('💡 Para favicon.ico, ejecuta:');
console.log('   sips -s format icns public/brand/icon-512x512.png --out public/brand/icon.icns');
