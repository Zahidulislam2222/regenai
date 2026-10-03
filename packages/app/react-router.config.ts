import type {Config} from '@react-router/dev/config';
import process from 'node:process';

export default {
  ssr: true,
  buildDirectory: process.env.REGENAI_APP_BUILD_DIRECTORY ?? 'build',
  future: {
    // CRITICAL — satisfies React Router v7.9+'s internal
    // `hasReactRouterRscPlugin` check AND aligns the client + SSR
    // manifest paths (both must agree on `build/client/.vite/manifest.json`).
    // Without this flag: client output goes to `dist/` while SSR phase
    // looks in `build/`, causing ENOENT at build time.
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
