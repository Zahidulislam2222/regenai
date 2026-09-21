import {defineConfig, loadEnv} from 'vite';
import {fileURLToPath} from 'node:url';
import {previewSettings} from './preview/settings';
const directory = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));
export default defineConfig(({mode}) => {
  const settings = previewSettings({
    ...loadEnv(mode, directory('./preview'), 'FRONTEND_'),
    ...process.env,
  });
  return {
    root: directory('./preview'),
    publicDir: directory('./public'),
    envDir: directory('./preview'),
    envPrefix: 'PREVIEW_PUBLIC_',
    esbuild: {jsx: 'automatic'},
    resolve: {alias: {'~': directory('./app')}},
    server: {
      ...settings,
      strictPort: true,
      fs: {
        deny: [
          '**/.env*',
          '**/.git/**',
          '**/CREDENTIALS.md',
          '**/PROJECT-DOSSIER.md',
          '**/memory/**',
          '**/my-project-view/**',
          '**/*.pem',
          '**/*.key',
        ],
      },
    },
    build: {
      outDir: directory('./dist/frontend'),
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {output: {manualChunks: {three: ['three']}}},
    },
    preview: {...settings, strictPort: true},
  };
});
