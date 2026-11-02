import { build } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, 'src');
const distDir = path.resolve(__dirname, 'dist');

async function runBuild() {
  // Build index.tsx
  await build({
    root: __dirname,
    base: './',
    build: {
      outDir: distDir,
      emptyOutDir: false,
      minify: true,
      rollupOptions: {
        input: path.resolve(srcDir, 'index.tsx'),
        output: {
          dir: distDir,
          format: 'iife',
          entryFileNames: 'index.js',
        },
      },
    },
  });

  // Build overlay/main.ts
  await build({
    root: __dirname,
    base: './',
    build: {
      outDir: distDir,
      emptyOutDir: false,
      minify: true,
      rollupOptions: {
        input: path.resolve(srcDir, 'overlay', 'main.ts'),
        output: {
          dir: distDir,
          format: 'iife',
          entryFileNames: 'overlay.js',
        },
      },
    },
  });

  // Copy static overlay assets to dist/.
  fs.copyFileSync(
    path.resolve(srcDir, 'overlay', 'overlay.html'),
    path.resolve(distDir, 'overlay.html'),
  );
  fs.copyFileSync(
    path.resolve(srcDir, 'overlay', 'overlay.css'),
    path.resolve(distDir, 'overlay.css'),
  );

  console.log('Build complete: dist/index.js + dist/overlay.js/html/css generated.');
}
runBuild();
