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

  // Automatically place host platform Node.js binary into src-tauri/binaries
  const binariesDir = path.join(rootDir, 'src-tauri', 'binaries');
  fs.mkdirSync(binariesDir, { recursive: true });
  const nodeBinaryName = process.platform === 'win32' ? 'node.exe' : 'node';
  const targetNodePath = path.join(binariesDir, nodeBinaryName);
  if (!fs.existsSync(targetNodePath) && fs.existsSync(process.execPath)) {
    try {
      fs.copyFileSync(process.execPath, targetNodePath);
      if (process.platform !== 'win32') {
        fs.chmodSync(targetNodePath, 0o755);
      }
      console.log(`[Standalone] Copied Node runtime (${process.execPath}) to ${targetNodePath}`);
    } catch (err) {
      console.warn('[Standalone] Could not copy process.execPath:', err);
    }
  }
}


