import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'packages', 'dashboard', 'dist');
const docsDir = path.join(root, 'docs');

if (fs.existsSync(srcDir)) {
  // 1. Sync to root (for GitHub Pages "Deploy from branch -> / (root)")
  fs.copyFileSync(path.join(srcDir, 'index.html'), path.join(root, 'index.html'));
  fs.copyFileSync(path.join(srcDir, 'index.html'), path.join(root, '404.html'));
  fs.writeFileSync(path.join(root, '.nojekyll'), '');
  if (fs.existsSync(path.join(srcDir, 'favicon.svg'))) {
    fs.copyFileSync(path.join(srcDir, 'favicon.svg'), path.join(root, 'favicon.svg'));
  }
  const assetsSrc = path.join(srcDir, 'assets');
  const assetsDest = path.join(root, 'assets');
  if (fs.existsSync(assetsSrc)) {
    fs.cpSync(assetsSrc, assetsDest, { recursive: true });
  }

  // 2. Sync to docs/ (for GitHub Pages "Deploy from branch -> /docs")
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  fs.cpSync(srcDir, docsDir, { recursive: true });
  fs.copyFileSync(path.join(srcDir, 'index.html'), path.join(docsDir, '404.html'));
  fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

  console.log('✓ Successfully synced dashboard build to both / (root) and /docs with .nojekyll and 404.html');
}
