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

  // Copy to src-tauri/standalone for clean Tauri bundle packaging
  const tauriStandaloneDir = path.join(rootDir, 'src-tauri', 'standalone');
  if (fs.existsSync(tauriStandaloneDir)) {
    fs.rmSync(tauriStandaloneDir, { recursive: true, force: true });
  }
  fs.cpSync(standaloneDir, tauriStandaloneDir, { recursive: true });
  console.log('[Standalone] Copied .next/standalone to src-tauri/standalone for bundle packaging');
}

