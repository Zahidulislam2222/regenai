import {reactRouter} from '@react-router/dev/vite';
import {cloudflare} from '@cloudflare/vite-plugin';
import {defineConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Canonical Cloudflare template order. Do not reorder.
export default defineConfig({
  plugins: [
    cloudflare({viteEnvironment: {name: 'ssr'}}),
    reactRouter(),
    tsconfigPaths(),
  ],
});
