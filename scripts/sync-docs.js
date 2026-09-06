import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'packages', 'dashboard', 'dist');
const destDir = path.join(root, 'docs');

if (fs.existsSync(srcDir)) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.cpSync(srcDir, destDir, { recursive: true });
  fs.copyFileSync(path.join(srcDir, 'index.html'), path.join(destDir, '404.html'));
  fs.writeFileSync(path.join(destDir, '.nojekyll'), '');
  console.log('✓ Successfully synced dashboard build to /docs with .nojekyll and 404.html');
}
