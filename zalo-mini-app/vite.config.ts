import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'www';

const zmpBuildAdapter = () => ({
  name: 'zmp-build-adapter',
  apply: 'build' as const,
  closeBundle() {
    const rootDir = __dirname;
    const builtIndexPath = path.resolve(rootDir, outDir, 'index.html');
    const appConfigSource = path.resolve(rootDir, 'app-config.json');
    const appConfigTarget = path.resolve(rootDir, outDir, 'app-config.json');

    if (fs.existsSync(builtIndexPath)) {
      const html = fs.readFileSync(builtIndexPath, 'utf8');
      const cleaned = html.replace(
        /\s*<script type="module"[^>]*src="\/assets\/index\.js"><\/script>\s*/i,
        '\n'
      );
      fs.writeFileSync(builtIndexPath, cleaned, 'utf8');
    }

    if (fs.existsSync(appConfigSource)) {
      fs.copyFileSync(appConfigSource, appConfigTarget);
    }
  },
});

export default defineConfig({
  plugins: [react(), zmpBuildAdapter()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir,
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
