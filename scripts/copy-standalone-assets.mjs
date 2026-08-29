import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');

if (fs.existsSync(standaloneDir)) {
  if (fs.existsSync(staticSrc)) {
    fs.cpSync(staticSrc, staticDest, { recursive: true });
    console.log('[Standalone] Copied .next/static to .next/standalone/.next/static');
  }
  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true });
    console.log('[Standalone] Copied public to .next/standalone/public');
  }
}
