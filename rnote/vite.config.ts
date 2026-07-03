/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// RNOTE runs as a pure client-side, local-first app (see docs/adr/0001-vite-over-nextjs.md).
// Vite is the canonical bundler for a Tauri desktop shell and gives us instant HMR
// with zero server runtime — exactly what an offline-first product needs.
export default defineConfig({
  plugins: [
    react(),
    // Offline app-shell caching. autoUpdate + skipWaiting + cleanupOutdatedCaches
    // means a new deploy always supersedes the cache — users can't get stranded
    // on a stale build. Uses the existing public/manifest.webmanifest.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
      '@application': fileURLToPath(new URL('./src/application', import.meta.url)),
      '@infrastructure': fileURLToPath(new URL('./src/infrastructure', import.meta.url)),
      '@presentation': fileURLToPath(new URL('./src/presentation', import.meta.url)),
    },
  },
  // Tauri expects a fixed port and does not want vite to obscure rust errors.
  server: { port: 1420, strictPort: false },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        // Split heavy, independently-cacheable vendors so a code change doesn't
        // invalidate the editor engine, and the initial payload parallelises.
        manualChunks: {
          react: ['react', 'react-dom'],
          editor: [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-task-list',
            '@tiptap/extension-task-item',
          ],
          motion: ['framer-motion'],
          search: ['flexsearch'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/domain/**', 'src/application/**'],
    },
  },
});
