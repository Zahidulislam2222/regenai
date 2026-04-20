import type {Config} from '@react-router/dev/config';

export default {
  ssr: true,
  future: {
    // CRITICAL — satisfies React Router v7.9+'s internal
    // `hasReactRouterRscPlugin` check AND aligns the client + SSR
    // manifest paths (both must agree on `build/client/.vite/manifest.json`).
    // Without this flag: client output goes to `dist/` while SSR phase
    // looks in `build/`, causing ENOENT at build time.
    unstable_viteEnvironmentApi: true,
  },
} satisfies Config;
