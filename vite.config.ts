import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

// Emits sw.js with the exact list of built files, so the app works offline after one visit.
function serviceWorker(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const pub = readdirSync('public', { recursive: true, withFileTypes: true })
        .filter((f) => f.isFile() && !f.name.endsWith('.txt'))
        .map((f) => `${f.parentPath.replace(/\\/g, '/').replace(/^public\/?/, '')}/${f.name}`.replace(/^\//, ''));
      const assets = [...Object.keys(bundle).filter((f) => f !== 'index.html'), ...pub];
      const source = readFileSync('sw.js', 'utf8')
        .replace('__VERSION__', Date.now().toString(36))
        .replace('__ASSETS__', JSON.stringify(assets));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './', // relative paths work on GitHub Pages under /<repo>/ and locally
  plugins: [serviceWorker()],
});
